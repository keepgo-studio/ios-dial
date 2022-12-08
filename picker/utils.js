// @ts-check

/**
 * 
 * @param {Array<number>} arr 
 * @returns {number}
 */
export function sum(arr) {
  return arr.reduce((acc, cur) => acc + cur, 0);
}

/**
 * 
 * @param {number} num 
 * @returns {Array<number>}
 * @description "return number array which is in ascending order"
 */
export function range(num) {
  return [...Array(num).keys()];
}



export function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}