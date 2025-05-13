import checker from "vite-plugin-checker";
import { defineConfig } from "vite";

export default defineConfig({
    server: {
        port: 3000,
        strictPort: true
    },
    plugins: [
        checker({
            typescript: true
        })
    ],
    build: {
        outDir: "build",
        rollupOptions: {
            input: new URL('index.html', import.meta.url).pathname
        }
    }
});
