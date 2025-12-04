// lib/engine/runCaseExecution.ts
// Case 실행 엔진 - 구분 블록의 트리 구조를 DFS로 탐색하여 케이스 실행

import type { Context, Subject, CaseResult, DivisionCase, TokenMenuStore } from '@/types/domain';
import { HierarchicalCell } from '@/types/hierarchicalCell';
import { BlockExecutorFactory } from './BlockExecutorFactory';
import { BLOCK_TYPE_MAP } from '@/types/block-types';
import { calcLog } from '@/lib/utils/calcLogger';
import { ca } from 'date-fns/locale';

export class runCaseExecution {
  private tokenMenuStore: TokenMenuStore;

  constructor(tokenMenuStore: TokenMenuStore) {
    this.tokenMenuStore = tokenMenuStore;
  }

  /**
   * Division 블록의 케이스들을 DFS 탐색하여 실행
   */
  async executeCases(
    ctx: Context,
    divisionBlock: any,
    rightChainBlocks: any[]
  ): Promise<Context> {

    const context = { ...ctx };
    let currentCtx = { ...context };
    let currentSubjects = [...ctx.subjects];

    if (!divisionBlock) {
      calcLog(`  🌳 구분 블록 없는 케이스 실행`);
      const filteredSubjectsCount = currentSubjects.filter(subject => subject.filtered_block_id > 0).length;
      const result = await this.executeCaseBlocks(ctx, currentSubjects, rightChainBlocks, 0);

      currentCtx = { ...result.ctx, subjects: currentSubjects };
      currentCtx.subjects = currentCtx.subjects.map(subject => {
        const caseSubject = result.subjects.find(cs =>
          cs.seqNumber == subject.seqNumber
        );

        if (caseSubject) {
          subject = { ...caseSubject };
        }
        return subject;
      });
      const currentFilteredSubjectsCount = currentCtx.subjects.filter(subject => subject.filtered_block_id > 0).length;
      calcLog(`케이스 실행 결과 : 필터링 정보 (${filteredSubjectsCount} -> ${currentFilteredSubjectsCount})`)
      return currentCtx;
    }

    const hierarchicalCells = divisionBlock.body_cells as HierarchicalCell[];


    // hierarchicalCells가 유효한지 확인
    if (!hierarchicalCells || !Array.isArray(hierarchicalCells)) {
      calcLog(`  ⚠️ Division 블록 ${divisionBlock.block_id}에 유효한 body_cells가 없습니다.`);
      return context;
    }

    // DFS 탐색을 통해 리프 셀들을 찾아서 케이스 실행
    const leafCases = this.extractLeafCases(hierarchicalCells, currentSubjects, currentCtx, divisionBlock);
    // console.log(`  📋 발견된 케이스: ${leafCases.length}개`);

    for (let i = 0; i < leafCases.length; i++) {
      const case_ = leafCases[i];
      try {
        // 1) 케이스에 이미 필터링된 과목들과 context가 포함되어 있음
        const processingSubjects = case_.processingSubjects || [];
        if (processingSubjects.length === 0) {
          calcLog(`    ❌ (${i+1}/${leafCases.length})번째 케이스 실행 실패: 포함된 과목이 없음`);
          continue;
        }
        calcLog(`    📊 (${i+1}/${leafCases.length})번째 케이스 실행, 포함된 과목 수 : ${processingSubjects.length}개`);

        // 2) 필터링된 copy_subject[]와 context를 가지고 케이스(블록 실행기들)를 실행
        const caseResult = await this.executeCaseBlocks(
          currentCtx,
          processingSubjects,
          rightChainBlocks,
          i // N번째 케이스
        );
        // 3) 케이스 실행 결과를 원본 Context에 적용
        currentCtx = { ...caseResult.ctx, subjects: currentSubjects };
        currentCtx.subjects = currentCtx.subjects.map(subject => {
          const caseSubject = caseResult.subjects.find(cs =>
            cs.seqNumber == subject.seqNumber
          );

          if (caseSubject) {
            subject = { ...caseSubject };
          }
          return subject;
        });
      } catch (error) {
        console.error(`    ❌ 케이스 ${i + 1} 실행 실패:`, error);
        throw error;
      }
    }
    return currentCtx;
  }

  /**
   * HierarchicalCell 트리에서 리프 셀들을 추출하여 케이스로 변환
   * DFS 탐색 시마다 조건을 검사하여 과목들과 context를 필터링하고 계속 넘김
   */
  private extractLeafCases(
    cells: HierarchicalCell[],
    initialSubjects: Subject[],
    initialContext: Context,
    divisionBlock: any
  ): DivisionCase[] {
    const leafCases: DivisionCase[] = [];

    // cells가 undefined이거나 빈 배열인 경우 빈 결과 반환
    if (!cells || cells.length === 0) {
      // console.log('    ⚠️ Division 블록에 body_cells가 없습니다.');
      return leafCases;
    }

    const traverse = (
      cell: HierarchicalCell,
      path: string[] = [],
      processingSubjects: Subject[] = initialSubjects,
      currentContext: Context = initialContext
    ) => {
      // calcLog("cell");
      // console.table(cell);
      const currentPath = [...path, cell.type];

      // 현재 셀의 조건으로 과목들을 필터링 (context는 참조용으로 그대로 전달)
      // const headerIndex = this.calculateHeaderIndex(cell, divisionBlock);
      const headerCell = divisionBlock.header_cells?.[cell.colIndex]?.[0];


      const currentProcessingSubjects = this.filterSubjectsByCell(
        cell,
        processingSubjects,
        currentContext,
        headerCell
      );

      const filteredSubjectsCount = processingSubjects.filter(subject => subject.filtered_block_id > 0).length;
      // console.log(`filteredSubjectsCount: ${filteredSubjectsCount}`);
      calcLog(`        🔍 구분 - ${processingSubjects.length}개 -> ${currentProcessingSubjects.length}개 (제외된 과목: ${filteredSubjectsCount}개)`);

      // 리프 셀인 경우 (자식이 없는 경우)
      if (!cell.children || cell.children.length === 0) {
        const caseKey = `case_${cell.id}`;
        const caseName = Object.values(cell.values).join('_') || 'default';
        const criteria = this.buildCriteriaFromCell(cell, currentPath);

        leafCases.push({
          caseKey,
          caseName,
          criteria,
          leafCellId: cell.id,
          processingSubjects: currentProcessingSubjects, // 처리된 과목들
          processingContext: currentContext            // 처리된 context
        });

        // console.log(`    📋 리프 셀 발견: ${caseName}, 최종 과목 수: ${currentFilteredSubjects.length}개`);
      } else {
        // 자식들을 재귀적으로 처리 (처리된 과목들과 처리된 context를 전달)
        if (cell.children && cell.children.length > 0) {
          cell.children.forEach(child =>
            traverse(child, currentPath, currentProcessingSubjects, currentContext)
          );
        }
      }
    };

    cells.forEach(cell => traverse(cell));
    return leafCases;
  }

  /**
   * 셀과 경로로부터 조건문 생성
   */
  private buildCriteriaFromCell(cell: HierarchicalCell, path: string[]): string {
    const conditions: string[] = [];

    // 셀의 값들을 조건으로 변환
    Object.entries(cell.values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        conditions.push(`${key} = '${value}'`);
      }
    });

    return conditions.length > 0 ? conditions.join(' AND ') : 'true';
  }

  /**
   * 셀의 조건에 맞는 과목들을 필터링 (context는 참조용으로 사용)
   * 해당 셀의 깊이(depth)에 해당하는 header_cell 값을 사용
   */
  private filterSubjectsByCell(
    cell: HierarchicalCell,
    subjects: Subject[],
    context: Context,
    headerCell: string
  ): Subject[] {
    const cellValue = cell.values[0];
    calcLog(`     🗡️ 구분조건: ${headerCell}: ${cellValue}`);
    switch (headerCell) {
      case "graduateYear":
        const value: number = cell.values[0] as number || 0;
        switch (cell.values[2] as number) {
          case 0: // 일치 
            if (context.graduateYear == value) {
              return subjects;
            }
            break;
          case 1: // 이하 
            if (context.graduateYear <= value) {
              return subjects;
            }
            break;
          case 2: // 미만 
            if (context.graduateYear < value) {
              return subjects;
            }
            break;
          case 3: // 이상 
            if (context.graduateYear >= value) {
              return subjects;
            }
            break;
          case 4: // 초과 
            if (context.graduateYear > value) {
              return subjects;
            }
            break;
        }

        return [];
      case "graduateGrade":
        const graduateGrade: number = cell.values[0] as number || 0;
        if (context.graduateGrade == graduateGrade) {
          return subjects;
        }
        return [];
      case "admissionCode":
        const admissionCodes: Array<string> = cellValue as Array<string> || [];
        // console.log(`admissionCodes: ${admissionCodes}, compared: ${context.admissionCode}`);
        if (admissionCodes.includes("*") || admissionCodes.includes(context.admissionCode)) {
          const excludeAdmissionCodes: Array<string> = cell.values[2] as Array<string> || [];
          if (excludeAdmissionCodes.includes(context.admissionCode)) {
            return [];
          }
          return subjects;
        }
        return [];
      case "majorCode":
        const majorCodes: Array<string> = cellValue as Array<string> || [];
        if (majorCodes.includes("*") || majorCodes.includes(context.majorCode)) {
          const excludeMajorCodes: Array<string> = cell.values[2] as Array<string> || [];
          if (excludeMajorCodes.includes(context.majorCode)) {
            return [];
          }
          return subjects;
        }
        return [];
      case "applicantScCode":
        calcLog(`     🗡️ : ${context.applicantScCode}: ${cellValue}`);
        if (context.applicantScCode == cell.values[0]) {
          return subjects;
        }
        return [];
      case "subjectGroupUnitSum":
        const stdValue = Number(cell.values[0]);
        const compareOpt = Number(cell.values[1]);
        const unitSumMap = new Map<string, number>();
        subjects.forEach(subject => {
          if (subject.filtered_block_id > 0) {
            return;
          }
          if (!unitSumMap.has(subject.subjectGroup)) {
            unitSumMap.set(subject.subjectGroup, 0);
          }
          unitSumMap.set(subject.subjectGroup, unitSumMap.get(subject.subjectGroup)! + subject.unit);
        });
        // calcLog(unitSumMap);
        return subjects.filter(subject => {
          if (subject.filtered_block_id > 0) {
            return false;
          }
          let unitSum = 0;
          for (const [subjectGroup, unitSumValue] of unitSumMap.entries()) {
            if (subjectGroup.includes(subject.subjectGroup)) {
              unitSum = unitSumValue;
              break;
            }
          }
          switch (compareOpt) {
            case 0:
              return unitSum == stdValue;
            case 1:
              return unitSum <= stdValue;
            case 2:
              // calcLog(`unitSum: ${unitSum}, stdValue: ${stdValue}`);
              return unitSum < stdValue;
            case 3:
              return unitSum >= stdValue;
            case 4:
              return unitSum > stdValue;
          }
          return false;
        });
      case "filtered_block_id":
        const filteredBlockId = cell.values[0] as number;
        return subjects.filter(subject => subject.filtered_block_id == filteredBlockId)
          .map(subject => {
            return {
              ...subject,
              filtered_block_id: 0
            };
          });
    }
    const filteredSubjects = subjects.filter(subject => {
      if (subject.filtered_block_id > 0) {
        return false;
      }
      switch (headerCell) {
        case "subjectSeparationCode":
          const subjectSeparationCodes: Array<string> = cell.values[0] as Array<string> || [];
          if (subjectSeparationCodes.includes("*") || subjectSeparationCodes.includes(subject.subjectSeparationCode)) {
            return true;
          }
          return false;
        case "subjectGroup":
          const subjectGroups: Array<string> = cell.values[0] as Array<string> || [];
          if (subjectGroups.includes("*") || subjectGroups.includes(subject.subjectGroup)) {
            return true;
          }
          return false;
      }
      return false;
    });

    return filteredSubjects;
  }

  /**
   * 셀의 깊이(depth)에 해당하는 header_cells 인덱스 계산
   */
  private calculateHeaderIndex(cell: HierarchicalCell, divisionBlock: any): number {
    // 셀의 깊이(level)를 기반으로 header_cells의 인덱스 계산
    // 일반적으로 깊이 0 = 첫 번째 헤더, 깊이 1 = 두 번째 헤더 등
    const headerIndex = cell.level;

    // header_cells 배열 범위 확인
    const maxIndex = (divisionBlock.header_cells?.length || 1) - 1;
    const validIndex = Math.min(headerIndex, maxIndex);

    // console.log(`        📊 깊이 ${cell.level} → Header 인덱스 ${validIndex} (최대: ${maxIndex})`);

    return validIndex;
  }

  // private async executeSingleCaseBlock(
  //   ctx: Context,
  //   subjects: Subject[],
  //   block: any
  // ): Promise<{ ctx: Context; subjects: Subject[] }> {
  //   const bodyCellValue = this.extractBlockRowValues(block, 0);
  //   const headerCellValue = this.extractBlockHeaderValues(block);

  //   const blockExecutor = this.blockExecutorRegistry.getExecutor(block.block_type);
  //   if (blockExecutor) {
  //     const result = await blockExecutor(ctx, subjects, bodyCellValue, headerCellValue, this.tokenMenuStore, block.block_id);
  //     return result;
  //   }
  //   return { ctx: ctx, subjects: subjects };
  // }


  /**
   * 케이스의 블록 체인 실행 (N번째 케이스에 해당하는 블록 행들을 순차 실행)
   */
  private async executeCaseBlocks(
    ctx: Context,
    processingSubjects: Subject[],
    rightChainBlocks: any[],
    caseIndex: number
  ): Promise<{ ctx: Context; subjects: Subject[] }> {
    let currentCtx = { ...ctx };
    let currentSubjects = [...processingSubjects];

    calcLog(`      🔗 ${rightChainBlocks.length}개의 블록 실행 중...`);

    // 각 블록의 N번째 행을 순차적으로 실행
    for (const block of rightChainBlocks) {
      calcLog(`      📦 블록 ${block.block_id} (${BLOCK_TYPE_MAP[block.block_type as keyof typeof BLOCK_TYPE_MAP]}) 실행 중... ${currentSubjects.length}개`);
      if (currentSubjects.length === 0) {
        break;
      }
      try {
        // 블록의 N번째 행의 body_cell과 header_cell 값들 추출
        const bodyCellValue = this.extractBlockRowValues(block, caseIndex);
        const headerCellValue = this.extractBlockHeaderValues(block);

        const blockExecutor = BlockExecutorFactory.getExecutor(block.block_type, block.block_id, caseIndex, bodyCellValue, headerCellValue);
        if (blockExecutor) {
          const result = await blockExecutor.execute(currentCtx, currentSubjects);
          currentCtx = result.ctx;
          currentSubjects = result.subjects;
        } else {
          console.warn(`        ⚠️ 블록 타입 ${block.block_type}에 대한 실행기를 찾을 수 없음`);
        }
      } catch (error) {
        console.error(`        ❌ 블록 ${block.block_id} 실행 실패:`, error);
        throw error;
      }
    }
    const filteredSubjectsCount = processingSubjects.filter(subject => subject.filtered_block_id > 0).length;
    const currentFilteredSubjectsCount = currentSubjects.filter(subject => subject.filtered_block_id > 0).length;
    calcLog(`      ✅ 실행 완료, 과목 필터링 정보 (${filteredSubjectsCount}개 -> ${currentFilteredSubjectsCount}개)`);

    return { ctx: currentCtx, subjects: currentSubjects };
  }

  /**
   * 블록의 N번째 행의 body_cell 값들 추출
   * 새로운 명시적 구조와 기존 배열 구조 모두 지원
   */
  private extractBlockRowValues(block: any, caseIndex: number): any[] {
    if (!block.body_cells) {
      return [];
    }

    const bodyCells = block.body_cells;
    
    // 새로운 명시적 구조 확인 (객체 배열)
    if (Array.isArray(bodyCells) && bodyCells.length > caseIndex) {
      const row = bodyCells[caseIndex];
      
      // 새로운 형식: [{ subject_groups: [...] }, ...]
      if (typeof row === 'object' && !Array.isArray(row)) {
        // 블록 타입별로 값 추출
        return this.extractValuesFromNewStructure(block.block_type, row, 'body');
      }
      
      // 기존 형식: [['값1', '값2'], ...]
      if (Array.isArray(row)) {
        // 2차원 배열인 경우 첫 번째 열의 값들 반환
        if (row.length > 0 && Array.isArray(row[0])) {
          return row[0];
        }
        // 1차원 배열인 경우 그대로 반환
        return row;
      }
    }

    return [];
  }

  /**
   * 블록의 header_cell 값들 추출
   * 새로운 명시적 구조와 기존 배열 구조 모두 지원
   */
  private extractBlockHeaderValues(block: any): any[] {
    if (!block.header_cells) {
      return [];
    }

    const headerCells = block.header_cells;
    
    // 새로운 명시적 구조 확인
    if (Array.isArray(headerCells) && headerCells.length > 0) {
      const header = headerCells[0];
      
      // 새로운 형식: [{ text_content: '...', include_option: '...' }, ...]
      if (typeof header === 'object' && !Array.isArray(header)) {
        return this.extractValuesFromNewStructure(block.block_type, header, 'header');
      }
      
      // 기존 형식: [['값1', '값2'], ...]
      if (Array.isArray(header)) {
        return header;
      }
    }

    return [];
  }

  /**
   * 새로운 명시적 구조에서 Executor가 사용할 배열 형식으로 값 추출
   */
  private extractValuesFromNewStructure(blockType: number, data: any, type: 'header' | 'body'): any[] {
    // 블록 타입별로 명시적 속성에서 값 추출
    // Executor 호환성을 위해 기존 배열 형식으로 변환
    
    switch (blockType) {
      case 1: // Division
        if (type === 'header') {
          // header: string[] (구분 유형 코드 배열)
          return Array.isArray(data) ? data : [data];
        }
        // body는 계층 구조이므로 특별 처리 필요
        break;
        
      case 2: // ApplySubject
        if (type === 'header') {
          // header: { text_content, include_option }
          // Executor는 headerRowCells[0]?.[0]에서 includeMode를 읽음 (0=include, 1=exclude)
          const includeOption = data.include_option || 'include';
          return [includeOption === 'include' ? 0 : 1];
        } else {
          // body: { subject_groups: [...] }
          return [data.subject_groups || []];
        }
        
      case 3: // GradeRatio
        if (type === 'header') {
          // header: 각 열의 학년 정보
          // Executor는 headerRowCells[0]에서 각 항목의 [0]을 읽음
          return Array.isArray(data) ? data.map((item: any) => [item.grade || item]) : [[data]];
        } else {
          // body: 각 열의 비율 정보
          // Executor는 bodyRowCells[0]에서 각 항목의 [0]을 읽음
          return Array.isArray(data) ? data.map((item: any) => [item.ratio || item]) : [[data]];
        }
        
      case 4: // ApplyTerm
        if (type === 'body') {
          // body: { terms: [...], top_terms: number }
          // Executor는 bodyRowCells[0]?.[0]에서 termsString, bodyRowCells[0]?.[2]에서 topTerms를 읽음
          const terms = data.terms || [];
          const termsString = terms.join('|');
          return [termsString, null, data.top_terms || 0];
        }
        break;
        
      case 5: // TopSubject
        if (type === 'body') {
          // body: { mode, score_type, top_count, sort_orders }
          // Executor는 bodyRowCells[0]?.[0]=mode, [1]=scoreType, [3]=topSliceNumber, [5]=sortOrders를 읽음
          return [
            data.mode || 1,
            data.score_type || null,
            null,
            data.top_count || 0,
            null,
            data.sort_orders || []
          ];
        }
        break;
        
      case 6: // SubjectGroupRatio
        if (type === 'header') {
          // header: 각 열의 교과군 정보
          return Array.isArray(data) ? data.map((item: any) => [item.subject_group || item]) : [[data]];
        } else {
          // body: 각 열의 비율 정보
          return Array.isArray(data) ? data.map((item: any) => [item.ratio || item]) : [[data]];
        }
        
      case 7: // SeparationRatio
        if (type === 'header') {
          // header: 각 열의 과목구분 정보
          return Array.isArray(data) ? data.map((item: any) => [item.separation || item]) : [[data]];
        } else {
          // body: 각 열의 비율 정보
          return Array.isArray(data) ? data.map((item: any) => [item.ratio || item]) : [[data]];
        }
        
      case 8: // ScoreMap
        if (type === 'header') {
          // header: { variable_scope, filter_option }
          // Executor는 headerRowCells[0]?.[1]=variableScope, [2]=filterOption을 읽음
          return [null, data.variable_scope || 0, data.filter_option || 0];
        } else {
          // body: { input_type, input_range, output_type, table }
          // Executor는 bodyRowCells[0]?.[0]=inputType, [1]=inputRange, [2]=outputType, [4]=table을 읽음
          return [
            data.input_type || null,
            data.input_range || -1,
            data.output_type || null,
            null,
            data.table || null
          ];
        }
        
      case 9: // Formula
        if (type === 'header') {
          // header: { variable_scope }
          return [null, data.variable_scope || 0];
        } else {
          // body: { score_type, expr }
          return [data.score_type || null, null, data.expr || null];
        }
        
      case 11: // Condition
        if (type === 'header') {
          // header: { variable_scope }
          return [null, data.variable_scope || 0];
        } else {
          // body: { conditions: [...] }
          return [data.conditions || []];
        }
        
      case 12: // Aggregation
        if (type === 'header') {
          // header: { variable_scope }
          return [null, data.variable_scope || 0];
        } else {
          // body: { input_type, func, output_type }
          return [data.input_type || null, data.func || 0, null, data.output_type || null];
        }
        
      case 13: // Ratio
        if (type === 'body') {
          // body: { ratio, score_type }
          return [data.ratio || 0, data.score_type || null];
        }
        break;
        
      case 14: // Decimal
        if (type === 'header') {
          // header: { variable_scope }
          return [null, data.variable_scope || 0];
        } else {
          // body: { score_type, decimal_places, option }
          return [data.score_type || null, null, data.decimal_places || 0, null, data.option || 0];
        }
    }
    
    // 기본값: 객체의 모든 값들을 배열로 변환
    return Object.values(data || {});
  }

  /**
   * 케이스 실행 결과를 원본 과목 배열에 적용
   */
  private applyCaseResultToOriginalSubjects(
    originalSubjects: Subject[],
    caseSubjects: Subject[],
    leafCellId: string
  ): Subject[] {
    // copy_subject[]의 수정사항을 원본 Context의 subject[]에 적용
    // filtered_block_id를 사용하여 어떤 블록에서 필터링되었는지 추적

    let count = 0;
    const updatedSubjects = originalSubjects.map(subject => {
      // 케이스에서 처리된 과목인지 확인
      const caseSubject = caseSubjects.find(cs =>
        cs.seqNumber === subject.seqNumber
      );

      if (caseSubject) {
        count++;
        // 케이스 결과로 업데이트
        return {
          ...subject,
          ...caseSubject
        };
      }

      return subject;
    });

    // console.log(`    ✅ 케이스 실행 결과를 원본 과목 배열에 적용: ${count}개`);

    return updatedSubjects;
  }

  /**
   * 리프 셀 ID에서 블록 ID 파싱
   */
  private parseBlockIdFromLeafCellId(leafCellId: string): number {
    // 더미 구현 - 실제로는 셀 ID 구조에 따라 파싱 로직 구현 필요
    return parseInt(leafCellId.split('_').pop() || '0');
  }
}
