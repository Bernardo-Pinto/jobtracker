import { openDb } from '../../../../lib/db';
import fs from 'fs';

export async function GET(
  _request: Request,
  context: { params: Promise<{ docId: string }> }
): Promise<Response> {
  const id = Number((await context.params).docId);
  if (isNaN(id)) return new Response('Invalid id', { status: 400 });

  const db = await openDb();
  const row = db
    .prepare('SELECT filename, mime_type, stored_path FROM application_docs WHERE id = ?')
    .get(id) as { filename: string; mime_type: string; stored_path: string } | undefined;
  if (!row || !fs.existsSync(row.stored_path)) return new Response('Not found', { status: 404 });

  const buf = fs.readFileSync(row.stored_path);
  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': row.mime_type,
      'Content-Disposition': `inline; filename="${encodeURIComponent(row.filename)}"`,
    },
  });
}
