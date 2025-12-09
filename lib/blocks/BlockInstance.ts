// lib/blocks/BlockInstance.ts
// 블록 인스턴스 객체지향 설계 (리팩토링 명세서 기반)

import { FlowBlockType, FlowBlock, HierarchicalCell } from '@/types/block-structure';
import { BLOCK_TYPE } from '@/types/block-types';
import { getBlockType } from '@/types/block-structure';

// 블록 인스턴스 데이터 타입
export interface BlockInstanceData {
  header_cells: any;
  body_cells: any;
}

// 기본 블록 인스턴스 추상 클래스
export abstract class BlockInstance {
  // var_scope는 블록 레벨 속성으로 관리 (헤더 셀이 아닌 블록 자체의 속성)
  protected _varScope: string = '0'; // '0': 과목(Subject), '1': 학생(Student)

  protected constructor(
    public readonly block_id: number,
    public readonly block_type: number,
    protected data: BlockInstanceData
  ) {
    // fromDbFormat에서 var_scope를 초기화할 때 사용
  }

  /**
   * var_scope 값 가져오기 (공개 메서드)
   */
  public getVarScope(): string {
    return this._varScope;
  }

  /**
   * var_scope 값 설정하기 (공개 메서드)
   */
  public setVarScope(value: string): void {
    this._varScope = value === '0' || value === '1' ? value : '0';
  }

  // 공통 메서드
  abstract updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void;
  abstract addRow(rowIndex?: number): void;
  abstract addColumn(colIndex?: number): void;
  abstract removeRow(rowIndex: number): void;
  abstract removeColumn(colIndex: number): void;
  
  // 데이터 직렬화 (DB 저장용)
  abstract toDbFormat(): { header_cells: any; body_cells: any };
  
  // 구조 정의 참조
  abstract getStructure(): FlowBlockType;
  
  // 렌더링용 헬퍼 메서드 (Cell 컴포넌트에서 사용)
  abstract getHeaderCellValues(colIndex: number): any[];
  abstract getBodyCellValues(rowIndex: number, colIndex: number): any[];
  
  // 속성 기반 접근 메서드 (레이아웃에서 직접 사용)
  /**
   * 헤더 셀의 속성 값들을 반환
   * @param colIndex 열 인덱스
   */
  abstract getHeaderProperties(colIndex: number): Record<string, any>;
  
  /**
   * 바디 셀의 속성 값들을 반환
   * @param rowIndex 행 인덱스
   * @param colIndex 열 인덱스
   */
  abstract getBodyProperties(rowIndex: number, colIndex: number): Record<string, any>;
  
  /**
   * 속성 값을 업데이트 (속성 이름으로 직접 접근)
   * @param propertyName 속성 이름
   * @param value 새로운 값
   * @param rowIndex 행 인덱스 (바디 셀인 경우)
   * @param colIndex 열 인덱스
   */
  abstract updateProperty(propertyName: string, value: any, rowIndex?: number, colIndex?: number): void;
  
  // FlowBlock 형식으로 변환 (기존 호환성)
  toFlowBlock(): FlowBlock {
    const dbFormat = this.toDbFormat();
    
    // Division 블록의 경우 header_cells는 string[]이므로 그대로 사용
    // 일반 블록의 경우 header_cells는 any[][]이므로 그대로 사용
    let headerCells: any;
    if (this.block_type === BLOCK_TYPE.DIVISION) {
      // Division: string[] 그대로 사용
      headerCells = Array.isArray(dbFormat.header_cells) ? dbFormat.header_cells : [];
    } else {
      // 일반 블록: any[][] 그대로 사용
      headerCells = Array.isArray(dbFormat.header_cells) ? dbFormat.header_cells : [];
    }
    
    return {
      block_id: this.block_id,
      block_type: this.block_type,
      header_cells: headerCells,
      body_cells: dbFormat.body_cells,
    };
  }
}

// ApplySubjectBlockInstance와 DivisionBlockInstance는 이제 모듈로 분리되었습니다.
// lib/blocks/modules/ApplySubject/instance.ts와 lib/blocks/modules/Division/instance.ts를 참조하세요.

// BlockInstanceFactory는 registry.ts로 이동하여 순환 참조 문제 해결

// 일반 블록 인스턴스 (아직 특화되지 않은 블록용)
export class GenericBlockInstance extends BlockInstance {
  constructor(blockId: number, blockType: number, data: BlockInstanceData) {
    super(blockId, blockType, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    // 기본 구현: 기존 FlowBlock 구조 유지
    if (rowIndex === -1) {
      // 헤더 셀 업데이트
      if (!this.data.header_cells) {
        this.data.header_cells = [];
      }
      if (!this.data.header_cells[colIndex]) {
        this.data.header_cells[colIndex] = [];
      }
      if (!this.data.header_cells[colIndex][elementIndex]) {
        this.data.header_cells[colIndex][elementIndex] = [];
      }
      this.data.header_cells[colIndex][elementIndex] = value;
    } else {
      // 바디 셀 업데이트
      if (!this.data.body_cells) {
        this.data.body_cells = [];
      }
      if (!this.data.body_cells[rowIndex]) {
        this.data.body_cells[rowIndex] = [];
      }
      if (!this.data.body_cells[rowIndex][colIndex]) {
        this.data.body_cells[rowIndex][colIndex] = [];
      }
      if (!this.data.body_cells[rowIndex][colIndex][elementIndex]) {
        this.data.body_cells[rowIndex][colIndex][elementIndex] = [];
      }
      this.data.body_cells[rowIndex][colIndex][elementIndex] = value;
    }
  }

  addRow(rowIndex?: number): void {
    if (!this.data.body_cells) {
      this.data.body_cells = [];
    }
    const newRow: any[] = [];
    if (rowIndex !== undefined && rowIndex >= 0) {
      // 다른 블록들과 일관되게 rowIndex + 1 위치에 삽입
      // 명세서에 따르면 R+1 자리에 행이 삽입되어야 함
      this.data.body_cells.splice(rowIndex + 1, 0, newRow);
    } else {
      this.data.body_cells.push(newRow);
    }
  }

  addColumn(colIndex?: number): void {
    // 기본 구현은 열 추가를 지원하지 않음
    throw new Error(`Block type ${this.block_type} does not support column addition`);
  }

  removeRow(rowIndex: number): void {
    if (this.data.body_cells && rowIndex >= 0 && rowIndex < this.data.body_cells.length) {
      this.data.body_cells.splice(rowIndex, 1);
    }
  }

  removeColumn(colIndex: number): void {
    throw new Error(`Block type ${this.block_type} does not support column removal`);
  }

  getStructure(): FlowBlockType {
    // 블록 타입 이름 가져오기
    const blockTypeMap: Record<number, keyof typeof import('@/types/block-structure').BLOCK_TYPES> = {
      [BLOCK_TYPE.DIVISION]: 'Division',
      [BLOCK_TYPE.APPLY_SUBJECT]: 'ApplySubject',
      [BLOCK_TYPE.GRADE_RATIO]: 'GradeRatio',
      [BLOCK_TYPE.APPLY_TERM]: 'ApplyTerm',
      [BLOCK_TYPE.TOP_SUBJECT]: 'TopSubject',
      [BLOCK_TYPE.SUBJECT_GROUP_RATIO]: 'SubjectGroupRatio',
      [BLOCK_TYPE.SEPARATION_RATIO]: 'SeparationRatio',
      [BLOCK_TYPE.SCORE_MAP]: 'ScoreMap',
      [BLOCK_TYPE.FORMULA]: 'Formula',
      [BLOCK_TYPE.VARIABLE]: 'Variable',
      [BLOCK_TYPE.CONDITION]: 'Condition',
      [BLOCK_TYPE.AGGREGATION]: 'Aggregation',
      [BLOCK_TYPE.RATIO]: 'Ratio',
      [BLOCK_TYPE.DECIMAL]: 'Decimal',
    };
    
    const typeName = blockTypeMap[this.block_type];
    if (typeName) {
      return getBlockType(typeName);
    }
    
    // 기본 구조 반환
    return {
      name: 'Unknown',
      color: 'gray',
      col_editable: false,
      cols: [{
        header: { elements: [] },
        rows: []
      }]
    };
  }

  toDbFormat(): { header_cells: any; body_cells: any } {
    // BLOCK_TYPES 구조를 참조하여 새로운 명시적 구조로 변환
    const structure = this.getStructure();
    
    if (!structure) {
      // 구조를 찾을 수 없으면 기존 형식 유지
      return {
        header_cells: this.data.header_cells || [],
        body_cells: this.data.body_cells || []
      };
    }

    // header_cells 변환
    let headerCells: any = [];
    
    // var_scope를 지원하는 블록인지 확인
    const varScopeSupportedBlocks = [
      BLOCK_TYPE.FORMULA,
      BLOCK_TYPE.CONDITION,
      BLOCK_TYPE.SCORE_MAP,
      BLOCK_TYPE.DECIMAL,
      BLOCK_TYPE.RATIO,
    ];
    
    const supportsVarScope = varScopeSupportedBlocks.includes(this.block_type);
    
    if (this.data.header_cells && Array.isArray(this.data.header_cells) && this.data.header_cells.length > 0) {
      const headerValues = this.data.header_cells[0];
      if (Array.isArray(headerValues)) {
        // 블록 타입별 header 변환
        const headerObj: any = {};
        
        if (this.block_type === BLOCK_TYPE.SCORE_MAP) {
          // ScoreMap: [null, variableScope, filterOption]
          // 블록 레벨 var_scope 사용
          headerObj.var_scope = this.getVarScope();
          headerObj.filter_option = headerValues[2] || 0;
        } else if (supportsVarScope) {
          // Formula, Condition, Decimal: 블록 레벨 var_scope 사용
          headerObj.var_scope = this.getVarScope();
        } else if (this.block_type === BLOCK_TYPE.AGGREGATION) {
          // Aggregation은 제외 (사용자 요청)
        } else {
          // 기타 블록: 구조에서 변환 시도
          if (structure.cols && structure.cols.length > 0) {
            const headerElements = structure.cols[0].header?.elements || [];
            headerElements.forEach((element, index) => {
              if (element.type === 'Token' && 'menu_key' in element && element.menu_key) {
                if (element.menu_key === 'variable_scope' && supportsVarScope) {
                  headerObj.var_scope = this.getVarScope();
                } else if (element.menu_key === 'filter_option') {
                  headerObj.filter_option = headerValues[index] || 0;
                }
              }
            });
          }
        }
        
        headerCells = Object.keys(headerObj).length > 0 ? [headerObj] : this.data.header_cells;
      } else {
        headerCells = this.data.header_cells;
      }
    } else {
      headerCells = this.data.header_cells || [];
    }

    // body_cells 변환
    let bodyCells: any = [];
    if (structure.cols && structure.cols.length > 0) {
      // 일반 블록: body 구조에서 변환
      const bodyElements = structure.cols[0].rows?.[0]?.elements || [];
      
      if (this.data.body_cells && Array.isArray(this.data.body_cells)) {
        bodyCells = this.data.body_cells.map((row: any) => {
          if (!Array.isArray(row) || row.length === 0) return row;
          
          const cellValues = row[0]; // 첫 번째 열의 값들
          if (!Array.isArray(cellValues)) return row;
          
          // bodyElements의 타입에 따라 명시적 객체 생성
          const bodyObj: any = {};
          let valueIndex = 0;
          
          // 블록 타입별 변환 로직
          if (this.block_type === BLOCK_TYPE.SCORE_MAP) {
            // ScoreMap: [inputType, inputRange, '→', outputType, matchType, table]
            // Executor: [0]=inputType, [1]=inputRange, [2]=outputType, [4]=table
            bodyObj.input_type = cellValues[0] || null;
            bodyObj.input_range = cellValues[1] === 'range' ? 1 : (cellValues[1] === 'exact' ? 0 : -1);
            bodyObj.output_type = cellValues[3] || null; // [2]는 Text '→'이므로 [3] 사용
            bodyObj.table = cellValues[5] || null; // [4]는 matchType이므로 [5] 사용
          } else if (this.block_type === BLOCK_TYPE.FORMULA) {
            // Formula: [scoreType, ' = ', expr]
            bodyObj.score_type = cellValues[0] || null;
            bodyObj.expr = cellValues[2] || null; // [1]은 Text ' = '
          } else if (this.block_type === BLOCK_TYPE.CONDITION) {
            // Condition: [conditions]
            bodyObj.conditions = cellValues[0] || [];
          } else if (this.block_type === BLOCK_TYPE.AGGREGATION) {
            // Aggregation: [inputType, func, null, outputType]
            bodyObj.input_type = cellValues[0] || null;
            bodyObj.func = cellValues[1] || 0;
            bodyObj.output_type = cellValues[3] || null;
          } else if (this.block_type === BLOCK_TYPE.RATIO) {
            // Ratio: [ratio, scoreType]
            bodyObj.ratio = cellValues[0] || 0;
            bodyObj.score_type = cellValues[1] || null;
          } else if (this.block_type === BLOCK_TYPE.DECIMAL) {
            // Decimal: [scoreType, null, decimalPlaces, null, option]
            bodyObj.score_type = cellValues[0] || null;
            bodyObj.decimal_places = parseInt(cellValues[2]) || 0;
            bodyObj.option = parseInt(cellValues[4]) || 0;
          } else {
            // 기타 블록 타입은 요소 순서대로 변환 시도
            bodyElements.forEach((element) => {
              if (element.type === 'Token' && 'menu_key' in element && element.menu_key) {
                if (element.menu_key === 'score_types' && valueIndex < cellValues.length) {
                  if (!bodyObj.input_type) {
                    bodyObj.input_type = cellValues[valueIndex++];
                  } else if (!bodyObj.output_type) {
                    bodyObj.output_type = cellValues[valueIndex++];
                  } else if (!bodyObj.score_type) {
                    bodyObj.score_type = cellValues[valueIndex++];
                  }
                } else if (element.menu_key === 'match_types' && valueIndex < cellValues.length) {
                  if (!bodyObj.input_range) {
                    const val = cellValues[valueIndex++];
                    bodyObj.input_range = val === 'range' ? 1 : (val === 'exact' ? 0 : -1);
                  }
                } else if (valueIndex < cellValues.length) {
                  valueIndex++;
                }
              } else if (element.type === 'Table' && valueIndex < cellValues.length) {
                bodyObj.table = cellValues[valueIndex++];
              } else if (element.type === 'Formula' && valueIndex < cellValues.length) {
                bodyObj.expr = cellValues[valueIndex++];
              } else if (element.type === 'InputField' && valueIndex < cellValues.length) {
                if (!bodyObj.decimal_places) {
                  bodyObj.decimal_places = parseInt(cellValues[valueIndex++]) || 0;
                } else if (!bodyObj.option) {
                  bodyObj.option = parseInt(cellValues[valueIndex++]) || 0;
                } else {
                  valueIndex++;
                }
              } else if (element.type === 'Text') {
                // Text는 건너뛰기
              } else if (valueIndex < cellValues.length) {
                valueIndex++;
              }
            });
          }
          
          // 객체가 비어있지 않으면 객체 사용, 아니면 기존 형식 유지
          return Object.keys(bodyObj).length > 0 ? bodyObj : row;
        });
      } else {
        bodyCells = this.data.body_cells || [];
      }
    } else {
      bodyCells = this.data.body_cells || [];
    }

    return {
      header_cells: headerCells,
      body_cells: bodyCells
    };
  }

  // 렌더링용 헬퍼 메서드 (DB 형식에서 화면 표시용 배열로 변환)
  getHeaderCellValues(colIndex: number): any[] {
    const dbFormat = this.toDbFormat();
    const headerCells = dbFormat.header_cells;
    
    if (!headerCells || !Array.isArray(headerCells) || headerCells.length === 0) {
      return [];
    }

    // 블록 타입별 변환
    if (this.block_type === BLOCK_TYPE.SCORE_MAP) {
      // ScoreMap: { var_scope, filter_option } -> [null, var_scope, filter_option]
      const headerObj = headerCells[0];
      if (typeof headerObj === 'object' && headerObj !== null) {
        return [null, headerObj.var_scope || 0, headerObj.filter_option || 0];
      }
    } else if (this.block_type === BLOCK_TYPE.FORMULA || this.block_type === BLOCK_TYPE.CONDITION || 
               this.block_type === BLOCK_TYPE.DECIMAL) {
      // Formula, Condition, Decimal: { var_scope } -> [] (더 이상 헤더 셀에 표시하지 않음)
      // 헤더 셀에는 더 이상 var_scope가 없음
      return [];
    } else if (this.block_type === BLOCK_TYPE.APPLY_SUBJECT) {
      // ApplySubject: { text_content, include_option } -> [text_content, include_option]
      const headerObj = headerCells[0];
      if (typeof headerObj === 'object' && headerObj !== null) {
        return [headerObj.text_content || '', headerObj.include_option || 'include'];
      }
    }
    
    // 기본: 배열 형식 그대로 반환
    if (Array.isArray(headerCells[colIndex])) {
      return headerCells[colIndex];
    }
    
    return [];
  }

  getBodyCellValues(rowIndex: number, colIndex: number): any[] {
    const dbFormat = this.toDbFormat();
    const bodyCells = dbFormat.body_cells;
    
    if (!bodyCells || !Array.isArray(bodyCells) || !bodyCells[rowIndex]) {
      return [];
    }

    const row = bodyCells[rowIndex];
    
    // 블록 타입별 변환
    if (this.block_type === BLOCK_TYPE.SCORE_MAP) {
      // ScoreMap: { input_type, input_range, output_type, table } -> [inputType, inputRange, '→', outputType, matchType, table]
      if (typeof row === 'object' && row !== null && colIndex === 0) {
        const inputRange = row.input_range === 1 ? 'range' : 'exact';
        return [
          row.input_type || null,
          inputRange,
          '→',
          row.output_type || null,
          'exact', // matchType (기본값)
          row.table || []
        ];
      }
    } else if (this.block_type === BLOCK_TYPE.FORMULA) {
      // Formula: { score_type, expr } -> [scoreType, ' = ', expr]
      if (typeof row === 'object' && row !== null && colIndex === 0) {
        return [row.score_type || null, ' = ', row.expr || null];
      }
    } else if (this.block_type === BLOCK_TYPE.CONDITION) {
      // Condition: { conditions } -> [conditions]
      if (typeof row === 'object' && row !== null && colIndex === 0) {
        return [row.conditions || []];
      }
    } else if (this.block_type === BLOCK_TYPE.AGGREGATION) {
      // Aggregation: { input_type, func, output_type } -> [inputType, func, null, outputType]
      if (typeof row === 'object' && row !== null && colIndex === 0) {
        return [row.input_type || null, row.func || 0, null, row.output_type || null];
      }
    } else if (this.block_type === BLOCK_TYPE.RATIO) {
      // Ratio: { ratio, score_type } -> [ratio, scoreType]
      if (typeof row === 'object' && row !== null && colIndex === 0) {
        return [row.ratio || 0, row.score_type || null];
      }
    } else if (this.block_type === BLOCK_TYPE.DECIMAL) {
      // Decimal: { score_type, decimal_places, option } -> [scoreType, null, decimalPlaces, null, option]
      if (typeof row === 'object' && row !== null && colIndex === 0) {
        return [row.score_type || null, null, row.decimal_places || 0, null, row.option || 0];
      }
    } else if (this.block_type === BLOCK_TYPE.APPLY_SUBJECT) {
      // ApplySubject: { subject_groups } -> [subject_groups]
      if (typeof row === 'object' && row !== null && 'subject_groups' in row && colIndex === 0) {
        return [row.subject_groups || []];
      }
    }
    
    // 기본: 배열 형식 그대로 반환
    if (Array.isArray(row) && Array.isArray(row[colIndex])) {
      return row[colIndex];
    }
    
    return [];
  }

  // 속성 기반 접근 메서드 (기본 구현)
  getHeaderProperties(colIndex: number): Record<string, any> {
    const dbFormat = this.toDbFormat();
    if (dbFormat.header_cells && Array.isArray(dbFormat.header_cells) && dbFormat.header_cells[colIndex]) {
      const headerObj = dbFormat.header_cells[colIndex];
      if (typeof headerObj === 'object' && headerObj !== null && !Array.isArray(headerObj)) {
        return { ...headerObj };
      }
    }
    return {};
  }

  getBodyProperties(rowIndex: number, colIndex: number): Record<string, any> {
    const dbFormat = this.toDbFormat();
    if (dbFormat.body_cells && Array.isArray(dbFormat.body_cells) && dbFormat.body_cells[rowIndex]) {
      const row = dbFormat.body_cells[rowIndex];
      if (typeof row === 'object' && row !== null && !Array.isArray(row) && colIndex === 0) {
        return { ...row };
      } else if (Array.isArray(row) && row[colIndex] && typeof row[colIndex] === 'object' && row[colIndex] !== null && !Array.isArray(row[colIndex])) {
        return { ...row[colIndex] };
      }
    }
    return {};
  }

  updateProperty(propertyName: string, value: any, rowIndex?: number, colIndex?: number): void {
    // 기본 구현: toDbFormat() 결과를 수정하고 다시 data에 저장
    const dbFormat = this.toDbFormat();
    
    if (rowIndex === undefined) {
      // Header 셀 업데이트
      if (dbFormat.header_cells && Array.isArray(dbFormat.header_cells) && dbFormat.header_cells[colIndex || 0]) {
        const headerObj = dbFormat.header_cells[colIndex || 0];
        if (typeof headerObj === 'object' && headerObj !== null && !Array.isArray(headerObj)) {
          headerObj[propertyName] = value;
          this.data.header_cells = dbFormat.header_cells;
        }
      }
    } else {
      // Body 셀 업데이트
      if (dbFormat.body_cells && Array.isArray(dbFormat.body_cells) && dbFormat.body_cells[rowIndex]) {
        const row = dbFormat.body_cells[rowIndex];
        if (typeof row === 'object' && row !== null && !Array.isArray(row) && colIndex === 0) {
          row[propertyName] = value;
          this.data.body_cells = dbFormat.body_cells;
        } else if (Array.isArray(row) && row[colIndex || 0] && typeof row[colIndex || 0] === 'object' && row[colIndex || 0] !== null && !Array.isArray(row[colIndex || 0])) {
          row[colIndex || 0][propertyName] = value;
          this.data.body_cells = dbFormat.body_cells;
        }
      }
    }
  }
}

