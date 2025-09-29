START TRANSACTION;

-- 1) garantir que não há nulos
DELETE FROM registros_hora_equipa WHERE user_id IS NULL;

-- 2) dropar FK antiga (se existir) e recriar com CASCADE
SET @fk := (
  SELECT CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'registros_hora_equipa'
    AND COLUMN_NAME = 'user_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);

SET @sql := IF(@fk IS NOT NULL,
  CONCAT('ALTER TABLE registros_hora_equipa DROP FOREIGN KEY ', @fk, ';'),
  'SELECT 1;'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE registros_hora_equipa
  MODIFY COLUMN user_id INT NOT NULL,
  ADD CONSTRAINT fk_rhe_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE;

COMMIT;