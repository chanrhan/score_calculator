/**
 * 소수점 반올림
 * @param num 반올림할 숫자
 * @returns 소수점 digits자리까지 반올림된 숫자
 */
export function round(num: number, digits: number) {
    const m = Math.pow(10, digits);
    const isMinus = num < 0;
    num = Math.abs(num);
    const adjusted = (digits > 3 ? Number(num.toPrecision(15)) : Number(num.toPrecision(10))) * m;
    return ((isMinus ? -1 : 1) * Math.floor(adjusted + 0.5)) / m;
  }

export function floor(value: number, decimals: number = 3): number {
    const m = Math.pow(10, decimals);
    return Math.floor(Number(value.toPrecision(10)) * m) / m;
}

export function ceil(value: number, decimals: number = 3): number {
    const m = Math.pow(10, decimals);
    return Math.ceil(Number(value.toPrecision(10)) * m) / m;
}

/**
 * 소수점에서 버림 (부동소수점 오차 보정)
 * @param num 버림할 숫자
 * @returns 소수점 (digits + 1)자리에서 버림된 숫자. 즉 소수점 digits자리까지 표시
 */
export function truncate(value: number, digits: number): number {
    // 더 높은 정밀도로 반올림한 뒤, 원하는 자리에서 버림 처리
    const highPrecision = Math.pow(10, Math.max(0, digits + 2));
    const roundedInt = Math.round(value * highPrecision);
    const divisor = Math.pow(10, 2); // (digits+2) → digits로 내리기 위한 10^2
    const floored = Math.floor(roundedInt / divisor);
    return floored / Math.pow(10, digits);
  }