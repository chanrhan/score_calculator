// lib/utils/formulaLabelReplacer.ts
// 수식에서 변수를 토큰 메뉴 라벨로 치환하는 유틸리티

import { extractHashPatternContents } from './stringPattern';
import type { TokenMenuStore } from '@/types/domain';

interface PipelineVariable {
  variable_name: string;
  scope: string;
}

/**
 * 수식의 변수 참조를 라벨로 치환
 * @param expr - DSL 수식
 * @param tokenMenuStore - 토큰 메뉴 저장소
 * @param pipelineVariables - 파이프라인 변수 배열
 * @param univId - 대학 ID
 * @returns 변수가 라벨로 치환된 수식
 */
export function replaceFormulaVariablesWithLabels(
  expr: string | null | undefined,
  tokenMenuStore: TokenMenuStore,
  pipelineVariables: PipelineVariable[],
  univId: string
): string {
  if (!expr || typeof expr !== 'string') {
    return expr || '';
  }

  // 변수 참조 패턴 추출 (#{variable_name})
  const variableNames = extractHashPatternContents(expr);
  
  if (variableNames.length === 0) {
    return expr;
  }

  // 파이프라인 변수 맵 생성
  const variableMap = new Map<string, PipelineVariable>();
  pipelineVariables.forEach(v => {
    variableMap.set(v.variable_name, v);
  });

  let result = expr;

  // 각 변수명에 대해 라벨 찾아서 치환
  variableNames.forEach(variableName => {
    const variable = variableMap.get(variableName);
    
    if (!variable) {
      // 파이프라인 변수가 아니면 그대로 유지
      return;
    }

    // 변수명 자체가 라벨 (변수명을 그대로 표시)
    // 변수명을 menu_key로 가진 토큰 메뉴가 있는 경우 해당 메뉴의 name 사용
    const tokenMenu = tokenMenuStore.get(variable.variable_name);
    let label = variable.variable_name; // 기본값은 변수명
    
    if (tokenMenu && tokenMenu.name) {
      // 토큰 메뉴를 찾았으면 메뉴 이름(name 필드)을 라벨로 사용
      label = tokenMenu.name;
    }
    
    // 모든 #{variableName} 패턴을 라벨로 치환 (전역 치환)
    result = result.replace(new RegExp(`#\\{${variableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`, 'g'), label);
  });

  return result;
}

/**
 * 변수명으로 토큰 메뉴 라벨 찾기
 * 변수명이 토큰 메뉴의 key인 경우 해당 메뉴의 이름을 반환
 * @param variableName - 변수명
 * @param tokenMenuStore - 토큰 메뉴 저장소
 * @returns 라벨 문자열
 */
function findLabelForVariable(
  variableName: string,
  tokenMenuStore: TokenMenuStore
): string {
  // 변수명을 menu_key로 가진 토큰 메뉴 찾기
  const tokenMenu = tokenMenuStore.get(variableName);
  
  if (tokenMenu && tokenMenu.name) {
    return tokenMenu.name;
  }

  // 찾지 못하면 변수명 그대로 반환
  return variableName;
}

