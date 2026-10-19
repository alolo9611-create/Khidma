-- F-15: public comments and internal staff notes.
CREATE TABLE comments (
  id         INTEGER PRIMARY KEY,
  requestId  INTEGER NOT NULL REFERENCES requests(id),
  authorId   INTEGER NOT NULL REFERENCES users(id),
  visibility TEXT    NOT NULL CHECK (visibility IN ('PUBLIC', 'INTERNAL')),
  body       TEXT    NOT NULL,
  createdAt  TEXT    NOT NULL
);
CREATE INDEX comments_request ON comments (requestId, createdAt);
