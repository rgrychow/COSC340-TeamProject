// utils/calc.ts
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

export function total(numbers: number[]): number {
  return numbers.reduce((sum, n) => sum + n, 0);
}

