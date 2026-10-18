CREATE TABLE departments (
  id                    INTEGER PRIMARY KEY,
  name                  TEXT    NOT NULL,
  maxActivePerReviewer  INTEGER NOT NULL DEFAULT 10
);

CREATE TABLE users (
  id            INTEGER PRIMARY KEY,
  nationalId    TEXT    NOT NULL CHECK (length(nationalId) = 10 AND nationalId NOT GLOB '*[^0-9]*'),
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  role          TEXT    NOT NULL CHECK (role IN ('APPLICANT', 'REVIEWER', 'SUPERVISOR')),
  departmentId  INTEGER NULL REFERENCES departments(id),
  passwordHash  TEXT    NOT NULL,
  CHECK ((role = 'APPLICANT' AND departmentId IS NULL) OR (role <> 'APPLICANT' AND departmentId IS NOT NULL))
);
