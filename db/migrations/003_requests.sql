-- F-05 and later: requests (PRD §01 Request) and the append-only activity log (BR-15).
CREATE TABLE requests (
  id            INTEGER PRIMARY KEY,
  referenceNo   TEXT    UNIQUE,
  serviceTypeId INTEGER NOT NULL REFERENCES service_types(id),
  applicantId   INTEGER NOT NULL REFERENCES users(id),
  status        TEXT    NOT NULL CHECK (status IN
                  ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'INFO_REQUESTED', 'APPROVED', 'REJECTED', 'WITHDRAWN')),
  formData      TEXT    NOT NULL DEFAULT '{}',
  assigneeId    INTEGER NULL REFERENCES users(id),
  infoCycles    INTEGER NOT NULL DEFAULT 0 CHECK (infoCycles BETWEEN 0 AND 2),
  submittedAt   TEXT    NULL,
  dueAt         TEXT    NULL,
  decidedAt     TEXT    NULL,
  rejectReason  TEXT    NULL CHECK (rejectReason IS NULL OR rejectReason IN ('DOC_INVALID', 'NOT_ELIGIBLE', 'DUPLICATE', 'OTHER')),
  certificateNo TEXT    NULL UNIQUE
);
CREATE INDEX requests_applicant ON requests (applicantId, serviceTypeId, status);

CREATE TABLE activity_log (
  id         INTEGER PRIMARY KEY,
  requestId  INTEGER NOT NULL REFERENCES requests(id),
  actorId    INTEGER NOT NULL REFERENCES users(id),
  action     TEXT    NOT NULL,
  fromStatus TEXT    NULL,
  toStatus   TEXT    NULL,
  note       TEXT    NULL,
  at         TEXT    NOT NULL
);
CREATE INDEX activity_log_request ON activity_log (requestId, at);
