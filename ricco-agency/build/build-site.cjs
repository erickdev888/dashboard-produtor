// Gera a versão de produção do site: HTML/CSS/JS minificados, imagens otimizadas e cabeçalhos de segurança.
const esbuild = require('esbuild'); const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');
const SRC = path.join(__dirname, '../site'), OUT = path.join(__dirname, '../site-producao');
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
let html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
html = html.replace(/<style>([\s\S]*?)<\/style>/g, (_, css) => '<style>' + esbuild.transformSync(css, { loader: 'css', minify: true }).code.trim() + '</style>');
html = html.replace(/<script>([\s\S]*?)<\/script>/g, (_, js) => '<script>' + esbuild.transformSync(js, { loader: 'js', minify: true, target: 'es2019' }).code.trim() + '</script>');
html = html.replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').replace(/\n\s*/g, ' ').trim();
fs.writeFileSync(path.join(OUT, 'index.html'), html);
for (const f of fs.readdirSync(path.join(SRC, 'assets'))) {
  const i = path.join(SRC, 'assets', f), o = path.join(OUT, 'assets', f);
  if (f.endsWith('.jpg')) execSync(`ffmpeg -v error -y -i "${i}" -q:v 5 "${o}"`); else fs.copyFileSync(i, o);
}
// Apache / cPanel / Hostinger / HostGator
fs.writeFileSync(path.join(OUT, '.htaccess'), `RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
</IfModule>
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml
</IfModule>
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpeg "access plus 1 month"
  ExpiresByType image/png "access plus 1 month"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>
Options -Indexes
`);
// Netlify / Cloudflare Pages
fs.writeFileSync(path.join(OUT, '_headers'), `/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
/assets/*
  Cache-Control: public, max-age=2592000, immutable
`);
const size = d => fs.readdirSync(d, { recursive: true }).map(f => path.join(d, f)).filter(f => fs.statSync(f).isFile()).reduce((s, f) => s + fs.statSync(f).size, 0);
console.log('antes', (size(SRC) / 1024).toFixed(0) + ' KB', '→ depois', (size(OUT) / 1024).toFixed(0) + ' KB', '| index.html', (fs.statSync(path.join(SRC, 'index.html')).size / 1024).toFixed(1), '→', (html.length / 1024).toFixed(1), 'KB');
