import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { addApplicationDoc } from '../../../../../lib/db';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const id = Number((await context.params).id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  // Enforce allowed mime types and size limit
  const ALLOWED = new Set([
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'text/plain',
  ]);
  const MAX_BYTES = 200 * 1024; // 200 KB

  // Some browsers may send empty or generic types; we’ll still check extension as a fallback
  const nameLower = file.name.toLowerCase();
  const extOk = /\.(pdf|doc|docx|txt)$/.test(nameLower);
  const typeOk = file.type ? ALLOWED.has(file.type) : true; // allow if type missing but extension ok
  if (!(typeOk && extOk)) {
    return NextResponse.json({ error: 'Unsupported file type. Allowed: pdf, doc, docx, txt.' }, { status: 415 });
  }

  const uploadsDir = process.env.UPLOADS_PATH || '/data/uploads';
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const arrayBuf = await file.arrayBuffer();
  if (arrayBuf.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large. Max 200 KB.' }, { status: 413 });
  }
  const buf = Buffer.from(arrayBuf);
  const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const storedPath = path.join(uploadsDir, safeName);
  fs.writeFileSync(storedPath, buf);

  await addApplicationDoc(id, file.name, file.type || 'application/octet-stream', storedPath);
  return NextResponse.json({ ok: true });
}
