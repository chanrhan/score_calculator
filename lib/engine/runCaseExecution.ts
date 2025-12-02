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
    // console.log('currentSubjects.length', currentSubjects.length);

    if (!divisionBlock) {
      calcLog(`  🌳 Single Case 실행 시작`);
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
      calcLog(`  🔍 케이스 ${i + 1}/${leafCases.length} 실행 중: ${case_.caseName}`);

      try {
        // 1) 케이스에 이미 필터링된 과목들과 context가 포함되어 있음
        const filteredSubjects = case_.filteredSubjects || [];
        if (filteredSubjects.length === 0) {
          calcLog(`    ❌ 케이스 ${i + 1} 실행 실패: 필터링된 과목이 없음`);
          continue;
        }
        const filteredContext = currentCtx;
        calcLog(`    📊 케이스별 필터링된 과목: ${filteredSubjects.length}개`);

        // 2) 필터링된 copy_subject[]와 context를 가지고 케이스(블록 실행기들)를 실행
        const caseResult = await this.executeCaseBlocks(
          currentCtx,
          filteredSubjects,
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
      filteredSubjects: Subject[] = initialSubjects,
      currentContext: Context = initialContext
    ) => {
      // calcLog("cell");
      // console.table(cell);
      const currentPath = [...path, cell.type];

      // 현재 셀의 조건으로 과목들을 필터링 (context는 참조용으로 그대로 전달)
      // const headerIndex = this.calculateHeaderIndex(cell, divisionBlock);
      const headerCell = divisionBlock.header_cells?.[cell.colIndex]?.[0];


      const currentFilteredSubjects = this.filterSubjectsByCell(
        cell,
        filteredSubjects,
        currentContext,
        headerCell
      );

      const filteredSubjectsCount = filteredSubjects.filter(subject => subject.filtered_block_id > 0).length;
      // console.log(`filteredSubjectsCount: ${filteredSubjectsCount}`);
      calcLog(`        🔍 방문 - ${filteredSubjects.length}개 -> ${currentFilteredSubjects.length}개 (제외된 과목: ${filteredSubjectsCount}개)`);

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
          filteredSubjects: currentFilteredSubjects, // 필터링된 과목들을 케이스에 포함
          filteredContext: currentContext            // 참조용 context를 케이스에 포함
        });

        // console.log(`    📋 리프 셀 발견: ${caseName}, 최종 과목 수: ${currentFilteredSubjects.length}개`);
      } else {
        // 자식들을 재귀적으로 처리 (필터링된 과목들과 참조용 context를 전달)
        if (cell.children && cell.children.length > 0) {
          cell.children.forEach(child =>
            traverse(child, currentPath, currentFilteredSubjects, currentContext)
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
    filteredSubjects: Subject[],
    rightChainBlocks: any[],
    caseIndex: number
  ): Promise<{ ctx: Context; subjects: Subject[] }> {
    let currentCtx = { ...ctx };
    let currentSubjects = [...filteredSubjects];

    calcLog(`    🔗 RightChain 블록 ${rightChainBlocks.length}개 실행 중...`);

    // 각 블록의 N번째 행을 순차적으로 실행
    for (const block of rightChainBlocks) {
      calcLog(`      📦 블록 ${block.block_id} (${BLOCK_TYPE_MAP[block.block_type as keyof typeof BLOCK_TYPE_MAP]}) 실행 중...`);
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
        // 블록 실행기 실행
        // const blockExecutor = this.blockExecutorRegistry.getExecutor(block.block_type);
        // if (blockExecutor) {
        //   const result = await blockExecutor(currentCtx, currentSubjects, bodyCellValue, headerCellValue, block.block_id, caseIndex);
        //   currentCtx = result.ctx;
        //   currentSubjects = result.subjects;
        //   // console.log(`        ✅ 블록 ${block.block_id} 실행 완료`);
        // } else {
        //   // console.warn(`        ⚠️ 블록 타입 ${block.block_type}에 대한 실행기를 찾을 수 없음`);
        // }
      } catch (error) {
        console.error(`        ❌ 블록 ${block.block_id} 실행 실패:`, error);
        throw error;
      }
    }

    return { ctx: currentCtx, subjects: currentSubjects };
  }

  /**
   * 블록의 N번째 행의 body_cell 값들 추출
   */
  private extractBlockRowValues(block: any, caseIndex: number): any[] {
    // body_cells에서 N번째 행의 값들을 추출
    if (block.body_cells && block.body_cells[caseIndex]) {
      return block.body_cells[caseIndex];
    }

    // 행이 없는 경우 빈 배열 반환
    return [];
  }

  /**
   * 블록의 header_cell 값들 추출
   */
  private extractBlockHeaderValues(block: any): any[] {
    // header_cells의 값들을 추출
    if (block.header_cells) {
      return block.header_cells;
    }

    // header_cells가 없는 경우 빈 배열 반환
    return [];
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
