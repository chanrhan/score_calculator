type IngestMode = 'upsert' | 'insert' | 'update';

type Repo = {
  upsertAdmissions?: (rows: any[]) => Promise<void>;
  upsertUnits?: (rows: any[]) => Promise<void>;
  upsertCurricula?: (rows: any[]) => Promise<void>;
};

// 데이터 정제 함수 - UTF-8 인코딩 문제 해결
function sanitizeString(value: any): string {
  if (value === null || value === undefined) return ''
  
  let str = String(value)
  
  // null 바이트(0x00) 제거
  str = str.replace(/\0/g, '')
  
  // 기타 제어 문자 제거 (탭, 개행, 캐리지 리턴은 유지)
  str = str.replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  // 앞뒤 공백 제거
  str = str.trim()
  
  return str
}

// 객체의 모든 문자열 값 정제
function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      )
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

export async function ingestRows({
  resource,
  rows,
  mode,
  repo,
  eventName = 'data:ingest',
}: {
  resource: 'admissions' | 'units' | 'curricula';
  rows: any[];
  mode: IngestMode;
  repo: Repo;
  eventName?: string;
}): Promise<{ inserted: number; updated: number; skipped: number; durationMs: number }> {
  const started = Date.now();
  const total = rows.length;
  
  // 진행률 이벤트 시작
  const { emitProgress } = await import('@/lib/socket-server');
  emitProgress(eventName, { pct: 0, status: 'started' });

  // 청크 처리 (예: 100행 단위)
  const chunkSize = 100;
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < total; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    
    // 데이터 정제 적용
    const sanitizedChunk = chunk.map(row => sanitizeObject(row));
    
    try {
      if (resource === 'admissions' && repo.upsertAdmissions) {
        await repo.upsertAdmissions(sanitizedChunk);
        inserted += sanitizedChunk.length; // 간단화: 실제로는 DB 결과에 따라 분기
      } else if (resource === 'units' && repo.upsertUnits) {
        await repo.upsertUnits(sanitizedChunk);
        inserted += sanitizedChunk.length;
      } else if (resource === 'curricula' && repo.upsertCurricula) {
        await repo.upsertCurricula(sanitizedChunk);
        inserted += sanitizedChunk.length;
      }
    } catch (error: any) {
      console.error(`${resource} 데이터 처리 중 오류 (청크 ${i}-${i + chunkSize}):`, error);
      
      // UTF-8 인코딩 오류인 경우 구체적인 메시지 제공
      if (error?.message?.includes('UTF8') || error?.message?.includes('0x00')) {
        throw new Error(`${resource} 데이터에 UTF-8 인코딩에 문제가 있는 문자가 포함되어 있습니다. 엑셀 파일을 다시 저장하거나 데이터를 확인해주세요.`);
      }
      
      // 기타 데이터베이스 오류
      if (error?.message?.includes('prisma') || error?.message?.includes('database')) {
        throw new Error(`${resource} 데이터 처리 중 데이터베이스 오류가 발생했습니다: ${error.message}`);
      }
      
      throw error;
    }
    
    // 진행률 업데이트 (5% 단위)
    const progress = Math.floor(((i + chunkSize) / total) * 100);
    if (progress % 5 === 0 || i + chunkSize >= total) {
      emitProgress(eventName, { pct: Math.min(progress, 100), status: 'progress' });
    }
  }

  // 완료 이벤트
  emitProgress(eventName, { pct: 100, status: 'done' });

  const durationMs = Date.now() - started;
  return { inserted, updated, skipped, durationMs };
}


