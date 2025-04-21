// Очистка папки build перед сборкой
const rimraf = require('rimraf');
const path = require('path');

const buildDir = path.resolve(__dirname, '../build');

rimraf.sync(buildDir);
console.log('Папка build успешно очищена');
