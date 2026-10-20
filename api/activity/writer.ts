import type { Database } from '../core/db/connection.js';

// BR-15 / F-20: the single shared writer. Insert only; the table also has triggers that block UPDATE and DELETE.
export interface ActivityEntry {
  requestId: number;
  actorId: number;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  at: string;
}

export async function appendActivity(db: Database, e: ActivityEntry): Promise<void> {
  await db.run(
    'INSERT INTO activity_log (requestId, actorId, action, fromStatus, toStatus, note, at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    e.requestId, e.actorId, e.action, e.fromStatus, e.toStatus, e.note, e.at,
  );
}
