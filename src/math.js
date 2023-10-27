export const math = (function() {
  return {
    // Generates a random number within the specified range [a, b)
    rand_range: function(a, b) {
      return Math.random() * (b - a) + a;
    },

    // Generates a value that is close to a normal distribution
    rand_normalish: function() {
      const r = Math.random() + Math.random() + Math.random() + Math.random();
      return (r / 4.0) * 2.0 - 1;
    },

    // Generates a random integer within the specified range [a, b]
    rand_int: function(a, b) {
      return Math.round(Math.random() * (b - a) + a);
    },

    // Performs linear interpolation between two values a and b based on x
    lerp: function(x, a, b) {
      return x * (b - a) + a;
    },

    // Smoothly interpolates between two values a and b using the smoothstep function
    smoothstep: function(x, a, b) {
      x = x * x * (3.0 - 2.0 * x);
      return x * (b - a) + a;
    },

    // Performs smoother interpolation between two values a and b using the smootherstep function
    smootherstep: function(x, a, b) {
      x = x * x * x * (x * (x * 6 - 15) + 10);
      return x * (b - a) + a;
    },

    // Clamps a value x within the specified range [a, b]
    clamp: function(x, a, b) {
      return Math.min(Math.max(x, a), b);
    },

    // Clamps a value x within the range [0, 1]
    sat: function(x) {
      return Math.min(Math.max(x, 0.0), 1.0);
    },

    // Checks if a value x is within the range [a, b]
    in_range: (x, a, b) => {
      return x >= a && x <= b;
    },
  };
})();
