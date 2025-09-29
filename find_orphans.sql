/* Se necessário, troque pelo nome do seu schema */
-- USE unidal;

-- ============================
-- RESUMO DE CONTAGEM (rápido)
-- ============================
SELECT 'rhe -> users'          AS check_name, COUNT(*) AS orphans
FROM registros_hora_equipa rhe
LEFT JOIN users u ON u.id = rhe.user_id
WHERE rhe.user_id IS NOT NULL AND u.id IS NULL
UNION ALL
SELECT 'rhe -> registros_hora', COUNT(*)
FROM registros_hora_equipa rhe
LEFT JOIN registros_hora rh ON rh.id = rhe.registro_id
WHERE rh.id IS NULL
UNION ALL
SELECT 'rh -> users (usuario_id)', COUNT(*)
FROM registros_hora rh
LEFT JOIN users u ON u.id = rh.usuario_id
WHERE rh.usuario_id IS NOT NULL AND u.id IS NULL
UNION ALL
SELECT 'rh -> clientes', COUNT(*)
FROM registros_hora rh
LEFT JOIN clientes c ON c.id = rh.cliente_id
WHERE rh.cliente_id IS NOT NULL AND c.id IS NULL
UNION ALL
SELECT 'rh -> obras', COUNT(*)
FROM registros_hora rh
LEFT JOIN obras o ON o.id = rh.obra_id
WHERE rh.obra_id IS NOT NULL AND o.id IS NULL
UNION ALL
SELECT 'obras -> clientes', COUNT(*)
FROM obras o
LEFT JOIN clientes c ON c.id = o.cliente_id
WHERE o.cliente_id IS NOT NULL AND c.id IS NULL
UNION ALL
SELECT 'users -> perfis', COUNT(*)
FROM users u
LEFT JOIN perfis p ON p.id = u.perfil_id
WHERE u.perfil_id IS NOT NULL AND p.id IS NULL
UNION ALL
SELECT 'rh -> projetos', COUNT(*)
FROM registros_hora rh
LEFT JOIN projetos p ON p.id = rh.projeto_id
WHERE rh.projeto_id IS NOT NULL AND p.id IS NULL
;

-- ============================
-- DETALHES (listar linhas)
-- ============================

-- 1) Equipa apontando para usuário inexistente
SELECT rhe.id, rhe.user_id, rhe.registro_id
FROM registros_hora_equipa rhe
LEFT JOIN users u ON u.id = rhe.user_id
WHERE rhe.user_id IS NOT NULL AND u.id IS NULL
ORDER BY rhe.id;

-- 2) Equipa apontando para registro_hora inexistente
SELECT rhe.id, rhe.user_id, rhe.registro_id
FROM registros_hora_equipa rhe
LEFT JOIN registros_hora rh ON rh.id = rhe.registro_id
WHERE rh.id IS NULL
ORDER BY rhe.id;

-- 3) registro_hora.usuario_id inexistente
SELECT rh.id, rh.usuario_id, rh.data
FROM registros_hora rh
LEFT JOIN users u ON u.id = rh.usuario_id
WHERE rh.usuario_id IS NOT NULL AND u.id IS NULL
ORDER BY rh.id;

-- 4) registro_hora.cliente_id inexistente
SELECT rh.id, rh.cliente_id, rh.data
FROM registros_hora rh
LEFT JOIN clientes c ON c.id = rh.cliente_id
WHERE rh.cliente_id IS NOT NULL AND c.id IS NULL
ORDER BY rh.id;

-- 5) registro_hora.obra_id inexistente
SELECT rh.id, rh.obra_id, rh.data
FROM registros_hora rh
LEFT JOIN obras o ON o.id = rh.obra_id
WHERE rh.obra_id IS NOT NULL AND o.id IS NULL
ORDER BY rh.id;

-- 6) obra.cliente_id inexistente
SELECT o.id, o.nome, o.cliente_id
FROM obras o
LEFT JOIN clientes c ON c.id = o.cliente_id
WHERE o.cliente_id IS NOT NULL AND c.id IS NULL
ORDER BY o.id;

-- 7) user.perfil_id inexistente
SELECT u.id, u.name, u.perfil_id
FROM users u
LEFT JOIN perfis p ON p.id = u.perfil_id
WHERE u.perfil_id IS NOT NULL AND p.id IS NULL
ORDER BY u.id;

-- 8) registro_hora.projeto_id inexistente
SELECT rh.id, rh.projeto_id, rh.data
FROM registros_hora rh
LEFT JOIN projetos p ON p.id = rh.projeto_id
WHERE rh.projeto_id IS NOT NULL AND p.id IS NULL
ORDER BY rh.id;
