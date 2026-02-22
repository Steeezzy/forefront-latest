const esbuild = require('esbuild');

console.log("📦 Building Widget Bundle...");

esbuild.build({
    entryPoints: ['src/widget/index.tsx'],
    bundle: true,
    outfile: 'public/widget-bundle.js',
    format: 'esm',
    target: ['es2020'],
    minify: true,
    sourcemap: true,
    loader: { '.tsx': 'tsx', '.ts': 'ts', '.css': 'css' },
    define: {
        'process.env.NODE_ENV': '"production"',
        'global': 'window' // Fix for some libraries expecting global
    },
    // We bundle React to ensure the widget works in isolation
}).then(() => {
    console.log('✅ Widget built successfully: public/widget-bundle.js');
}).catch((e) => {
    console.error('❌ Build failed:', e);
    process.exit(1);
});
