# Sistema de Gestão para Marmoraria

Monolito de gestão e orçamentação para marmorarias: **React + Tailwind** (frontend) empacotado dentro de uma aplicação **Java Quarkus** (backend), com **PostgreSQL** como banco de dados. Um único artefato (`.jar`) sobe a API e serve a interface.

## Arquitetura

```
marmoraria-sistema/
├── backend/                   # Quarkus (Java 21)
│   ├── pom.xml
│   └── src/main/java/com/marmoraria/
│       ├── entity/             # Entidades JPA/Panache
│       ├── dto/                 # Objetos de request/response
│       ├── service/             # Regras de negócio (motor de cálculo, orçamento, OS)
│       ├── repository/          # Repositórios Panache
│       ├── resource/            # Endpoints REST
│       └── exception/           # Tratamento de erros de negócio
│   └── src/main/resources/
│       ├── application.properties
│       └── db/migration/        # Migrations Flyway (schema + seed)
├── frontend/                  # React + Vite + Tailwind (web)
│   └── src/
│       ├── api/                  # Cliente HTTP (axios)
│       ├── components/           # Telas: Orçamento, Kanban, Materiais
│       └── hooks/
├── mobile/                    # React Native / Expo (Android + iOS)
│   ├── App.js
│   └── src/
│       ├── api/                  # Mesmo contrato de API do frontend web
│       ├── screens/              # Home, Novo Orçamento, Produção, Materiais, Clientes
│       ├── components/
│       └── navigation/
├── scripts/                   # start.sh / stop.sh — Linux/macOS (banco + backend + frontend)
└── windows/                   # start-local.bat / stop-local.bat — Windows (duplo clique)
```

O app mobile consome exatamente as mesmas APIs REST do backend (nenhuma lógica de negócio é duplicada). Veja `mobile/README.md` para instruções detalhadas de configuração e execução.

## Banco de dados

O schema completo (tabelas, colunas, checks e índices) está em
`backend/src/main/resources/db/migration/V1__create_schema.sql`, aplicado automaticamente pelo Flyway ao subir a aplicação. `V2__seed_data.sql` insere os 5 tipos de acabamento padrão e materiais de exemplo.

Tabelas principais: `clientes`, `materiais`, `lotes_chapa` (estoque físico de chapas/retalhos), `acabamentos`, `orcamentos`, `itens_orcamento`, `ordens_servico`, `ordens_servico_historico`.

## Rodando em desenvolvimento

### Opção rápida — Linux / macOS (script único)

```bash
./scripts/start.sh
```

Esse script:
1. Sobe o PostgreSQL via Docker (`docker-compose.yml`), criando o container e o banco `marmoraria_db` na primeira execução;
2. Aguarda o banco ficar pronto para conexões;
3. Sobe o backend Quarkus em modo dev na porta 8080 (o Flyway aplica o schema e o seed automaticamente);
4. Sobe o frontend (Vite) na porta 5173, com proxy para a API.

Os logs ficam em `.logs/backend.log` e `.logs/frontend.log` e também aparecem ao vivo no próprio terminal (prefixados com `[backend]`/`[frontend]`). Se o backend ou o frontend caírem, o script detecta e mostra automaticamente as últimas linhas do log com erro. `Ctrl+C` encerra backend e frontend (o banco continua rodando).

```bash
./scripts/stop.sh          # para o container, mantém os dados
./scripts/stop.sh --wipe   # para o container e apaga todos os dados
./scripts/start.sh --db-only      # sobe só o banco de dados
./scripts/start.sh --no-frontend  # sobe banco + backend, sem o frontend
```

### Opção rápida — Windows (duplo clique, pasta `windows/`)

Dê **duplo clique em `windows\start-local.bat`** (não precisa abrir terminal nem mexer em política de execução — o `.bat` já contorna isso). Isso:

1. Verifica os pré-requisitos (`docker`, `mvn`, `node`, `npm`) e avisa claramente o que falta;
2. Sobe o PostgreSQL via `docker compose up -d` e espera o banco ficar pronto (`pg_isready` no container `marmoraria-db`);
3. Abre o **backend** (Quarkus) em uma janela própria do PowerShell, com log ao vivo também gravado em `logs\backend.log`;
4. Abre o **frontend** (Vite) em outra janela, instalando dependências na primeira vez, com log em `logs\frontend.log`;
5. Abre o navegador automaticamente em `http://localhost:5173`.

Se alguma janela travar ou fechar sozinha, o texto do erro fica visível nela mesma (cada janela espera `Enter` antes de fechar, então você consegue ler o que deu errado) e também salvo em `logs\`.

Para também subir o **app mobile (Expo)** junto, rode pelo terminal:
```powershell
.\windows\start-local.ps1 -Mobile
```

Para **parar tudo**: duplo clique em `windows\stop-local.bat` (derruba o container do banco via `docker compose down` e finaliza os processos ainda escutando nas portas 8080/5173/8081).

**Não usa Docker?** Rode `windows\create-database.ps1` primeiro (uma única vez) para criar o usuário/banco num PostgreSQL já instalado localmente — veja os comentários no próprio script para os parâmetros de host/porta/superusuário.

Se preferir rodar via terminal em vez de duplo clique:
```powershell
.\windows\start-local.ps1
.\windows\start-local.ps1 -Mobile
.\windows\stop-local.ps1
```
> Se aparecer erro de política de execução ao chamar o `.ps1` diretamente (sem passar pelo `.bat`), rode uma vez:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> ```

**Pré-requisitos no Windows:** Docker Desktop, Node.js (com `npm`), JDK 21 e Maven (`mvn`) no `PATH`.

### Opção manual (passo a passo, qualquer sistema operacional)

**1. Banco de dados**
```bash
docker compose up -d db
```

**2. Backend (porta 8080)**
```bash
cd backend
./mvnw quarkus:dev
```
O Flyway cria o schema e insere os dados iniciais automaticamente.

**3. Frontend web (porta 5173, com proxy para a API)**
```bash
cd frontend
npm install
npm run dev
```
Acesse `http://localhost:5173`.

**4. App mobile (Expo)**
```bash
cd mobile
npm install
npm start
```
Escaneie o QR Code com o app **Expo Go** (Android/iOS) ou rode em emulador. **Importante:** diferente do frontend web, o mobile precisa do endereço IP completo do backend (não existe proxy) — configure em `mobile/app.json` (`extra.apiBaseUrl`) ou via variável de ambiente `EXPO_PUBLIC_API_BASE_URL`. Veja `mobile/README.md` para o guia completo, incluindo os endereços corretos para emulador Android, simulador iOS e celular físico.

## Gerando o monolito de produção (um único deploy)

1. Compile o frontend:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
2. Copie o build para dentro dos recursos do backend:
   ```bash
   rm -rf ../backend/src/main/resources/META-INF/resources
   mkdir -p ../backend/src/main/resources/META-INF/resources
   cp -r dist/* ../backend/src/main/resources/META-INF/resources/
   ```
3. Empacote o backend (já incluindo o frontend):
   ```bash
   cd ../backend
   ./mvnw package
   ```
4. Rode o artefato único:
   ```bash
   java -jar target/quarkus-app/quarkus-run.jar
   ```
   A aplicação completa (API + interface) fica disponível em `http://localhost:8080`.

Variáveis de ambiente aceitas em produção: `DB_URL`, `DB_USER`, `DB_PASSWORD` (ver `application.properties`).

## Regras de negócio implementadas

- **Margem de perda:** 10% a 15% sobre a área útil (clamp automático no motor de cálculo).
- **Sustentação/balanço:** ≤15cm sem suporte; 15–30cm exige cantoneiras metálicas; >30cm exige estrutura tubular.
- **Borda mínima de recorte (cuba/cooktop):** mínimo 5cm — abaixo disso, o motor de cálculo retorna erro bloqueante e o orçamento não pode ser salvo com aquela peça.
- **Acabamentos de borda:** 5 tipos com multiplicador de complexidade (1.0 a 2.0) aplicado sobre o preço-base por metro linear.
- **Kanban de Ordens de Serviço:** Rascunho → Medição Fina → Corte → Lapidação/Acabamento → Montagem → Instalação → Concluído, com histórico de transições e bloqueio para "pular etapas".

## Testes

```bash
cd backend
./mvnw test
```
Cobre as funções puras do motor de cálculo (`CalculoOrcamentoServiceTest`): área útil/bruta, peso, alertas de sustentação e de borda mínima.
