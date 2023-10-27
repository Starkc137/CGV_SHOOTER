// Define and export the render_order module
export const render_order = (() => {
  // Define the render order constants
  return {
    DEFAULT: 0, // Default rendering order
    DECALS: 1, // Rendering order for decals
    SHIELDS: 2, // Rendering order for shields
    PARTICLES: 3, // Rendering order for particles
  };
})();
