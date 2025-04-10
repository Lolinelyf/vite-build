import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Получает все HTML файлы из корневой директории проекта
 * @returns {Object} Объект, где ключи - имена файлов без расширения, значения - абсолютные пути к файлам
 * @example
 * // Возвращает:
 * // {
 * //   index: '/absolute/path/to/index.html',
 * //   about: '/absolute/path/to/about.html'
 * // }
 */
function getHtmlFiles() {
  const files = fs.readdirSync(__dirname);
  return files
    .filter(file => file.endsWith('.html'))
    .reduce((acc, file) => {
      acc[path.parse(file).name] = path.resolve(__dirname, file);
      return acc;
    }, {});
}

/**
 * Получает все отдельные JavaScript файлы из директории src/assets/js/separate
 * @returns {Object} Объект, где ключи - имена файлов, значения - абсолютные пути к файлам
 * @example
 * // Возвращает:
 * // {
 * //   'custom-script.js': '/absolute/path/to/custom-script.js',
 * //   'analytics.js': '/absolute/path/to/analytics.js'
 * // }
 */
function getSeparateScripts() {
  const separateDir = path.resolve(__dirname, 'src/assets/js/separate');
  if (!fs.existsSync(separateDir)) return {};

  return fs
    .readdirSync(separateDir)
    .filter(file => file.endsWith('.js'))
    .reduce((acc, file) => {
      acc[file] = path.resolve(separateDir, file);
      return acc;
    }, {});
}

export default defineConfig({
  // Настройка базового пути
  base: './',

  // Плагины
  plugins: [
    handlebars({
      partialDirectory: './src/components',
      reloadOnPartialChange: true,
    }),
  ],

  // Разрешение алиасов
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@js': path.resolve(__dirname, './src/assets/js'),
    },
  },

  // Настройки сборки
  build: {
    outDir: 'build',
    rollupOptions: {
      input: {
        ...getHtmlFiles(),
        ...getSeparateScripts(),
      },
      output: {
        /**
         * Определяет имя выходного файла для точки входа
         * @param {Object} chunkInfo - Информация о чанке
         * @returns {string} Путь к файлу в формате assets/js/[dir]/[name].js
         */
        entryFileNames: chunkInfo => {
          const isJsFile = chunkInfo.name.endsWith('.js');
          const dir = isJsFile ? 'separate' : '';
          return `assets/js/${dir}/[name]${isJsFile ? '' : '.js'}`;
        },
        chunkFileNames: 'assets/js/[name].js',
        /**
         * Определяет имя выходного файла для ресурсов
         * @param {Object} assetInfo - Информация о ресурсе
         * @returns {string} Путь к файлу в формате assets/[type]/[name].[ext]
         */
        assetFileNames: assetInfo => {
          const ext = path.extname(assetInfo.name).slice(1);
          const isJs = /^(js|jsx|ts|tsx)$/.test(ext);

          if (isJs && assetInfo.name.includes('separate')) {
            return 'assets/js/separate/[name].[ext]';
          }
          return isJs ? 'assets/js/[name].[ext]' : 'assets/[name].[ext]';
        },
      },
    },
  },
});
