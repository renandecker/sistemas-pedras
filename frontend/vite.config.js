import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Em modo dev, o front roda na porta 5173 e faz proxy das chamadas /api
// para o backend Quarkus na porta 8080. Em produção (monolito), o build
// gerado (dist/) é copiado para o backend e servido pelo próprio Quarkus,
// então nenhuma configuração de proxy é necessária.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
