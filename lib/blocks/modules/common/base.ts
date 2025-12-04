// lib/blocks/modules/common/base.ts
// 공통 기본 클래스 및 유틸리티

import { BlockPropertyValues, BlockStructureDefinition } from './types';
import { BlockInstanceData } from '../../BlockInstance';
import { FlowBlockType } from '@/types/block-structure';

/**
 * 공통 블록 인스턴스 기본 클래스
 * 속성 기반 데이터 관리를 위한 공통 로직
 */
export abstract class BaseBlockInstance {
  protected properties: BlockPropertyValues;
  protected readonly blockId: number;
  protected readonly blockType: number;
  protected readonly structure: BlockStructureDefinition;

  constructor(
    blockId: number,
    blockType: number,
    structure: BlockStructureDefinition,
    data: BlockInstanceData
  ) {
    this.blockId = blockId;
    this.blockType = blockType;
    this.structure = structure;
    this.properties = this.parseData(data);
  }

  /**
   * DB 데이터를 속성 기반 구조로 파싱
   */
  protected parseData(data: BlockInstanceData): BlockPropertyValues {
    // 기본값으로 시작
    const props: BlockPropertyValues = { ...this.structure.defaults };

    // header_cells에서 속성 추출
    if (data.header_cells && Array.isArray(data.header_cells)) {
      this.parseHeaderCells(data.header_cells, props);
    }

    // body_cells에서 속성 추출
    if (data.body_cells && Array.isArray(data.body_cells)) {
      this.parseBodyCells(data.body_cells, props);
    }

    return props;
  }

  /**
   * 헤더 셀에서 속성 추출 (서브클래스에서 구현)
   */
  protected abstract parseHeaderCells(headerCells: any[], props: BlockPropertyValues): void;

  /**
   * 바디 셀에서 속성 추출 (서브클래스에서 구현)
   */
  protected abstract parseBodyCells(bodyCells: any[], props: BlockPropertyValues): void;

  /**
   * 속성 값을 DB 형식으로 변환
   */
  toDbFormat(): { header_cells: any; body_cells: any } {
    return {
      header_cells: this.serializeHeaderCells(),
      body_cells: this.serializeBodyCells(),
    };
  }

  /**
   * 헤더 셀 직렬화 (서브클래스에서 구현)
   */
  protected abstract serializeHeaderCells(): any;

  /**
   * 바디 셀 직렬화 (서브클래스에서 구현)
   */
  protected abstract serializeBodyCells(): any;

  /**
   * 속성 값 가져오기
   */
  getProperty(key: string): any {
    return this.properties[key];
  }

  /**
   * 속성 값 설정하기
   */
  setProperty(key: string, value: any): void {
    if (key in this.structure.properties) {
      this.properties[key] = value;
    }
  }

  /**
   * 모든 속성 가져오기
   */
  getProperties(): BlockPropertyValues {
    return { ...this.properties };
  }
}

