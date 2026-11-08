const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Dashboard do produtor (original)
esbuild.buildSync({ entryPoints: ['src/app.js'], bundle: true, minify: true, outfile: 'dist/app.js', format: 'esm', sourcemap: false });

// Painel administrativo do e-commerce → docs/admin (GitHub Pages)
const out = 'docs/admin';
fs.mkdirSync(out, { recursive: true });
esbuild.buildSync({
  entryPoints: ['admin/src/main.jsx'], bundle: true, minify: true, format: 'esm', sourcemap: false,
  outfile: path.join(out, 'app.js'), jsx: 'automatic', target: ['es2020', 'safari15'],
  define: { 'process.env.NODE_ENV': '"production"' }, legalComments: 'none',
});
for (const f of fs.readdirSync('admin/public')) fs.copyFileSync(path.join('admin/public', f), path.join(out, f));
console.log('Build concluído: dist/app.js e docs/admin/');
