import axios from 'axios';

// Em dev, o Vite faz proxy de /api -> localhost:8080.
// Em produção (monolito), o front é servido pelo mesmo Quarkus, então
// caminhos relativos funcionam sem qualquer configuração extra.
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export default api;

export const MaterialAPI = {
  listar: () => api.get('/materiais').then((r) => r.data),
  buscar: (id) => api.get(`/materiais/${id}`).then((r) => r.data),
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
