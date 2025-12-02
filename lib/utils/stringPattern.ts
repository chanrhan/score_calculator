/**
 * 문자열에서 #{문자열} 패턴의 모든 부분 문자열을 추출하는 유틸리티 함수들
 */

/**
 * 문자열에서 #{문자열} 패턴의 모든 부분 문자열을 배열로 추출합니다.
 * @param text - 검색할 문자열
 * @returns #{문자열} 패턴의 배열
 * 
 * @example
 * // 기본 사용법
 * extractHashPatterns("Hello #{name}, your score is #{score}")
 * // returns: ["#{name}", "#{score}"]
 * 
 * // 중첩된 중괄호가 있는 경우
 * extractHashPatterns("Formula: #{math} + #{science} = #{total}")
 * // returns: ["#{math}", "#{science}", "#{total}"]
 * 
 * // 빈 문자열이나 null인 경우
 * extractHashPatterns("")
 * // returns: []
 * 
 * // 패턴이 없는 경우
 * extractHashPatterns("Hello world")
 * // returns: []
 * 
 * // 빈 중괄호도 매칭됨
 * extractHashPatterns("Empty: #{}")
 * // returns: ["#{}"]
 */
export function extractHashPatterns(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const regex = /#\{[^}]*\}/g;
  const matches = text.match(regex);
  
  return matches || [];
}

/**
 * 문자열에서 #{문자열} 패턴의 내용(중괄호 안의 문자열)만 추출합니다.
 * @param text - 검색할 문자열
 * @returns 중괄호 안의 문자열 배열
 * 
 * @example
 * // 기본 사용법
 * extractHashPatternContents("Hello #{name}, your score is #{score}")
 * // returns: ["name", "score"]
 * 
 * // 복잡한 변수명
 * extractHashPatternContents("Student #{studentId} has grade #{finalGrade}")
 * // returns: ["studentId", "finalGrade"]
 * 
 * // 빈 중괄호
 * extractHashPatternContents("Empty: #{}")
 * // returns: [""]
 * 
 * // 패턴이 없는 경우
 * extractHashPatternContents("Hello world")
 * // returns: []
 * 
 * // 공백이 포함된 경우
 * extractHashPatternContents("Value: #{ myVar }")
 * // returns: [" myVar "]
 */
export function extractHashPatternContents(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const regex = /#\{([^}]*)\}/g;
  const matches: string[] = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1]);
  }
  
  return matches;
}

/**
 * 문자열에서 #{문자열} 패턴을 다른 문자열로 치환합니다.
 * @param text - 원본 문자열
 * @param replacement - 치환할 문자열 (기본값: '@@')
 * @returns 치환된 문자열
 * 
 * @example
 * // 기본 사용법
 * replaceHashPatterns("Hello #{name}, your score is #{score}", '@@')
 * // returns: "Hello @@, your score is @@"
 * 
 * // 다른 치환 문자열 사용
 * replaceHashPatterns("Formula: #{math} + #{science}", 'VARIABLE')
 * // returns: "Formula: VARIABLE + VARIABLE"
 * 
 * // 빈 문자열로 치환
 * replaceHashPatterns("Remove #{temp} variable", '')
 * // returns: "Remove  variable"
 * 
 * // 패턴이 없는 경우
 * replaceHashPatterns("Hello world", '@@')
 * // returns: "Hello world"
 * 
 * // 빈 중괄호도 치환됨
 * replaceHashPatterns("Empty: #{}", 'PLACEHOLDER')
 * // returns: "Empty: PLACEHOLDER"
 */
export function replaceHashPatterns(text: string, replacement: string = '@@'): string {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  const regex = /#\{[^}]*\}/g;
  return text.replace(regex, replacement);
}
  
/**
 * 문자열에서 #{문자열} 패턴을 가변 파라미터로 받은 값들로 순서대로 치환합니다.
 * @param text - 원본 문자열
 * @param replacements - 치환할 값들 (가변 파라미터)
 * @returns 치환된 문자열
 * 
 * @example
 * // 기본 사용법
 * replaceHashPatternsWithValues("Hello #{name}, your age is #{age}", "김철수", 25)
 * // returns: "Hello 김철수, your age is 25"
 * 
 * // 여러 값으로 치환
 * replaceHashPatternsWithValues("Math: #{math}, Science: #{science}, English: #{english}", 90, 85, 95)
 * // returns: "Math: 90, Science: 85, English: 95"
 * 
 * // 패턴보다 값이 적은 경우
 * replaceHashPatternsWithValues("A: #{a}, B: #{b}, C: #{c}", "값1", "값2")
 * // returns: "A: 값1, B: 값2, C: #{c}"
 * 
 * // 패턴보다 값이 많은 경우 (남는 값은 무시)
 * replaceHashPatternsWithValues("A: #{a}, B: #{b}", "값1", "값2", "값3", "값4")
 * // returns: "A: 값1, B: 값2"
 * 
 * // 패턴이 없는 경우
 * replaceHashPatternsWithValues("Hello world", "값1", "값2")
 * // returns: "Hello world"
 * 
 * // 빈 중괄호도 치환됨
 * replaceHashPatternsWithValues("Empty: #{}", "빈값")
 * // returns: "Empty: 빈값"
 */
export function replaceHashPatternsWithValues(text: string, ...replacements: any[]): string {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  if (replacements.length === 0) {
    return text;
  }
  
  const regex = /#\{[^}]*\}/g;
  let replacementIndex = 0;
  
  return text.replace(regex, (match) => {
    if (replacementIndex < replacements.length) {
      return String(replacements[replacementIndex++]);
    }
    // 값이 부족한 경우 원본 패턴 유지
    return match;
  });
}

/**
 * 문자열에 #{문자열} 패턴이 있는지 확인합니다.
 * @param text - 검색할 문자열
 * @returns 패턴이 존재하면 true, 아니면 false
 * 
 * @example
 * // 패턴이 있는 경우
 * hasHashPatterns("Hello #{name}")
 * // returns: true
 * 
 * // 여러 패턴이 있는 경우
 * hasHashPatterns("Formula: #{math} + #{science}")
 * // returns: true
 * 
 * // 패턴이 없는 경우
 * hasHashPatterns("Hello world")
 * // returns: false
 * 
 * // 빈 중괄호도 패턴으로 인식
 * hasHashPatterns("Empty: #{}")
 * // returns: true
 * 
 * // 빈 문자열
 * hasHashPatterns("")
 * // returns: false
 */
export function hasHashPatterns(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  const regex = /#\{[^}]*\}/;
  return regex.test(text);
}

// 실제 사용 예시
/*
// 1. 기본 패턴 추출
const formula = "Student #{studentId} scored #{mathScore} in math and #{scienceScore} in science";
const patterns = extractHashPatterns(formula);
console.log(patterns); // ["#{studentId}", "#{mathScore}", "#{scienceScore}"]

// 2. 변수명만 추출
const variableNames = extractHashPatternContents(formula);
console.log(variableNames); // ["studentId", "mathScore", "scienceScore"]

// 3. 패턴 치환
const replacedFormula = replaceHashPatterns(formula, '@@');
console.log(replacedFormula); // "Student @@ scored @@ in math and @@ in science"

// 4. 패턴 존재 확인
const hasPatterns = hasHashPatterns(formula);
console.log(hasPatterns); // true

// 5. 실제 프로젝트에서의 사용 예시 (blockExecutors.ts에서)
const expr = "total = #{math} + #{science} + #{english}";
const processedExpr = replaceHashPatterns(expr, '@@');
console.log(processedExpr); // "total = @@ + @@ + @@"

// 6. 동적 변수 처리
const template = "Hello #{name}, your total score is #{total}";
const variables = extractHashPatternContents(template);
console.log(variables); // ["name", "total"]

// 각 변수에 실제 값 할당
const values = { name: "김철수", total: 95 };
let result = template;
variables.forEach(variable => {
  result = result.replace(`#{${variable}}`, values[variable] || '');
});
console.log(result); // "Hello 김철수, your total score is 95"

// 7. 가변 파라미터로 치환하는 새로운 함수 사용
const expr2 = "Hello, My name is #{name}. and my age is #{age}";
const result2 = replaceHashPatternsWithValues(expr2, "김철수", 25);
console.log(result2); // "Hello, My name is 김철수. and my age is 25"

// 8. 여러 과목 점수 치환
const scoreTemplate = "Math: #{math}, Science: #{science}, English: #{english}";
const scores = replaceHashPatternsWithValues(scoreTemplate, 90, 85, 95);
console.log(scores); // "Math: 90, Science: 85, English: 95"

// 9. 값이 부족한 경우
const partialTemplate = "A: #{a}, B: #{b}, C: #{c}";
const partialResult = replaceHashPatternsWithValues(partialTemplate, "값1", "값2");
console.log(partialResult); // "A: 값1, B: 값2, C: #{c}"

// 10. 값이 많은 경우
const excessTemplate = "A: #{a}, B: #{b}";
const excessResult = replaceHashPatternsWithValues(excessTemplate, "값1", "값2", "값3", "값4");
console.log(excessResult); // "A: 값1, B: 값2"
*/
