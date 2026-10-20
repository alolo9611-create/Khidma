import type { Database } from '../../core/db/connection.js';

// F-19 / BR-14: created in the same transaction as the event that causes it. No queue, no push.
export async function notify(db: Database, n: { userId: number; requestId: number | null; message: string; link: string; at: string }): Promise<void> {
  await db.run('INSERT INTO notifications (userId, requestId, message, link, readAt, createdAt) VALUES (?, ?, ?, ?, NULL, ?)',
    n.userId, n.requestId, n.message, n.link, n.at);
}
