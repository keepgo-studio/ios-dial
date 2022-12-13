/**
 * @param {Array<number>} arr 
 * @returns {number}
 */
export function sum(arr: Array<number>): number {
  return arr.reduce((acc, cur) => acc + cur, 0);
}

/**
 * 
 * @param {number} num 
 * @returns {Array<number>}
 * @description "return number array which is in ascending order"
 */
export function range(num: any) {
  return [...Array(num).keys()];
}

export function degreesToRadians(degrees: number) {
  return degrees * (Math.PI / 180);
}