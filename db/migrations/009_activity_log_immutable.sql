-- F-20 / BR-15: activity entries are never edited or deleted.
CREATE TRIGGER activity_log_no_update BEFORE UPDATE ON activity_log
BEGIN SELECT RAISE(ABORT, 'activity_log is append-only'); END;
CREATE TRIGGER activity_log_no_delete BEFORE DELETE ON activity_log
BEGIN SELECT RAISE(ABORT, 'activity_log is append-only'); END;
