// utils/blockDataJson.ts
// block_data 편집용 JSON 유틸: 템플릿 생성, 파싱/문자열화, 병합 추가

import JSON5 from 'json5';

export type JsonValue = any;

export function stringifyJsonData(data: JsonValue): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return '';
  }
}

// JSON5 파서를 사용하여 키에 따옴표 없는 형식도 허용
export function parseJsonData(jsonString: string): JsonValue {
  if (!jsonString || jsonString.trim() === '') return {};
  try {
    return JSON5.parse(jsonString);
  } catch {
    // JSON5 파싱 실패 시 표준 JSON으로 시도
    return JSON.parse(jsonString);
  }
}

export function generateElementTemplate(type: 'Token' | 'InputField' | 'Text' | 'Table' | 'Formula' | 'List' | 'ConditionChain'): JsonValue {
  const templates: Record<string, JsonValue> = {
    Token: { name: 'Token', menu_key: '' },
    InputField: { name: 'InputField' },
    Text: { name: 'Text', content: '' },
    Table: { name: 'Table', init_row: 0, init_col: 0 },
    Formula: { name: 'Formula' },
    List: { name: 'List', item_type: '', menu_key: '', optional: false },
    ConditionChain: { name: 'ConditionChain', item_type: [], optional: false },
  };
  return templates[type];
}

// fieldValue에 템플릿을 삽입: 객체/배열/빈문자열 모두 수용
export function insertTemplateToField(current: string, type: Parameters<typeof generateElementTemplate>[0]): string {
  const template = generateElementTemplate(type);
  if (!current || current.trim() === '' || current.trim() === '{}') {
    return stringifyJsonData(template);
  }
  try {
    const parsed = parseJsonData(current);
    if (Array.isArray(parsed)) {
      return stringifyJsonData([...parsed, template]);
    }
    return stringifyJsonData([parsed, template]);
  } catch {
    return `${current},\n${stringifyJsonData(template)}`;
  }
}


