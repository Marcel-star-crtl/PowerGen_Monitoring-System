const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      // The dev server runs TypeScript type-checking in a background
      // process (ForkTsCheckerWebpackPlugin) with a default memory
      // ceiling of 2048MB. This project's size has grown substantially
      // over the course of development, and that default ceiling was
      // being hit — crashing the checker process with "JavaScript heap
      // out of memory" (visible as a 500 error on whatever request was
      // in flight when it happened, since the dev server's proxy layer
      // is disrupted along with it — not necessarily a bug in the
      // request itself, which is why retrying the exact same upload
      // afterward succeeded normally). Raised to 4096MB for real
      // headroom instead of disabling the check entirely.
      const plugin = webpackConfig.plugins.find(
        (p) => p.constructor && p.constructor.name === 'ForkTsCheckerWebpackPlugin'
      );
      if (plugin && plugin.options) {
        plugin.options.memoryLimit = 4096;
      }
      return webpackConfig;
    },
  },
};
