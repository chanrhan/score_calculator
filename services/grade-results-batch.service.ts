// services/grade-results-batch.service.ts
// 배치 처리 및 결과 저장 서비스

import { PrismaClient } from '@prisma/client';
import type { Context, GradeResult, GradeCalculationBatch, TokenMenuStore, Subject } from '@/types/domain';
import { GradeCalculationDataService } from './grade-calculation-data.service';
import { runComponentGrid } from '@/lib/engine/runComponentGrid';
import { chunkArray } from '@/lib/utils/chunk';
import { deepClone } from '@/lib/utils/context';
import { calcLog } from '@/lib/utils/calcLogger';

const prisma = new PrismaClient();

export class GradeResultsBatchService {
  private dataService: GradeCalculationDataService;

  constructor() {
    this.dataService = new GradeCalculationDataService();
  }

  /**
   * 성적 계산 배치 실행
   */
  async executeBatch(
    pipelineId: number,
    schoolCode: string,
    options: {
      batchSize?: number;
      onProgress?: (processed: number, total: number) => void;
      dbChunkSize?: number;
      studentIds?: string[];
    } = {}
  ): Promise<GradeCalculationBatch> {
    const batchSize = options.batchSize || 100;
    
    console.log(`🚀 성적 계산 배치 시작 - Pipeline ID: ${pipelineId}, School Code: ${schoolCode}`);

    // 배치 생성
    const batch = await this.createBatch(pipelineId);
    console.log(`📦 배치 생성 완료 - ID: ${batch.id}`);

    try {
      // 1. 모든 데이터 로딩
      const { students, tokenMenuStore, pipelineData } = await this.dataService.loadAllData(pipelineId, schoolCode, options.studentIds);
      
      batch.totalStudents = students.length;
      batch.status = 'running';
      await this.updateBatch(batch);

      console.log(`📊 데이터 로딩 완료 - 학생 ${students.length}명`);

      // 2. 학생들을 배치 단위로 처리
      const results: Context[] = [];
      
      for (let i = 0; i < students.length; i += batchSize) {
        const batchStudents = students.slice(i, i + batchSize);
        // console.log(`📋 배치 ${Math.floor(i / batchSize) + 1} 처리 중 (${batchStudents.length}명)`);
        
        // 배치 내 학생들을 병렬 처리
        const batchResults = await Promise.all(
          batchStudents.map(student => this.processStudent(student, pipelineData.components, tokenMenuStore))
        ).then(results => results.filter(result => result.finalScore > 0));

        results.push(...batchResults);
        batch.processedStudents += batchStudents.length;

        // 진행률 업데이트
        if (options.onProgress) {
          options.onProgress(batch.processedStudents, batch.totalStudents);
        }

        // 배치 상태 업데이트
        await this.updateBatch(batch);

        // console.log(`✅ 배치 ${Math.floor(i / batchSize) + 1} 완료 - 처리된 학생: ${batch.processedStudents}/${batch.totalStudents}\r`);
      }

      // 3. 결과 정렬 및 순위 매기기
      const rankedResults = this.calculateRanks(results);
      batch.results = rankedResults;

      // 4. 결과를 DB에 저장 (청크 단위)
      await this.saveResultsToDatabase(batch, options.dbChunkSize ?? 1000);

      // 5. 배치 완료
      batch.status = 'completed';
      batch.finishedAt = new Date();
      await this.updateBatch(batch);

      console.log(`🎯 성적 계산 배치 완료 - 총 ${results.length}명 처리`);
      return batch;

    } catch (error) {
      console.error('❌ 성적 계산 배치 실패:', error);
      
      batch.status = 'failed';
      batch.finishedAt = new Date();
      await this.updateBatch(batch);
      
      throw error;
    } finally {
      await this.dataService.cleanup();
    }
  }

  /**
   * 개별 학생 처리
   */
  private async processStudent(
    student: Context,
    componentGrids: any[],
    tokenMenuStore: TokenMenuStore
  ): Promise<Context> {
    
    try {
      // Context 객체 깊은 복사로 참조 공유 문제 해결
      // const studentCopy = deepClone(student);
      
      // console.log(`☀️ 계산 전`);
      // console.table({
      //   identifyNumber: student.identifyNumber,
      //   finalScore: student.finalScore,
      //   subjectFilterCount: `${student.subjects.filter((subject: Subject) => subject.filtered_block_id > 0).length}/${student.subjects.length}`
      // });
      // ComponentGrid 실행
      const result = await runComponentGrid(student, componentGrids, tokenMenuStore);
      
      // console.log(`🌙 계산 후`);
      // console.table({
      //   identifyNumber: result.identifyNumber,
      //   finalScore: result.finalScore,
      //   subjectFilterCount: `${result.subjects.filter((subject: Subject) => subject.filtered_block_id > 0).length}/${result.subjects.length}`
      // });
      

      // GradeResult 생성
      const gradeResult: Context = {
        identifyNumber: result.identifyNumber,
        admissionCode: result.admissionCode,
        majorCode: result.majorCode,
        graduateYear: result.graduateYear,
        graduateGrade: result.graduateGrade,
        applicantScCode: result.applicantScCode,
        finalRank: result.finalRank || 0,
        finalScore: result.finalScore,
        subjects: result.subjects,
        vars: result.vars,
        snapshot: result.snapshot || []
      };

      return gradeResult;
    } catch (error) {
      console.error(`❌ 학생 ${student.identifyNumber} 처리 실패:`, error);
      throw error;
    }
  }

  /**
   * 결과 정렬 및 순위 매기기
   */
  private calculateRanks(results: Context[]): Context[] {
    // 최종 점수 기준으로 내림차순 정렬
    const sortedResults = results.slice().sort((a, b) => b.finalScore - a.finalScore);

    // 순위 매기기 (동점 처리 포함)
    let currentRank = 1;
    let previousScore: number | null = null;

    return sortedResults.map((result, index) => {
      // 동점이 아닌 경우에만 순위 증가
      if (previousScore !== null && Math.abs(result.finalScore - previousScore) > 1e-9) {
        currentRank = index + 1;
      }

      result.finalRank = currentRank;
      previousScore = result.finalScore;

      return result;
    });
  }

  /**
   * 결과를 데이터베이스에 저장
   */
  private async saveResultsToDatabase(batch: GradeCalculationBatch, dbChunkSize: number = 300): Promise<void> {
    // console.log(`💾 결과를 데이터베이스에 저장 중... (${batch.results.length}개, 청크 크기: ${dbChunkSize})`);

    try {
      if (!batch.results || batch.results.length === 0) {
        console.log('저장할 결과가 없습니다.');
        return;
      }

      // 파이프라인 범위로만 삭제하여 다른 파이프라인 결과 보존
      await prisma.grade_results.deleteMany({ where: { pipeline_id: batch.pipelineId as any } });

      // 1단계: 스냅샷을 제외한 최소 subjects로 insert
      const studentsWithSubjects = batch.results
        .filter(student => student.subjects && student.subjects.length > 0);

      const gradeResultsData = studentsWithSubjects
        .map(student => {
          // vars Map을 객체로 변환
          const varsObject = student.vars instanceof Map 
            ? Object.fromEntries(student.vars) 
            : (student.vars || {});
          
          return {
            student_id: student.identifyNumber.toString(),
            final_score: student.finalScore || 0,
            rank: student.finalRank || 0,
            tie_breaker: (student as any).metrics || {},
            created_at: new Date(),
            pipeline_id: batch.pipelineId as any,
            meta_variables: varsObject,
            // 스냅샷은 비워서 저장 (용량 절감)
            subjects: (student.subjects || []).map((s: any) => ({ ...s, snapshot: [] })),
            context_snapshots: null, // 초기값은 null, 나중에 업데이트
            updated_at: new Date()
          };
        });

      const chunks = chunkArray(gradeResultsData, dbChunkSize);
      let inserted = 0;

      console.log('\n');
      for (const dataChunk of chunks) {
        await prisma.grade_results.createMany({
          data: dataChunk,
          skipDuplicates: false
        });
        inserted += dataChunk.length;
        process.stdout.write(`\r➡️  ${inserted}/${gradeResultsData.length} 저장`);
      }
      console.log(`\n✅ 성적 결과 저장 완료`);

      // 2단계: 학생별 스냅샷을 포함하여 subjects와 context_snapshots update
      // 개별 업데이트를 청크로 나눠 순차 실행
      const updateChunks = chunkArray(studentsWithSubjects, Math.max(1, Math.min(dbChunkSize, 500)));
      let updated = 0;
      for (const studentChunk of updateChunks) {
        for (const student of studentChunk) {
          await prisma.grade_results.update({
            where: {
              pipeline_id_student_id: {
                pipeline_id: batch.pipelineId as any,
                student_id: student.identifyNumber.toString()
              }
            },
            data: {
              subjects: student.subjects || [],
              context_snapshots: student.snapshot || null,
              updated_at: new Date()
            }
          } as any);
          updated += 1;
        }
        process.stdout.write(`\r🧩 스냅샷 업데이트 진행: ${updated}/${studentsWithSubjects.length}`);
      }

      console.log(`\n✅ 스냅샷 업데이트 완료`);
    } catch (error) {
      console.error('❌ 스냅샷 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 배치 생성
   */
  private async createBatch(pipelineId: number): Promise<GradeCalculationBatch> {
    const batch: GradeCalculationBatch = {
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pipelineId,
      status: 'pending',
      startedAt: new Date(),
      totalStudents: 0,
      processedStudents: 0,
      results: []
    };

    // TODO: 배치 정보를 별도 테이블에 저장 (필요한 경우)
    // await prisma.grade_calculation_batch.create({ data: batch });

    return batch;
  }

  /**
   * 배치 상태 업데이트
   */
  private async updateBatch(batch: GradeCalculationBatch): Promise<void> {
    // TODO: 배치 상태를 별도 테이블에 업데이트 (필요한 경우)
    // await prisma.grade_calculation_batch.update({
    //   where: { id: batch.id },
    //   data: {
    //     status: batch.status,
    //     processedStudents: batch.processedStudents,
    //     finishedAt: batch.finishedAt
    //   }
    // });
  }

  /**
   * 성적 계산 결과 조회
   */
  async getResults(pipelineId: number, options: {
    limit?: number;
    offset?: number;
    orderBy?: 'final_score' | 'rank';
    order?: 'asc' | 'desc';
    studentId?: string;
  } = {}): Promise<{
    results: any[];
    total: number;
  }> {
    const {
      limit = 100,
      offset = 0,
      orderBy = 'final_score',
      order = 'desc',
      studentId
    } = options;

    try {
      // 검색 조건 구성
      const whereCondition: any = { pipeline_id: pipelineId };
      
      // studentId가 제공된 경우 검색 조건 추가
      if (studentId && studentId.trim()) {
        whereCondition.student_id = {
          contains: studentId.trim(),
          mode: 'insensitive'
        };
      }

      // 결과 조회
      const results = await prisma.grade_results.findMany({
        where: whereCondition,
        orderBy: { [orderBy]: order },
        take: limit,
        skip: offset
      });

      // 파이프라인의 대학 코드 조회 (전형명 매핑용)
      const pipeline = await prisma.pipelines.findUnique({
        where: { id: BigInt(pipelineId) },
        select: { univ_id: true }
      } as any);

      // 학생 기본정보에서 mogib2_code -> admissionCode 추출
      const studentIds = results.map(r => r.student_id);
      let admissionNameByStudentId: Record<string, string> = {};
      let admissionCodeByStudentId: Record<string, string> = {};

      if (pipeline && studentIds.length > 0) {
        const studentInfos = await prisma.student_base_info.findMany({
          where: { identifyNumber: { in: studentIds } },
          select: { identifyNumber: true, mogib2_code: true }
        } as any);

        // 학생별 전형코드 추출
        const admissionCodes = new Set<string>();
        for (const info of studentInfos) {
          const code = (info.mogib2_code || '').split('-')[0] || '';
          if (code) {
            admissionCodeByStudentId[info.identifyNumber] = code;
            admissionCodes.add(code);
          }
        }

        // 토큰 메뉴에서 전형명 조회
        if (admissionCodes.size > 0) {
          const items = await prisma.token_menu_item.findMany({
            where: {
              univ_id: pipeline.univ_id,
              menu_key: 'admission_code',
              value: { in: Array.from(admissionCodes) }
            },
            select: { value: true, label: true }
          } as any);

          const nameByCode: Record<string, string> = Object.fromEntries(items.map(i => [i.value, i.label]));
          for (const sid of Object.keys(admissionCodeByStudentId)) {
            const code = admissionCodeByStudentId[sid];
            admissionNameByStudentId[sid] = nameByCode[code] || code || '';
          }
        }
      }

      // 확장된 결과로 매핑 (전형코드/전형명 포함)
      const enrichedResults = results.map(r => ({
        ...r,
        admission_code: admissionCodeByStudentId[r.student_id] || null,
        admission_name: admissionNameByStudentId[r.student_id] || null,
      }));

      // 총 개수 조회
      // const total = await prisma.grade_results.count({
      //   where: whereCondition
      // });

      return { results: enrichedResults, total: results.length };
    } catch (error) {
      console.error('❌ 성적 계산 결과 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 리소스 정리
   */
  async cleanup(): Promise<void> {
    await prisma.$disconnect();
  }
}
