require('esbuild').buildSync({entryPoints:['src/app.js'],bundle:true,minify:true,outfile:'dist/app.js',format:'esm',sourcemap:false});
