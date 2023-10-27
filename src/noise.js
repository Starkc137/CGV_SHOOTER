import {simplex} from './simplex-noise.js';

export const noise = (function() {

  class _NoiseGenerator {
    constructor(params) {
      this._params = params;
      this._Init();
    }

    _Init() {
      // Initialize the Simplex noise generator with the provided seed
      this._noise = new simplex.SimplexNoise(this._params.seed);
    }

    // Function to get the noise value at a specific 3D position
    Get(x, y, z) {
      // Calculate the parameters for noise generation
      const G = 2.0 ** (-this._params.persistence);
      const xs = x / this._params.scale;
      const ys = y / this._params.scale;
      const zs = z / this._params.scale;
      const noiseFunc = this._noise;

      let amplitude = 1.0;
      let frequency = 1.0;
      let normalization = 0;
      let total = 0;

      // Iterate over octaves and calculate noise value at each octave
      for (let o = 0; o < this._params.octaves; o++) {
        const noiseValue = noiseFunc.noise3D(
          xs * frequency, ys * frequency, zs * frequency) * 0.5 + 0.5;

        total += noiseValue * amplitude;
        normalization += amplitude;
        amplitude *= G;
        frequency *= this._params.lacunarity;
      }
      // Normalize the total noise value and apply height and exponentiation parameters
      total /= normalization;
      return Math.pow(
          total, this._params.exponentiation) * this._params.height;
    }
  }

  return {
    Noise: _NoiseGenerator
  }
})();
