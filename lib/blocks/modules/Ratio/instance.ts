// lib/blocks/modules/Ratio/instance.ts
// B 인스턴스: Ratio 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';
import { RatioStructure } from './structure';
import { toFlowBlockType } from '../common/types';
import { getBlockDefaults } from '../common/defaults';

export class RatioBlockInstance extends BlockInstance {
  private bodyCells: Array<{
    ratio: string;
    score_type: string;
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.RATIO, data);
    
    const defaults = getBlockDefaults(BLOCK_TYPE.RATIO);
    
    // body_cells 처리
    if (data.body_cells && Array.isArray(data.body_cells) && data.body_cells.length > 0) {
      this.bodyCells = data.body_cells.map((row: any) => {
        if (typeof row === 'object' && row !== null && !Array.isArray(row)) {
          return {
            ratio: row.ratio?.toString() || defaults.ratio || '100',
            score_type: row.score_type || defaults.score_type || 'finalScore',
          };
        }
        return {
          ratio: defaults.ratio || '100',
          score_type: defaults.score_type || 'finalScore',
        };
      });
    } else {
      this.bodyCells = [{
        ratio: defaults.ratio || '100',
        score_type: defaults.score_type || 'finalScore',
      }];
    }
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): RatioBlockInstance {
    return new RatioBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    if (this.bodyCells[rowIndex]) {
      if (elementIndex === 0) {
        this.bodyCells[rowIndex].ratio = value?.toString() || '100';
      } else if (elementIndex === 1) {
        this.bodyCells[rowIndex].score_type = value;
      }
    }
  }

  addRow(rowIndex?: number): void {
    const defaults = getBlockDefaults(BLOCK_TYPE.RATIO);
    const newRow = {
      ratio: defaults.ratio || '100',
      score_type: defaults.score_type || 'finalScore',
    };
    if (rowIndex !== undefined && rowIndex >= 0) {
      this.bodyCells.splice(rowIndex + 1, 0, newRow);
    } else {
      this.bodyCells.push(newRow);
    }
  }

  addColumn(colIndex?: number): void {
    throw new Error('Ratio does not support column addition');
  }

  removeRow(rowIndex: number): void {
    if (rowIndex >= 0 && rowIndex < this.bodyCells.length) {
      this.bodyCells.splice(rowIndex, 1);
    }
  }

  removeColumn(colIndex: number): void {
    throw new Error('Ratio does not support column removal');
  }

  getStructure(): FlowBlockType {
    return toFlowBlockType(RatioStructure);
  }

  toDbFormat(): { header_cells: any; body_cells: any } {
    return {
      header_cells: [],
      body_cells: this.bodyCells
    };
  }

  getHeaderCellValues(colIndex: number): any[] {
    return [];
  }

  getBodyCellValues(rowIndex: number, colIndex: number): any[] {
    if (colIndex === 0 && this.bodyCells[rowIndex]) {
      return [
        this.bodyCells[rowIndex].ratio,
        this.bodyCells[rowIndex].score_type
      ];
    }
    return [];
  }

  getHeaderProperties(colIndex: number): Record<string, any> {
    return {};
  }

  getBodyProperties(rowIndex: number, colIndex: number): Record<string, any> {
    if (colIndex === 0 && this.bodyCells[rowIndex]) {
      return {
        ratio: this.bodyCells[rowIndex].ratio,
        score_type: this.bodyCells[rowIndex].score_type,
      };
    }
    return {};
  }

  updateProperty(propertyName: string, value: any, rowIndex?: number, colIndex?: number): void {
    if (rowIndex !== undefined && this.bodyCells[rowIndex]) {
      if (propertyName === 'ratio') {
        this.bodyCells[rowIndex].ratio = value?.toString() || '100';
      } else if (propertyName === 'score_type') {
        this.bodyCells[rowIndex].score_type = value;
      }
    }
  }
}
