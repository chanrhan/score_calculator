// lib/blocks/modules/common/elementHelpers.ts
// Cell Element 생성 헬퍼 함수들 (type 필드 없이)

/**
 * Token element 생성 (type 필드 없이)
 */
export function createTokenElement(props: {
  menu_key: string;
  value: any;
  optional?: boolean;
  visible?: boolean;
  var_use?: boolean;
  var_store?: boolean;
}) {
  return {
    menu_key: props.menu_key,
    value: props.value,
    optional: props.optional ?? false,
    visible: props.visible ?? true,
    var_use: props.var_use,
    var_store: props.var_store,
  } as any;
}

/**
 * List element 생성 (type 필드 없이)
 */
export function createListElement(props: {
  item_type: string;
  menu_key?: string;
  menu_key2?: string;
  value: any[];
  optional?: boolean;
  visible?: boolean;
}) {
  return {
    item_type: props.item_type,
    menu_key: props.menu_key,
    menu_key2: props.menu_key2,
    value: props.value,
    optional: props.optional ?? false,
    visible: props.visible ?? true,
  } as any;
}

/**
 * Text element 생성 (type 필드 없이)
 */
export function createTextElement(props: {
  content: string;
  optional?: boolean;
  visible?: boolean;
}) {
  return {
    content: props.content,
    optional: props.optional ?? false,
    visible: props.visible ?? true,
  } as any;
}

/**
 * Formula element 생성 (type 필드 없이)
 */
export function createFormulaElement(props: {
  menu_key: string;
  value: string;
  optional?: boolean;
  visible?: boolean;
}) {
  return {
    menu_key: props.menu_key,
    value: props.value,
    optional: props.optional ?? false,
    visible: props.visible ?? true,
  } as any;
}

/**
 * InputField element 생성 (type 필드 없이)
 */
export function createInputFieldElement(props: {
  value: string;
  optional?: boolean;
  visible?: boolean;
}) {
  return {
    value: props.value,
    optional: props.optional ?? false,
    visible: props.visible ?? true,
  } as any;
}

/**
 * Table element 생성 (type 필드 없이)
 */
export function createTableElement(props: {
  init_rows: number;
  init_cols: number;
  input_type: string;
  input_option?: string;
  output_type: string;
  value: any[][];
  optional?: boolean;
  visible?: boolean;
}) {
  return {
    init_rows: props.init_rows,
    init_cols: props.init_cols,
    input_type: props.input_type,
    input_option: props.input_option,
    output_type: props.output_type,
    value: props.value,
    optional: props.optional ?? false,
    visible: props.visible ?? true,
  } as any;
}

/**
 * ConditionChain element 생성 (type 필드 없이)
 */
export function createConditionChainElement(props: {
  item_type: Array<{ type: string; menu_key?: string; content?: string }>;
  value: any[];
  optional?: boolean;
  visible?: boolean;
}) {
  return {
    item_type: props.item_type,
    value: props.value,
    optional: props.optional ?? false,
    visible: props.visible ?? true,
  } as any;
}

