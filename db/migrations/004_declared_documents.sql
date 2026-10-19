-- F-06: documents are declared by number (no uploads).
CREATE TABLE declared_documents (
  id             INTEGER PRIMARY KEY,
  requestId      INTEGER NOT NULL REFERENCES requests(id),
  typeCode       TEXT    NOT NULL,
  documentNumber TEXT    NOT NULL,
  UNIQUE (requestId, typeCode)
);
