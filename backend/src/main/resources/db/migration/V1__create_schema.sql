-- =====================================================================
-- Sistema de Gestão para Marmoraria
-- Migration V1: Criação do schema completo
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- CLIENTES
-- ---------------------------------------------------------------------
CREATE TABLE clientes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome            VARCHAR(255) NOT NULL,
    telefone        VARCHAR(20),
    email           VARCHAR(255),
    endereco        TEXT,
    documento       VARCHAR(20),          -- CPF/CNPJ
    criado_em       TIMESTAMP NOT NULL DEFAULT now(),
    atualizado_em   TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- MATERIAIS (chapas de granito, mármore, quartzo, ultracompactos)
-- ---------------------------------------------------------------------
CREATE TABLE materiais (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome                VARCHAR(100) NOT NULL,
    categoria           VARCHAR(50) NOT NULL
                        CHECK (categoria IN ('GRANITO','MARMORE','QUARTZO','QUARTZITO','ULTRACOMPACTO')),
    densidade_kg_m3     DECIMAL(8,2) NOT NULL,      -- ex.: 2700.00
    espessura_padrao_m  DECIMAL(5,3) NOT NULL DEFAULT 0.020, -- ex.: 0.020 (2cm), 0.030 (3cm)
    preco_m2            DECIMAL(10,2) NOT NULL,
    estoque_m2          DECIMAL(10,2) NOT NULL DEFAULT 0,
    percentual_perda_padrao DECIMAL(5,2) NOT NULL DEFAULT 10.00
                        CHECK (percentual_perda_padrao BETWEEN 10.00 AND 15.00),
    ativo               BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em           TIMESTAMP NOT NULL DEFAULT now(),
    atualizado_em       TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- LOTES / RETALHOS DE CHAPA (controle de estoque físico por peça)
-- ---------------------------------------------------------------------
CREATE TABLE lotes_chapa (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id     UUID NOT NULL REFERENCES materiais(id) ON DELETE RESTRICT,
    codigo_lote     VARCHAR(50) NOT NULL,
    tipo            VARCHAR(20) NOT NULL DEFAULT 'CHAPA_INTEIRA'
                    CHECK (tipo IN ('CHAPA_INTEIRA','RETALHO')),
    largura_m       DECIMAL(6,3) NOT NULL,
    comprimento_m   DECIMAL(6,3) NOT NULL,
    area_m2         DECIMAL(8,3) GENERATED ALWAYS AS (largura_m * comprimento_m) STORED,
    localizacao     VARCHAR(100),           -- ex.: "Cavalete 03 - Vão B"
    reservado       BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em       TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (material_id, codigo_lote)
);

-- ---------------------------------------------------------------------
-- ACABAMENTOS DE BORDA
-- ---------------------------------------------------------------------
CREATE TABLE acabamentos (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome                        VARCHAR(100) NOT NULL,
    tipo                        VARCHAR(30) NOT NULL
                                CHECK (tipo IN ('RETO_POLIDO','BISOTE','BOLEADO','MEIA_ESQUADRIA','PEITO_DE_POMBO')),
    unidade_medida              VARCHAR(10) NOT NULL DEFAULT 'M_LINEAR',
    multiplicador_complexidade  DECIMAL(4,2) NOT NULL,   -- 1.0, 1.2, 1.35, 1.8, 2.0
    preco_base_metro_linear     DECIMAL(10,2) NOT NULL,
    descricao_tecnica           TEXT,
    ativo                       BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------------------
-- ORÇAMENTOS
-- ---------------------------------------------------------------------
CREATE TABLE orcamentos (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero              SERIAL UNIQUE,                    -- número sequencial amigável
    cliente_id          UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    status              VARCHAR(30) NOT NULL DEFAULT 'RASCUNHO'
                        CHECK (status IN ('RASCUNHO','APROVADO','EM_PRODUCAO','CONCLUIDO','CANCELADO')),
    area_util_total_m2  DECIMAL(10,3) NOT NULL DEFAULT 0,
    area_bruta_total_m2 DECIMAL(10,3) NOT NULL DEFAULT 0,
    peso_total_kg       DECIMAL(10,2) NOT NULL DEFAULT 0,
    custo_material      DECIMAL(12,2) NOT NULL DEFAULT 0,
    custo_acabamentos   DECIMAL(12,2) NOT NULL DEFAULT 0,
    custo_servicos_adicionais DECIMAL(12,2) NOT NULL DEFAULT 0,
    valor_total         DECIMAL(12,2) NOT NULL DEFAULT 0,
    taxa_frete_instalacao DECIMAL(10,2) NOT NULL DEFAULT 0,
    observacoes         TEXT,
    criado_em           TIMESTAMP NOT NULL DEFAULT now(),
    atualizado_em       TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- ITENS DO ORÇAMENTO (cada peça: bancada, ilha, soleira, etc.)
-- ---------------------------------------------------------------------
CREATE TABLE itens_orcamento (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orcamento_id                UUID NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
    material_id                 UUID NOT NULL REFERENCES materiais(id) ON DELETE RESTRICT,
    acabamento_id                UUID REFERENCES acabamentos(id) ON DELETE SET NULL,
    descricao_peca              VARCHAR(150),              -- ex.: "Bancada Cooktop Cozinha"

    -- dimensões de entrada (metros)
    comprimento_m                DECIMAL(8,3) NOT NULL,
    profundidade_m               DECIMAL(8,3) NOT NULL,
    altura_frontao_m             DECIMAL(8,3) NOT NULL DEFAULT 0,
    altura_saia_m                DECIMAL(8,3) NOT NULL DEFAULT 0,
    espessura_m                  DECIMAL(5,3) NOT NULL,
    percentual_perda             DECIMAL(5,2) NOT NULL DEFAULT 10.00,

    -- balanço / projeção em relação ao apoio (regra de sustentação)
    projecao_balanco_cm          DECIMAL(6,2) NOT NULL DEFAULT 0,
    alerta_sustentacao           VARCHAR(50)               -- NENHUM | CANTONEIRA_METALICA | ESTRUTURA_TUBULAR
                                CHECK (alerta_sustentacao IN ('NENHUM','CANTONEIRA_METALICA','ESTRUTURA_TUBULAR')),

    -- recortes de cuba/cooktop
    possui_recorte_cuba          BOOLEAN NOT NULL DEFAULT FALSE,
    possui_recorte_cooktop       BOOLEAN NOT NULL DEFAULT FALSE,
    borda_minima_recorte_cm      DECIMAL(5,2),             -- menor borda medida ao redor do recorte
    alerta_borda_insuficiente    BOOLEAN NOT NULL DEFAULT FALSE,
    custo_recorte_cuba           DECIMAL(10,2) NOT NULL DEFAULT 0,
    custo_recorte_cooktop        DECIMAL(10,2) NOT NULL DEFAULT 0,

    -- acabamento de borda
    metragem_linear_acabamento   DECIMAL(8,2) NOT NULL DEFAULT 0,

    -- valores calculados (persistidos para histórico/auditoria do orçamento)
    area_util_m2                 DECIMAL(10,3) NOT NULL DEFAULT 0,
    area_bruta_m2                DECIMAL(10,3) NOT NULL DEFAULT 0,
    peso_calculado_kg             DECIMAL(10,2) NOT NULL DEFAULT 0,
    custo_material_item          DECIMAL(12,2) NOT NULL DEFAULT 0,
    custo_acabamento_item        DECIMAL(12,2) NOT NULL DEFAULT 0,
    preco_subtotal                DECIMAL(12,2) NOT NULL DEFAULT 0,

    criado_em                    TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT chk_borda_minima CHECK (
        borda_minima_recorte_cm IS NULL OR borda_minima_recorte_cm >= 0
    )
);

-- ---------------------------------------------------------------------
-- ORDENS DE SERVIÇO (Kanban: fases de produção)
-- ---------------------------------------------------------------------
CREATE TABLE ordens_servico (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orcamento_id    UUID NOT NULL REFERENCES orcamentos(id) ON DELETE RESTRICT,
    codigo          VARCHAR(30) NOT NULL UNIQUE,       -- ex.: OS-2026-0001
    fase_atual      VARCHAR(30) NOT NULL DEFAULT 'RASCUNHO'
                    CHECK (fase_atual IN (
                        'RASCUNHO','MEDICAO_FINA','CORTE','LAPIDACAO_ACABAMENTO',
                        'MONTAGEM','INSTALACAO','CONCLUIDO'
                    )),
    responsavel     VARCHAR(100),
    data_prevista_entrega DATE,
    data_conclusao  TIMESTAMP,
    criado_em       TIMESTAMP NOT NULL DEFAULT now(),
    atualizado_em   TIMESTAMP NOT NULL DEFAULT now()
);

-- histórico de transição de fases (auditoria do Kanban)
CREATE TABLE ordens_servico_historico (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ordem_servico_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    fase_anterior   VARCHAR(30),
    fase_nova       VARCHAR(30) NOT NULL,
    alterado_por    VARCHAR(100),
    alterado_em     TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- ÍNDICES
-- ---------------------------------------------------------------------
CREATE INDEX idx_itens_orcamento_orcamento_id ON itens_orcamento(orcamento_id);
CREATE INDEX idx_itens_orcamento_material_id ON itens_orcamento(material_id);
CREATE INDEX idx_orcamentos_cliente_id ON orcamentos(cliente_id);
CREATE INDEX idx_orcamentos_status ON orcamentos(status);
CREATE INDEX idx_lotes_chapa_material_id ON lotes_chapa(material_id);
CREATE INDEX idx_ordens_servico_orcamento_id ON ordens_servico(orcamento_id);
CREATE INDEX idx_ordens_servico_fase_atual ON ordens_servico(fase_atual);
