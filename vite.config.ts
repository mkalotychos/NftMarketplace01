import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@components': path.resolve(__dirname, './src/components'),
            '@pages': path.resolve(__dirname, './src/pages'),
            '@hooks': path.resolve(__dirname, './src/hooks'),
            '@utils': path.resolve(__dirname, './src/utils'),
            '@contracts': path.resolve(__dirname, './src/contracts'),
            '@types': path.resolve(__dirname, './src/types'),
            '@context': path.resolve(__dirname, './src/context'),
            // Polyfills for Node.js modules
            buffer: 'buffer/',
        },
    },
    define: {
        global: 'globalThis',
        'process.env': {},
    },
    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: 'globalThis',
            },
        },
        include: ['buffer'],
    },
    build: {
        rollupOptions: {
            plugins: [],
        },
        commonjsOptions: {
            transformMixedEsModules: true,
        },
    },
})
