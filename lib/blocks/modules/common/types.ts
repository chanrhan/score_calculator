// lib/blocks/modules/common/types.ts
// 공통 타입 정의 - 속성 기반 블록 구조

import { FlowBlockType } from '@/types/block-structure';
import React from 'react';

/**
 * 블록 속성 스키마 정의
 * 각 블록의 데이터 구조를 key-value 형태로 정의
 */
export interface BlockPropertySchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    default?: any;
    optional?: boolean;
    // 배열 타입인 경우 요소 타입
    itemType?: 'string' | 'number' | 'object';
    // 객체 타입인 경우 중첩 스키마
    properties?: BlockPropertySchema;
  };
}

/**
 * 블록 속성 값 타입
 */
export type BlockPropertyValues = Record<string, any>;

/**
 * 레이아웃 렌더링 컨텍스트
 */
export interface LayoutRenderContext {
  properties: BlockPropertyValues;
  readOnly: boolean;
  onChange?: (propertyName: string, value: any) => void;
  className?: string;
}

/**
 * 레이아웃 컴포넌트 타입
 * 각 블록이 직접 HTML/CSS를 작성할 수 있는 React 컴포넌트 함수
 */
export type LayoutComponent = React.FC<LayoutRenderContext>;

/**
 * 레이아웃 정의 (새로운 방식)
 * - 단일 컴포넌트: 모든 열에 동일한 레이아웃 적용
 * - 열별 컴포넌트: 각 열마다 다른 레이아웃 적용 (GradeRatio, SeparationRatio 등)
 */
export interface BlockLayoutDefinition {
  // 헤더 레이아웃
  // 단일 컴포넌트인 경우: 모든 열에 동일하게 적용
  // 열별 컴포넌트인 경우: 각 열 인덱스에 해당하는 컴포넌트 사용
  header?: LayoutComponent | {
    [columnIndex: number]: LayoutComponent;
  };
  // 바디 레이아웃
  // 단일 컴포넌트인 경우: 모든 열에 동일하게 적용
  // 열별 컴포넌트인 경우: 각 열 인덱스에 해당하는 컴포넌트 사용
  body?: LayoutComponent | {
    [columnIndex: number]: LayoutComponent;
  };
}

/**
 * 레이아웃 컴포넌트를 열 인덱스로 가져오는 헬퍼 함수
 */
export function getLayoutComponent(
  layout: LayoutComponent | { [columnIndex: number]: LayoutComponent } | undefined,
  colIndex: number
): LayoutComponent | undefined {
  if (!layout) return undefined;
  
  // 단일 컴포넌트인 경우
  if (typeof layout === 'function') {
    return layout;
  }
  
  // 열별 컴포넌트인 경우
  return layout[colIndex];
}

/**
 * 블록 구조 정의 (새로운 방식)
 */
export interface BlockStructureDefinition {
  name: string;
  color: string;
  col_editable: boolean;
  // 속성 스키마
  properties: BlockPropertySchema;
  // 기본값
  defaults: BlockPropertyValues;
  // 레이아웃 정의
  layout: BlockLayoutDefinition;
}

/**
 * 기존 FlowBlockType과의 호환성을 위한 어댑터
 * 새로운 구조를 기존 시스템에서 사용할 수 있도록 변환
 */
export function toFlowBlockType(structure: BlockStructureDefinition): FlowBlockType {
  // 기본 구조만 반환 (실제 레이아웃은 layout.tsx에서 처리)
  return {
    name: structure.name,
    color: structure.color,
    col_editable: structure.col_editable,
    cols: [{
      header: { elements: [] },
      rows: [{ elements: [] }]
    }]
  };
}
