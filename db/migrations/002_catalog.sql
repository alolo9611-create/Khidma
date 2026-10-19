-- F-03 / F-04: service catalog (PRD §01 ServiceType, RequiredDocument).
CREATE TABLE service_types (
  id            INTEGER PRIMARY KEY,
  code          TEXT    NOT NULL UNIQUE,
  name          TEXT    NOT NULL,
  departmentId  INTEGER NOT NULL REFERENCES departments(id),
  slaDays       INTEGER NOT NULL CHECK (slaDays BETWEEN 1 AND 30),
  allowMultiple INTEGER NOT NULL DEFAULT 0 CHECK (allowMultiple IN (0, 1)),
  isActive      INTEGER NOT NULL DEFAULT 1 CHECK (isActive IN (0, 1))
);

CREATE TABLE required_documents (
  id            INTEGER PRIMARY KEY,
  serviceTypeId INTEGER NOT NULL REFERENCES service_types(id),
  typeCode      TEXT    NOT NULL,
  label         TEXT    NOT NULL,
  mandatory     INTEGER NOT NULL CHECK (mandatory IN (0, 1)),
  UNIQUE (serviceTypeId, typeCode)
);
