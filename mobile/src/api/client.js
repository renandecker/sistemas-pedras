import axios from 'axios';
import Constants from 'expo-constants';

/**
 * IMPORTANTE — endereço do backend:
 *
 * Diferente do frontend web (que roda no mesmo host do navegador e pode usar
 * caminhos relativos "/api"), o app mobile roda em outro dispositivo/emulador
 * e precisa do endereço IP completo do backend Quarkus.
 *
 * Configure em app.json -> expo.extra.apiBaseUrl, ou defina a variável de
 * ambiente EXPO_PUBLIC_API_BASE_URL antes de rodar `expo start`.
 *
 * Valores comuns:
 *   - Emulador Android:        http://10.0.2.2:8080/api
 *   - Simulador iOS:           http://localhost:8080/api
 *   - Dispositivo físico:      http://<IP-DA-SUA-MAQUINA-NA-REDE>:8080/api
 *   - Build de produção:       https://api.seudominio.com.br/api
 */
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  Constants.expoConfig?.extra?.apiBaseUrl ||
  'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const mensagem =
      error?.response?.data?.erro ||
      error?.message ||
      'Erro de comunicação com o servidor.';
    return Promise.reject(new Error(mensagem));
  }
);

export default api;
export { API_BASE_URL };

export const MaterialAPI = {
  listar: () => api.get('/materiais').then((r) => r.data),
  buscar: (id) => api.get(`/materiais/${id}`).then((r) => r.data),
  criar: (dados) => api.post('/materiais', dados).then((r) => r.data),
};

export const AcabamentoAPI = {
  listar: () => api.get('/acabamentos').then((r) => r.data),
};

export const ClienteAPI = {
  listar: () => api.get('/clientes').then((r) => r.data),
  criar: (dados) => api.post('/clientes', dados).then((r) => r.data),
};

export const OrcamentoAPI = {
  listar: () => api.get('/orcamentos').then((r) => r.data),
  buscar: (id) => api.get(`/orcamentos/${id}`).then((r) => r.data),
  calcularItem: (item) => api.post('/orcamentos/calcular-item', item).then((r) => r.data),
  criar: (payload) => api.post('/orcamentos', payload).then((r) => r.data),
  aprovar: (id) => api.post(`/orcamentos/${id}/aprovar`).then((r) => r.data),
};

export const OrdemServicoAPI = {
  listar: () => api.get('/ordens-servico').then((r) => r.data),
  criar: (payload) => api.post('/ordens-servico', payload).then((r) => r.data),
  moverFase: (id, payload) => api.patch(`/ordens-servico/${id}/fase`, payload).then((r) => r.data),
};
