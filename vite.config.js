import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Получает все HTML файлы из корневой директории
 * @returns {Object} Объект, где ключи - имена файлов без расширения, значения - абсолютные пути к файлам
 */
function getHtmlFiles() {
  const result = {};
  const files = fs.readdirSync(__dirname);

  files
    .filter(file => file.endsWith('.html'))
    .forEach(file => {
      const name = path.parse(file).name;
      result[name] = path.resolve(__dirname, file);
    });

  return result;
}

/**
 * Получает все JS файлы из директории separate
 * @param {string} baseDir - Базовая директория для сканирования
 * @returns {Object} Объект с путями к JS файлам
 */
function getJsFiles(baseDir) {
  const result = {};
  const basePath = path.resolve(__dirname, baseDir);

  /**
   * Рекурсивно сканирует директорию
   * @param {string} dir - Директория для сканирования
   */
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (file.endsWith('.js')) {
        const relativePath = path.relative(basePath, fullPath);
        const name = path.parse(relativePath).name;
        result[name] = fullPath;
      }
    });
  }

  scanDirectory(basePath);
  return result;
}

export default defineConfig({
  plugins: [
    handlebars({
      partialDirectory: path.resolve(__dirname, './src/components'),
      reloadOnPartialChange: true,
    }),
  ],

  resolve: {
    alias: {
      '@js': path.resolve(__dirname, './src/assets/js'),
    },
  },

  build: {
    outDir: 'build',
    emptyOutDir: true,
    modulePreload: {
      polyfill: false,
    },
    rollupOptions: {
      input: {
        ...getHtmlFiles(),
        ...getJsFiles('./src/assets/js/separate'),
      },
      output: {
        entryFileNames: chunkInfo => {
          if (chunkInfo.facadeModuleId && chunkInfo.facadeModuleId.includes('separate')) {
            const relativePath = path.relative(
              path.resolve(__dirname, 'src/assets/js'),
              chunkInfo.facadeModuleId
            );
            return `assets/js/${relativePath}`;
          }
          return 'assets/js/[name].js';
        },
        chunkFileNames: 'assets/js/[name].js',
        manualChunks: id => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        assetFileNames: assetInfo => {
          const ext = path.extname(assetInfo.name).slice(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return 'assets/images/[name][extname]';
          }
          if (/css|scss/.test(ext)) {
            return 'assets/css/[name][extname]';
          }
          return 'assets/[name][extname]';
        },
      },
    },
  },

  server: {
    port: 5173,
    open: true,
  },
});
