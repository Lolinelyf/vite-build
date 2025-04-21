const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const srcDir = path.resolve(__dirname, '../src/assets/js/separate');
const outDir = path.resolve(__dirname, '../build/assets/js/separate');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.readdirSync(srcDir).forEach(file => {
  if (file.endsWith('.js')) {
    const srcPath = path.join(srcDir, file);
    const outPath = path.join(outDir, file);
    const code = fs.readFileSync(srcPath, 'utf-8');
    minify(code, { format: { comments: false } })
      .then(result => {
        fs.writeFileSync(outPath, result.code, 'utf-8');
        console.log(`Minified: ${file}`);
      })
      .catch(err => {
        console.error(`Error minifying ${file}:`, err);
        // В случае ошибки просто копируем оригинал
        fs.writeFileSync(outPath, code, 'utf-8');
      });
  }
});
