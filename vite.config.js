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
    rollupOptions: {
      input: getHtmlFiles(),
      output: {
        entryFileNames: 'assets/js/[name].js',
        chunkFileNames: 'assets/js/[name].js',
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
