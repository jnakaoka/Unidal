START TRANSACTION;

-- backup do que será removido (opcional, mas recomendado)
CREATE TABLE IF NOT EXISTS _bak_rhe_null AS
SELECT * FROM registros_hora_equipa
WHERE user_id IS NULL
   OR NOT EXISTS (SELECT 1 FROM users u WHERE u.id = registros_hora_equipa.user_id);

-- remove linhas inválidas
DELETE rhe
FROM registros_hora_equipa rhe
LEFT JOIN users u ON u.id = rhe.user_id
WHERE u.id IS NULL;

COMMIT;