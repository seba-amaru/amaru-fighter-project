import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    base: '/',
    root: '.',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        modulePreload: false,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                app: resolve(__dirname, 'app/index.html'),
                admin: resolve(__dirname, 'admin/index.html'),
            },
        },
    },
    server: {
        port: 3000,
    },
});
