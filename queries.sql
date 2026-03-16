-- Rodrigo Ribeiro 12º Ano

-- A1) Otimização de consulta por data
-- Consulta Original:
SELECT * FROM encomendas WHERE YEAR(data_encomenda) = 2025;

-- Otimização:
CREATE INDEX idx_data_encomenda ON encomendas(data_encomenda);

SELECT * FROM encomendas 
WHERE data_encomenda >= '2025-01-01 00:00:00' 
    AND data_encomenda <= '2025-12-31 23:59:59';

-- A2) Análise de agregação e JOIN
-- Consulta Original:
SELECT c.nome, SUM(e.total) AS total_gasto FROM clientes c JOIN encomendas e ON e.fk_cliente = c.id_cliente GROUP BY c.nome ORDER BY total_gasto DESC LIMIT 20;

-- Otimização:
CREATE INDEX idx_encomendas_cliente_total ON encomendas(fk_cliente, total);

-- A3) Otimização de Movimentos de Stock
-- Consulta Original:
SELECT * FROM movimentos_stock WHERE fk_produto = 10 ORDER BY data_movimento DESC;

-- Otimização:
CREATE INDEX idx_produto_movimento ON movimentos_stock(fk_produto, data_movimento DESC);

-- C1) Ranking de funcionários por vendas (2025)
SELECT 
    f.nome, 
    SUM(e.total) AS faturação,
    RANK() OVER (ORDER BY SUM(e.total) DESC) AS ranking
FROM funcionarios f
JOIN encomendas e ON e.fk_funcionario = f.id_funcionario
WHERE e.data_encomenda BETWEEN '2025-01-01' AND '2025-12-31'
GROUP BY f.id_funcionario, f.nome;

-- C2) Total acumulado mensal de vendas (2025)
SELECT 
    MONTH(data_encomenda) AS mes,
    SUM(total) AS vendas_mes,
    SUM(SUM(total)) OVER (ORDER BY MONTH(data_encomenda)) AS acumulado_ano
FROM encomendas
WHERE data_encomenda BETWEEN '2025-01-01' AND '2025-12-31'
GROUP BY MONTH(data_encomenda);

-- C3) Top 3 produtos por faturação (2025)

SELECT 
    p.nome, 
    SUM(ei.quantidade * ei.preco_unitario) AS total_faturado
FROM produtos p
JOIN encomenda_itens ei ON ei.fk_produto = p.id_produto
JOIN encomendas e ON ei.fk_encomenda = e.id_encomenda
WHERE e.data_encomenda BETWEEN '2025-01-01' AND '2025-12-31'
GROUP BY p.id_produto, p.nome
ORDER BY total_faturado DESC
LIMIT 3;

-- D1) Script com COMMIT
START TRANSACTION;

INSERT INTO encomendas (fk_cliente, fk_funcionario, data_encomenda, estado, total)
VALUES (1, 1, NOW(), 'Pendente', 150.00);

SET @encomenda_id = LAST_INSERT_ID();

INSERT INTO encomenda_itens (fk_encomenda, fk_produto, quantidade, preco_unitario)
VALUES (@encomenda_id, 1, 2, 50.00), (@encomenda_id, 2, 1, 50.00);

INSERT INTO pagamentos (fk_encomenda, valor, metodo, estado, data_pagamento)
VALUES (@encomenda_id, 150.00, 'MBWay', 'Confirmado', NOW());

COMMIT;

-- PARTE E - View para Relatório
CREATE OR REPLACE VIEW vw_relatorio_financeiro_clientes AS
SELECT 
    c.nome AS nome_cliente,
    COUNT(e.id_encomenda) AS num_encomendas,
    SUM(e.total) AS total_gasto,
    MAX(e.data_encomenda) AS data_ultima_encomenda
FROM clientes c
LEFT JOIN encomendas e ON e.fk_cliente = c.id_cliente
GROUP BY c.id_cliente, c.nome;