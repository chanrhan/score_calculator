/**
 * 범위 관련 유틸리티 함수
 * ScoreTableBlockExecutor의 parseRange 함수와 호환되는 형식 처리
 */

export interface RangeInput {
  start: number | null
  end: number | null
  includeStart: boolean // true: 이상, false: 초과
  includeEnd: boolean  // true: 이하, false: 미만
}

export interface ParsedRange {
  start: number
  end: number
  includeStart: boolean
  includeEnd: boolean
}

/**
 * 범위 문자열을 파싱하여 ParsedRange 객체로 변환
 * ScoreTableBlockExecutor의 parseRange 로직과 동일
 */
function parseRangeString(rangeStr: string): ParsedRange | null {
  if (!rangeStr || typeof rangeStr !== 'string') {
    return null
  }

  const trimmed = rangeStr.trim()
  
  // 양쪽 범위 - 괄호 형식: [80-100], (80-100], [80-100), (80-100)
  const bracketMatch = trimmed.match(/^([\[\(])(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)([\]\)])$/)
  if (bracketMatch) {
    const startBracket = bracketMatch[1]
    const start = parseFloat(bracketMatch[2])
    const end = parseFloat(bracketMatch[3])
    const endBracket = bracketMatch[4]
    
    return {
      start,
      end,
      includeStart: startBracket === '[',
      includeEnd: endBracket === ']'
    }
  }
  
  // 양쪽 범위 - 기존 형식: 80-100 (양 끝 포함이 기본값)
  const simpleMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/)
  if (simpleMatch) {
    const start = parseFloat(simpleMatch[1])
    const end = parseFloat(simpleMatch[2])
    
    return {
      start,
      end,
      includeStart: true,
      includeEnd: true
    }
  }
  
  // 시작값만 - 괄호 형식: [80-, (80-
  const startOnlyBracketMatch = trimmed.match(/^([\[\(])(\d+(?:\.\d+)?)\s*-\s*$/)
  if (startOnlyBracketMatch) {
    const startBracket = startOnlyBracketMatch[1]
    const start = parseFloat(startOnlyBracketMatch[2])
    
    return {
      start,
      end: Infinity,
      includeStart: startBracket === '[',
      includeEnd: true
    }
  }
  
  // 시작값만 - 기존 형식: 80- (80 이상)
  const startOnlyMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*-\s*$/)
  if (startOnlyMatch) {
    const start = parseFloat(startOnlyMatch[1])
    
    return {
      start,
      end: Infinity,
      includeStart: true,
      includeEnd: true
    }
  }
  
  // 끝값만 - 괄호 형식: -80], -80)
  const endOnlyBracketMatch = trimmed.match(/^-\s*(\d+(?:\.\d+)?)([\]\)])$/)
  if (endOnlyBracketMatch) {
    const end = parseFloat(endOnlyBracketMatch[1])
    const endBracket = endOnlyBracketMatch[2]
    
    return {
      start: -Infinity,
      end,
      includeStart: true,
      includeEnd: endBracket === ']'
    }
  }
  
  // 끝값만 - 기존 형식: -80 (80 이하)
  const endOnlyMatch = trimmed.match(/^-\s*(\d+(?:\.\d+)?)$/)
  if (endOnlyMatch) {
    const end = parseFloat(endOnlyMatch[1])
    
    return {
      start: -Infinity,
      end,
      includeStart: true,
      includeEnd: true
    }
  }
  
  return null
}

/**
 * 범위 문자열을 한글 설명으로 변환
 * 예: "[1-2]" → "1 이상 2 이하"
 *     "(1-2]" → "1 초과 2 이하"
 *     "[1-2)" → "1 이상 2 미만"
 *     "(1-2)" → "1 초과 2 미만"
 */
export function parseRangeToDisplay(rangeStr: string): string {
  if (!rangeStr || typeof rangeStr !== 'string') {
    return ''
  }

  const parsed = parseRangeString(rangeStr)
  if (!parsed) {
    return rangeStr // 파싱 실패 시 원본 반환
  }

  const { start, end, includeStart, includeEnd } = parsed

  // 시작값 부분
  let startText = ''
  if (start === -Infinity) {
    startText = ''
  } else {
    startText = `${start} ${includeStart ? '이상' : '초과'}`
  }

  // 끝값 부분
  let endText = ''
  if (end === Infinity) {
    endText = ''
  } else {
    endText = `${end} ${includeEnd ? '이하' : '미만'}`
  }

  // 조합
  if (startText && endText) {
    return `${startText} ${endText}`
  } else if (startText) {
    return startText
  } else if (endText) {
    return endText
  } else {
    return rangeStr // 둘 다 없으면 원본 반환
  }
}

/**
 * 사용자 입력(RangeInput)을 parseRange가 인식하는 형식으로 변환
 */
export function formatRangeFromInput(input: RangeInput): string {
  const { start, end, includeStart, includeEnd } = input

  // 둘 다 null이면 빈 문자열
  if (start === null && end === null) {
    return ''
  }

  // 시작값만 있는 경우
  if (start !== null && end === null) {
    const startBracket = includeStart ? '[' : '('
    return `${startBracket}${start}-`
  }

  // 끝값만 있는 경우
  if (start === null && end !== null) {
    const endBracket = includeEnd ? ']' : ')'
    return `-${end}${endBracket}`
  }

  // 둘 다 있는 경우
  if (start !== null && end !== null) {
    const startBracket = includeStart ? '[' : '('
    const endBracket = includeEnd ? ']' : ')'
    return `${startBracket}${start}-${end}${endBracket}`
  }

  return ''
}

/**
 * 기존 범위 문자열을 편집 가능한 RangeInput 형태로 파싱
 */
export function parseRangeToInput(rangeStr: string): RangeInput {
  if (!rangeStr || typeof rangeStr !== 'string') {
    return {
      start: null,
      end: null,
      includeStart: true,
      includeEnd: true
    }
  }

  const parsed = parseRangeString(rangeStr)
  if (!parsed) {
    // 파싱 실패 시 빈 값 반환
    return {
      start: null,
      end: null,
      includeStart: true,
      includeEnd: true
    }
  }

  const { start, end, includeStart, includeEnd } = parsed

  return {
    start: start === -Infinity ? null : start,
    end: end === Infinity ? null : end,
    includeStart,
    includeEnd
  }
}

