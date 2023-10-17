/**
 * A collection of math utility functions.
 * @namespace math
 */
export const math = (function() {
  return {
    /**
     * Returns a random number between a and b.
     * @memberof math
     * @param {number} a - The lower bound of the range.
     * @param {number} b - The upper bound of the range.
     * @returns {number} A random number between a and b.
     */
    rand_range: function(a, b) {
      return Math.random() * (b - a) + a;
    },

    /**
     * Returns a random number between -1 and 1.
     * @memberof math
     * @returns {number} A random number between -1 and 1.
     */
    rand_normalish: function() {
      const r = Math.random() + Math.random() + Math.random() + Math.random();
      return (r / 4.0) * 2.0 - 1;
    },

    /**
     * Returns a random integer between a and b (inclusive).
     * @memberof math
     * @param {number} a - The lower bound of the range.
     * @param {number} b - The upper bound of the range.
     * @returns {number} A random integer between a and b (inclusive).
     */
    rand_int: function(a, b) {
      return Math.round(Math.random() * (b - a) + a);
    },

    /**
     * Linearly interpolates between a and b by x.
     * @memberof math
     * @param {number} x - The interpolation factor.
     * @param {number} a - The start value.
     * @param {number} b - The end value.
     * @returns {number} The interpolated value.
     */
    lerp: function(x, a, b) {
      return x * (b - a) + a;
    },

    /**
     * Smoothly interpolates between a and b by x.
     * @memberof math
     * @param {number} x - The interpolation factor.
     * @param {number} a - The start value.
     * @param {number} b - The end value.
     * @returns {number} The interpolated value.
     */
    smoothstep: function(x, a, b) {
      x = x * x * (3.0 - 2.0 * x);
      return x * (b - a) + a;
    },

    /**
     * Smoothly interpolates between a and b by x, with a smoother transition than smoothstep.
     * @memberof math
     * @param {number} x - The interpolation factor.
     * @param {number} a - The start value.
     * @param {number} b - The end value.
     * @returns {number} The interpolated value.
     */
    smootherstep: function(x, a, b) {
      x = x * x * x * (x * (x * 6 - 15) + 10);
      return x * (b - a) + a;
    },

    /**
     * Clamps x to the range [a, b].
     * @memberof math
     * @param {number} x - The value to clamp.
     * @param {number} a - The lower bound of the range.
     * @param {number} b - The upper bound of the range.
     * @returns {number} The clamped value.
     */
    clamp: function(x, a, b) {
      return Math.min(Math.max(x, a), b);
    },

    /**
     * Clamps x to the range [0, 1].
     * @memberof math
     * @param {number} x - The value to clamp.
     * @returns {number} The clamped value.
     */
    sat: function(x) {
      return Math.min(Math.max(x, 0.0), 1.0);
    },

    /**
     * Checks if x is within the range [a, b].
     * @memberof math
     * @param {number} x - The value to check.
     * @param {number} a - The lower bound of the range.
     * @param {number} b - The upper bound of the range.
     * @returns {boolean} True if x is within the range [a, b], false otherwise.
     */
    in_range: (x, a, b) => {
      return x >= a && x <= b;
    },
  };
})();
