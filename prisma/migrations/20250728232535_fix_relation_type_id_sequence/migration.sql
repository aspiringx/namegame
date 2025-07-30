-- This migration resets the auto-increment sequence for the UserUserRelationType table's ID.
-- This is necessary if manual inserts have caused the sequence to fall out of sync with the actual data.
SELECT setval(pg_get_serial_sequence('user_user_relation_types', 'id'), coalesce(max(id), 1), max(id) IS NOT NULL) FROM "user_user_relation_types";