import {simplex} from './simplex-noise.js';

/**
 * A class representing a noise generator.
 * @class
 */
export const noise = (function() {

  /**
   * @class
   * @classdesc A class representing a noise generator.
   * @param {Object} params - The parameters for the noise generator.
   * @param {number} params.seed - The seed for the noise generator.
   * @param {number} params.scale - The scale for the noise generator.
   * @param {number} params.persistence - The persistence for the noise generator.
   * @param {number} params.octaves - The number of octaves for the noise generator.
   * @param {number} params.lacunarity - The lacunarity for the noise generator.
   * @param {number} params.exponentiation - The exponentiation for the noise generator.
   * @param {number} params.height - The height for the noise generator.
   */
  class _NoiseGenerator {
    constructor(params) {
      this._params = params;
      this._Init();
    }

    /**
     * Initializes the noise generator.
     * @private
     */
    _Init() {
      this._noise = new simplex.SimplexNoise(this._params.seed);
    }

    /**
     * Gets the noise value at the given coordinates.
     * @param {number} x - The x coordinate.
     * @param {number} y - The y coordinate.
     * @param {number} z - The z coordinate.
     * @returns {number} The noise value at the given coordinates.
     */
    Get(x, y, z) {
      const G = 2.0 ** (-this._params.persistence);
      const xs = x / this._params.scale;
      const ys = y / this._params.scale;
      const zs = z / this._params.scale;
      const noiseFunc = this._noise;

      let amplitude = 1.0;
      let frequency = 1.0;
      let normalization = 0;
      let total = 0;
      for (let o = 0; o < this._params.octaves; o++) {
        const noiseValue = noiseFunc.noise3D(
          xs * frequency, ys * frequency, zs * frequency) * 0.5 + 0.5;

        total += noiseValue * amplitude;
        normalization += amplitude;
        amplitude *= G;
        frequency *= this._params.lacunarity;
      }
      total /= normalization;
      return Math.pow(
          total, this._params.exponentiation) * this._params.height;
    }
  }

  return {
    Noise: _NoiseGenerator
  }
})();
