import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [
    
      react(),
      {
        name: 'iframe-hmr',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            // Allow iframe embedding
            res.setHeader('X-Frame-Options', 'ALLOWALL');
            res.setHeader('Content-Security-Policy', "frame-ancestors *;");
            next();
          });
        }
      }
    ].filter(Boolean),
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          // Treat import errors as fatal errors
          if (
            warning.code === "UNRESOLVED_IMPORT" ||
            warning.code === "MISSING_EXPORT"
          ) {
            throw new Error(`Build failed: ${warning.message}`);
          }
          // Use default for other warnings
          warn(warning);
        },
      },
    },
    server: {
      host: '0.0.0.0', // Bind to all interfaces for container access
      port: 5174,
      strictPort: true,
      // Allow all hosts - essential for Modal tunnel URLs
      proxy: {
        '/proxy': {
          target: process.env.VITE_PROXY_TARGET_OLLAMA || 'http://localhost:11434', // Replace with the actual Ollama API URL
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/proxy/, ''),
        },
        '/db': {
          target: process.env.VITE_PROXY_TARGET_ELASTICSEARCH || 'http://localhost:9200', // local elasticsearch
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/db/, ''),
        }
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    }
  }
});
