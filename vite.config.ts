import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // 根據當前工作目錄中的 `mode` 加載 .env 文件
  // 設置第三個參數為 '' 來加載所有環境變量，而不管是否有 `VITE_` 前綴
  const env = loadEnv(mode, process.cwd(), '');

  // 判斷是否為生產環境 API 模式
  const isProductionApi = mode === 'production' || mode === 'production-dev';
  const isDev = command === 'serve';

  // API 基礎 URL 配置
  const apiBaseUrl = isProductionApi
    ? 'https://api.ai-daniel.org'
    : 'http://localhost:5505';

  return {
    plugins: [react(), tsconfigPaths()],
    root: '.', // 修改為項目根目錄
    base: '/',
    
    // 開發服務器配置
    server: {
      port: 8088,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req: any, res) => {
              console.log('Proxying:', req.method, req.url, 'to', options?.target + req.url);
            });
            proxy.on('proxyRes', (proxyRes, req: any, res) => {
              console.log('Received:', proxyRes.statusCode, req.url);
            });
          }
        },
        '/socket.io': {
          target: apiBaseUrl.replace('http', 'ws'),
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('websocket proxy error', err);
            });
          }
        }
      }
    },

    // 構建配置
    build: {
      outDir: 'build', // 修改構建輸出目錄
      sourcemap: isDev,
      emptyOutDir: true,
      assetsDir: 'assets',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html') // 指定入口文件
        },
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'antd-vendor': ['antd', '@ant-design/icons'],
          },
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]'
        }
      },
      // 生產環境優化
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProductionApi,  // 生產環境移除 console
          drop_debugger: isProductionApi  // 生產環境移除 debugger
        }
      }
    },

    // 路徑解析配置
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      }
    },

    // 環境變量配置
    define: {
      __API_BASE_URL__: JSON.stringify(apiBaseUrl),
      __MODE__: JSON.stringify(mode),
      __DEV__: isDev,
      __PROD_API__: isProductionApi,
      __PUBLIC_PATH__: JSON.stringify('/')
    },

    // 預覽配置
    preview: {
      port: 8088,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
        '/socket.io': {
          target: apiBaseUrl.replace('http', 'ws'),
          changeOrigin: true,
          secure: false,
          ws: true,
        }
      }
    }
  };
}); 