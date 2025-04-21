import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';

// Конфиг для отдельной сборки главного скрипта (main.js) как IIFE (index.js)

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Алиасы для корректной работы импортов внутри main.js
  resolve: {
    alias: {
      '@js': path.resolve(__dirname, './src/assets/js'),
      '@styles': path.resolve(__dirname, './src/assets/styles'),
    },
  },
  build: {
    outDir: 'build', // Кладём результат в ту же папку, что и основной билд
    emptyOutDir: false, // Не очищаем build, чтобы не затереть остальные файлы
    lib: {
      entry: path.resolve(__dirname, 'src/assets/js/main.js'), // Главный скрипт
      name: 'MainIIFE', // Имя для глобального IIFE (не влияет на файл)
      fileName: () => 'main.js', // Итоговое имя файла
      formats: ['iife'], // Только формат IIFE
    },
    rollupOptions: {
      output: {
        entryFileNames: 'assets/js/main.js', // Итоговый файл главного скрипта
      },
    },
    minify: true, // Минификация итогового файла
  },
});

