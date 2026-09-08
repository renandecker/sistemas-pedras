-- =====================================================================
-- Dados iniciais: acabamentos padrão de mercado e alguns materiais exemplo
-- =====================================================================

INSERT INTO acabamentos (nome, tipo, unidade_medida, multiplicador_complexidade, preco_base_metro_linear, descricao_tecnica) VALUES
('Reto Polido / Borda Simples', 'RETO_POLIDO',   'M_LINEAR', 1.00, 35.00,  'Corte reto com quebra-quina leve para eliminação de corte cego.'),
('Bisotê / Bisotado',           'BISOTE',        'M_LINEAR', 1.20, 42.00,  'Chanfro em 45º com largura de 2mm a 5mm.'),
('Boleado (Meia Cana / Total)', 'BOLEADO',       'M_LINEAR', 1.35, 47.00,  'Borda arredondada superior ou dupla com polimento contínuo.'),
('Meia-Esquadria (45º com Saia)','MEIA_ESQUADRIA','M_LINEAR', 1.80, 63.00, 'Corte em 45º com colagem estrutural de saia em resina epóxi/massa plástica.'),
('Peito de Pombo (Ogee)',       'PEITO_DE_POMBO','M_LINEAR', 2.00, 70.00,  'Perfil usinado em curva composta tipo "S".');

INSERT INTO materiais (nome, categoria, densidade_kg_m3, espessura_padrao_m, preco_m2, estoque_m2, percentual_perda_padrao) VALUES
('Granito Preto São Gabriel', 'GRANITO',       2700.00, 0.020, 480.00, 120.50, 10.00),
('Granito Branco Siena',      'GRANITO',       2700.00, 0.020, 420.00,  85.00, 10.00),
('Mármore Branco Carrara',    'MARMORE',       2700.00, 0.020, 890.00,  40.00, 12.00),
('Quartzo Branco Ártico',     'QUARTZO',       2500.00, 0.020, 950.00,  60.00, 10.00),
('Quartzito Taj Mahal',       'QUARTZITO',     2650.00, 0.020, 1100.00, 30.00, 12.00),
('Lâmina Ultracompacta Dekton','ULTRACOMPACTO',2300.00, 0.012, 1350.00, 25.00, 10.00);
