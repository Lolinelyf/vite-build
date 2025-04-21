import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Абсолютные пути для корректной работы с файлами и алиасами
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Собирает все html-файлы из корня проекта для multi-page сборки (каждая страница — отдельный entry).
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
  // Плагин Handlebars: поддержка шаблонов и partials для html (partials — src/blocks) для гибкой разметки.
  plugins: [
    handlebars({
      partialDirectory: path.resolve(__dirname, './src/blocks'),
      reloadOnPartialChange: true,
    }),
  ],

  // Алиасы для удобного импорта стилей и js (используются в импортах и сборке)
  resolve: {
    alias: {
      '@styles': path.resolve(__dirname, './src/assets/styles'),
      '@js': path.resolve(__dirname, './src/assets/js'),
    },
  },

  build: {
    outDir: 'build', // Директория для финальной сборки
    emptyOutDir: true, // Очищать build перед сборкой (дополнительно чистится скриптом)
    modulePreload: {
      polyfill: false, // Не добавлять preload polyfill (ускоряет сборку)
    },
    rollupOptions: {
      // Формируем точки входа для Rollup:
      // 1. Все html-файлы из корня
      // 2. Все реально используемые отдельные скрипты из папки separate (ищутся по тегу <script type="module" src="...separate/...js">)
      input: (() => {
        const htmlFiles = getHtmlFiles();
        const scriptSet = new Set();
        // Регулярка ищет <script ... src="...separate/...js"> в html для поиска реально используемых отдельных скриптов
        const scriptRegex =
          /<script\s+[^>]*type=["']module["'][^>]*src=["']([^"']*separate\/[^"']+\.js)["'][^>]*><\/script>/gi;
        Object.values(htmlFiles).forEach(file => {
          const content = fs.readFileSync(file, 'utf-8');
          let match;
          while ((match = scriptRegex.exec(content)) !== null) {
            const scriptPath = match[1].startsWith('/')
              ? path.resolve(__dirname, match[1].slice(1))
              : path.resolve(path.dirname(file), match[1]);
            scriptSet.add(scriptPath);
          }
        });
        // Объединяем html-страницы и отдельные скрипты в итоговый entry-объект для Rollup
        const inputEntries = { ...htmlFiles };
        Array.from(scriptSet).forEach(scriptPath => {
          // Сохраняем структуру путей относительно src/assets/js для правильного вывода в build
          const rel = path.relative(path.resolve(__dirname, 'src/assets/js'), scriptPath);
          inputEntries[rel.replace(/\\/g, '/').replace(/\.js$/, '')] = scriptPath;
        });
        return inputEntries;
      })(),
      output: {
        // Главный js кладём в assets/js/index.js,
        // отдельные скрипты из separate — в assets/js/separate/...
        entryFileNames: chunkInfo => {
          if (chunkInfo.facadeModuleId && chunkInfo.facadeModuleId.includes('separate')) {
            let relativePath = path.relative(
              path.resolve(__dirname, 'src/assets/js'),
              chunkInfo.facadeModuleId,
            );
            relativePath = relativePath.replace(/\\/g, '/');
            return `assets/js/${relativePath}`;
          }
          // Главный JS на этапе vite — main.js (будет удалён postbuild-скриптом)
          if (chunkInfo.isEntry && chunkInfo.name === 'main') {
            return 'assets/js/main.js';
          }
          return 'assets/js/[name].js';
        },
        chunkFileNames: 'assets/js/[name].js', // Все чанки в assets/js
        manualChunks: id => {
          // Все node_modules складываем в отдельный чанк vendor
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        assetFileNames: assetInfo => {
          // Картинки — в assets/images, стили — в assets/css, остальное — в assets/
          const ext = path.extname(assetInfo.name).slice(1);
          if (/css|scss/.test(ext)) {
            return 'assets/css/[name][extname]';
          }
          return 'assets/[name][extname]';
        },
      },
    },
  },

  // Настройки dev-сервера: порт и автооткрытие браузера
  server: {
    port: 5173,
    open: true,
  },
});
