/**
 * An object that defines the render order of different game elements.
 * @typedef {Object} RenderOrder
 * @property {number} DEFAULT - The default render order.
 * @property {number} DECALS - The render order for decals.
 * @property {number} SHIELDS - The render order for shields.
 * @property {number} PARTICLES - The render order for particles.
 */

/**
 * The render order object.
 * @type {RenderOrder}
 */
export const render_order = (() => {
  return {
    DEFAULT: 0,
    DECALS: 1,
    SHIELDS: 2,
    PARTICLES: 3,
  };
})();