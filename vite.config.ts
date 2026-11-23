import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        hmr: false,
        watch: {
          ignored: [
            '**/.nexus_*',
            '**/nexus_global_power_ledger.json',
            '**/data/**',
            '**/public/generated_files/**',
            '**/public/assets/**',
            '**/agent_bridge/**',
            '**/nexus_lab/**'
          ]
        }
      },
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
