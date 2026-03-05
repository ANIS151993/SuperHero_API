import { defineConfig } from 'vite';
import { resolve } from 'path';

// Set the BROWSER environment variable (optional)
process.env.BROWSER = 'chrome'; // or 'google-chrome', depending on your OS

export default defineConfig({
  base: '/', // Adjust if your app is served from a subpath
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),

        // Add more pages as needed
      },
    },
    assetsDir: 'assets', // Ensures assets are placed in 'assets' directory
  },
  server: {
    hmr: {
      overlay: true, // Set to false to disable the overlay if needed
    },
    open: true,
    port: 3000,
  },
});
