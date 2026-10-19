-- F-14 / BR-09: certificate number sequence per service per year (PQ-21).
CREATE TABLE certificate_sequences (
  serviceTypeId INTEGER NOT NULL REFERENCES service_types(id),
  year          INTEGER NOT NULL,
  lastSeq       INTEGER NOT NULL,
  PRIMARY KEY (serviceTypeId, year)
);
