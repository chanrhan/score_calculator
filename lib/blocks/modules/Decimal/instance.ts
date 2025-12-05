// lib/blocks/modules/Decimal/instance.ts
// B 인스턴스: Decimal 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';

export class DecimalBlockInstance extends BlockInstance {
  private headerCell: {
    variable_scope: string;
  };
  
  private bodyCells: Array<{
    score_type: string;
    decimal_places: string;
    decimal_option: string;
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.DECIMAL, data);
    
    const defaults = getBlockDefaults(BLOCK_TYPE.DECIMAL);
    
    // header_cells 처리
    if (data.header_cells && Array.isArray(data.header_cells) && data.header_cells.length > 0) {
      const headerObj = data.header_cells[0];
      if (typeof headerObj === 'object' && headerObj !== null && !Array.isArray(headerObj)) {
        this.headerCell = {
          variable_scope: headerObj.variable_scope || defaults.variable_scope || '0',
        };
      } else {
        this.headerCell = { variable_scope: defaults.variable_scope || '0' };
      }
    } else {
      this.headerCell = { variable_scope: defaults.variable_scope || '0' };
    }
    
    // body_cells 처리
    if (data.body_cells && Array.isArray(data.body_cells) && data.body_cells.length > 0) {
      this.bodyCells = data.body_cells.map((row: any) => {
        if (typeof row === 'object' && row !== null && !Array.isArray(row)) {
          return {
            score_type: row.score_type || defaults.score_type || 'finalScore',
            decimal_places: row.decimal_places?.toString() || defaults.decimal_places || '2',
            decimal_option: row.option?.toString() || row.decimal_option || defaults.decimal_option || '0',
          };
        }
        return {
          score_type: defaults.score_type || 'finalScore',
          decimal_places: defaults.decimal_places || '2',
          decimal_option: defaults.decimal_option || '0',
        };
      });
    } else {
      this.bodyCells = [{
        score_type: defaults.score_type || 'finalScore',
        decimal_places: defaults.decimal_places || '2',
        decimal_option: defaults.decimal_option || '0',
      }];
    }
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): DecimalBlockInstance {
    return new DecimalBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    if (rowIndex === -1) {
      if (elementIndex === 1) {
        this.headerCell.variable_scope = value;
      }
    } else {
      if (this.bodyCells[rowIndex]) {
        if (elementIndex === 0) {
          this.bodyCells[rowIndex].score_type = value;
        } else if (elementIndex === 2) {
          this.bodyCells[rowIndex].decimal_places = value?.toString() || '2';
        } else if (elementIndex === 4) {
          this.bodyCells[rowIndex].decimal_option = value?.toString() || '0';
        }
      }
    }
  }

  addRow(rowIndex?: number): void {
    const defaults = getBlockDefaults(BLOCK_TYPE.DECIMAL);
    const newRow = {
      score_type: defaults.score_type || 'finalScore',
      decimal_places: defaults.decimal_places || '2',
      decimal_option: defaults.decimal_option || '0',
    };
    if (rowIndex !== undefined && rowIndex >= 0) {
      this.bodyCells.splice(rowIndex + 1, 0, newRow);
    } else {
      this.bodyCells.push(newRow);
    }
  }

  addColumn(colIndex?: number): void {
    throw new Error('Decimal does not support column addition');
  }

  removeRow(rowIndex: number): void {
    if (rowIndex >= 0 && rowIndex < this.bodyCells.length) {
      this.bodyCells.splice(rowIndex, 1);
    }
  }

  removeColumn(colIndex: number): void {
    throw new Error('Decimal does not support column removal');
  }

  getStructure(): FlowBlockType {
    // BlockInstance 내에서 직접 구조 생성 (structure.ts 제거)
    return {
      name: 'Decimal',
      color: 'blue',
      col_editable: false, // 열 추가 불가
      cols: [{
        header: { elements: [] },
        rows: [{ elements: [] }]
      }]
    };
  }

  toDbFormat(): { header_cells: any; body_cells: any } {
    return {
      header_cells: [this.headerCell],
      body_cells: this.bodyCells.map(row => ({
        score_type: row.score_type,
        decimal_places: parseInt(row.decimal_places) || 2,
        option: parseInt(row.decimal_option) || 0,
      }))
    };
  }

  getHeaderCellValues(colIndex: number): any[] {
    if (colIndex === 0) {
      return [null, this.headerCell.variable_scope];
    }
    return [];
  }

  getBodyCellValues(rowIndex: number, colIndex: number): any[] {
    if (colIndex === 0 && this.bodyCells[rowIndex]) {
      return [
        this.bodyCells[rowIndex].score_type,
        null,
        parseInt(this.bodyCells[rowIndex].decimal_places) || 2,
        null,
        parseInt(this.bodyCells[rowIndex].decimal_option) || 0
      ];
    }
    return [];
  }

  getHeaderProperties(colIndex: number): Record<string, any> {
    if (colIndex === 0) {
      return {
        variable_scope: this.headerCell.variable_scope,
      };
    }
    return {};
  }

  getBodyProperties(rowIndex: number, colIndex: number): Record<string, any> {
    if (colIndex === 0 && this.bodyCells[rowIndex]) {
      return {
        score_type: this.bodyCells[rowIndex].score_type,
        decimal_places: this.bodyCells[rowIndex].decimal_places,
        decimal_option: this.bodyCells[rowIndex].decimal_option,
      };
    }
    return {};
  }

  updateProperty(propertyName: string, value: any, rowIndex?: number, colIndex?: number): void {
    if (propertyName === 'variable_scope') {
      this.headerCell.variable_scope = value;
    } else if (rowIndex !== undefined && this.bodyCells[rowIndex]) {
      if (propertyName === 'score_type') {
        this.bodyCells[rowIndex].score_type = value;
      } else if (propertyName === 'decimal_places') {
        this.bodyCells[rowIndex].decimal_places = value?.toString() || '2';
      } else if (propertyName === 'decimal_option') {
        this.bodyCells[rowIndex].decimal_option = value?.toString() || '0';
      }
    }
  }
}
