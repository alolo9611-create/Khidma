-- F-19 / BR-14: in-app notifications, written in the same transaction as the event.
CREATE TABLE notifications (
  id        INTEGER PRIMARY KEY,
  userId    INTEGER NOT NULL REFERENCES users(id),
  requestId INTEGER NULL REFERENCES requests(id),
  message   TEXT    NOT NULL,
  link      TEXT    NOT NULL,
  readAt    TEXT    NULL,
  createdAt TEXT    NOT NULL
);
CREATE INDEX notifications_user ON notifications (userId, readAt);
