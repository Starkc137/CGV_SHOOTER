/**
 * An object containing the passes used in the game.
 * @typedef {Object} Passes
 * @property {number} INPUT - The input pass.
 * @property {number} CAMERA - The camera pass.
 * @property {number} GUN - The gun pass.
 */

/**
 * The passes used in the game.
 * @type {Passes}
 */
export const passes = (() => {
  return {
    INPUT: 3,
    CAMERA: 1,
    GUN: 2,
  };
})();