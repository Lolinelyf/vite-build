const fs = require('fs');
const path = require('path');

const buildDir = path.resolve(__dirname, '../build');
const htmlFiles = fs.readdirSync(buildDir).filter(f => f.endsWith('.html'));

htmlFiles.forEach(file => {
  const filePath = path.join(buildDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  // 1. Заменить <link rel="modulepreload" crossorigin ...> на <script src="..."></script>
  content = content.replace(
    /<link rel="modulepreload" crossorigin href="([^"]+)">/g,
    '<script src="$1"></script>',
  );
  // 2. Убрать type="module" и crossorigin из всех <script>
  content = content.replace(/<script\s+([^>]*?)type="module"([^>]*)>/g, '<script $1$2>');
  content = content.replace(/<script([^>]*?)\scrossorigin([^>]*)>/g, '<script$1$2>');
  // 3. Убрать crossorigin из всех <link>
  content = content.replace(/<link([^>]*?)\scrossorigin([^>]*)>/g, '<link$1$2>');

  // 4. Собрать все <script>...
  const scripts = [];
  content = content.replace(/<script[\s\S]*?<\/script>/gi, match => {
    scripts.push(match);
    return '';
  });

  // 5. Собрать все <link> (кроме favicon и meta)
  const links = [];
  content = content.replace(
    /<link(?![^>]*rel=["']icon["'])(?![^>]*rel=["']shortcut icon["'])(?![^>]*rel=["']apple-touch-icon["'])(?![^>]*rel=["']manifest["'])(?![^>]*rel=["']mask-icon["'])(?![^>]*rel=["']preconnect["'])(?![^>]*rel=["']dns-prefetch["'])(?![^>]*rel=["']preload["'])(?![^>]*rel=["']prefetch["'])(?![^>]*rel=["']meta["'])([^>]*?)>\s*/gi,
    match => {
      links.push(match.trim());
      return '';
    },
  );

  // 6. Вставить <link> перед <title>
  content = content.replace(/(<title>)/i, links.join('\n') + '\n$1');

  // 7. Разделить скрипты на внешние и локальные
  const externalScripts = scripts.filter(s => /src=["']https?:\/\//.test(s));
  const localScripts = scripts.filter(s => !/src=["']https?:\/\//.test(s));
  // Вставить: сначала внешние, потом локальные
  content = content.replace(
    /(<\/body>)/i,
    externalScripts.concat(localScripts).join('\n') + '\n$1',
  );

  fs.writeFileSync(filePath, content, 'utf-8');
});

