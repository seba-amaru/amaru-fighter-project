import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: '.',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                app: resolve(__dirname, 'app/index.html'),
            },
            external: ['sw.js', /firebase-messaging/],
        },
    },
    server: {
        port: 3000,
    },
});
