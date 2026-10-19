-- F-07 / BR-02: yearly reference sequence; numbers are never reused.
CREATE TABLE reference_sequences (
  year    INTEGER PRIMARY KEY,
  lastSeq INTEGER NOT NULL
);
