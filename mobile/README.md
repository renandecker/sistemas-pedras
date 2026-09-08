# Marmoraria Mobile (React Native / Expo)

App mobile que consome as mesmas APIs REST do backend Quarkus (`/api/clientes`, `/api/materiais`, `/api/acabamentos`, `/api/orcamentos`, `/api/ordens-servico`). Não duplica lógica de negócio — todo o cálculo (área, peso, alertas técnicos) é feito no backend, exatamente como no frontend web.

## Telas

- **Home** — atalhos de navegação.
- **Novo Orçamento** — formulário de peça com cálculo em tempo real (chama `POST /orcamentos/calcular-item` a cada alteração, com debounce), alertas técnicos (sustentação/borda mínima) e resumo do orçamento.
- **Produção** — ordens de serviço agrupadas por fase, com botão "Avançar para [próxima fase]" (equivalente mobile do Kanban do frontend web, que usa drag-and-drop).
- **Materiais** — listagem e cadastro de materiais.
- **Clientes** — listagem e cadastro de clientes.

## Pré-requisitos

- Node.js 18+
- App **Expo Go** instalado no celular (Android/iOS), ou um emulador Android / simulador iOS configurado.
- O backend (`../backend`) rodando e acessível na rede.

## Configurando o endereço da API

O app mobile **não pode usar `/api` relativo** como o frontend web (não há proxy de navegador). Configure o endereço completo do backend em `app.json`:

```json
"extra": {
  "apiBaseUrl": "http://SEU-ENDERECO:8080/api"
}
```

Ou defina a variável de ambiente antes de rodar (tem prioridade sobre o `app.json`):

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.0.10:8080/api npx expo start
```

Valores comuns para `SEU-ENDERECO`:

| Cenário                          | Endereço                                   |
|-----------------------------------|---------------------------------------------|
| Emulador Android                 | `10.0.2.2` (alias do host dentro do emulador) |
| Simulador iOS                    | `localhost`                                |
| Celular físico (Expo Go)         | IP da sua máquina na rede local (ex.: `192.168.0.10`) — rode `ipconfig`/`ifconfig` para descobrir |
| Build de produção                | domínio público da API (HTTPS)             |

> Celular físico e computador precisam estar na **mesma rede Wi-Fi**.

## Rodando

```bash
cd mobile
npm install
npm start
```

Isso abre o Metro Bundler com um QR Code:
- **Celular físico:** abra o app Expo Go e escaneie o QR Code.
- **Emulador Android:** pressione `a` no terminal (com o emulador já aberto).
- **Simulador iOS:** pressione `i` no terminal (macOS apenas).

## Observações sobre CORS

Requisições nativas (Android/iOS) não passam pelo mecanismo de CORS do navegador, então a configuração de CORS do backend (pensada para o frontend web em `localhost:5173`) não afeta o app mobile. Nenhum ajuste adicional é necessário no backend para o mobile funcionar.

## Build de produção (APK/IPA)

Use o [EAS Build](https://docs.expo.dev/build/introduction/) da Expo:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android   # ou --platform ios
```

Lembre-se de apontar `apiBaseUrl` (ou `EXPO_PUBLIC_API_BASE_URL`) para o domínio público de produção da API antes de gerar o build.
