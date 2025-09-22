import { NextResponse } from 'next/server';
import { openDb } from '../../../lib/db';

type ValueType = 'status' | 'last_step' | 'modality';

function isHexColor(s: string) {
  return /^#?[0-9a-fA-F]{6}$/.test(s);
}

function slugify(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '_');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as ValueType | null;
  if (!type || !['status','last_step','modality'].includes(type)) {
    return NextResponse.json({ error: 'Invalid or missing type' }, { status: 400 });
  }
  const db = await openDb();

  const rows = db.prepare(
    `SELECT fv.*, 
            (
              CASE fv.type
                WHEN 'status' THEN (SELECT COUNT(1) FROM applications a WHERE a.status_id = fv.id)
                WHEN 'last_step' THEN (SELECT COUNT(1) FROM applications a WHERE a.last_step_id = fv.id)
                WHEN 'modality' THEN (SELECT COUNT(1) FROM applications a WHERE a.modality_id = fv.id)
              END
            ) AS usageCount
     FROM field_values fv
     WHERE fv.type = ?
     ORDER BY fv.sort_order ASC, fv.label ASC`
  ).all(type) as Array<{ id:number; type: string; key: string; label: string; color: string|null; sort_order: number; priority_group: string|null; is_active: 0|1; usageCount: number }>;

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = String(body.type) as ValueType;
    const rawLabel = String(body.label ?? '').trim();
    const key = String(body.key ?? slugify(rawLabel));
    const sort_order = body.sort_order == null ? 0 : Number(body.sort_order);
    const is_active = body.is_active == null ? 1 : (body.is_active ? 1 : 0);
    const color = body.color == null ? null : String(body.color);
    const priority_group = body.priority_group == null ? null : String(body.priority_group);

    if (!['status','last_step','modality'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
    if (!rawLabel) return NextResponse.json({ error: 'Label is required' }, { status: 400 });
    if (!key) return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    if (!Number.isFinite(sort_order)) return NextResponse.json({ error: 'Invalid sort_order' }, { status: 400 });
    if (type === 'status' && color && !isHexColor(color)) return NextResponse.json({ error: 'Invalid color' }, { status: 400 });
    if (type === 'status' && priority_group && !['needs_action','waiting','other'].includes(priority_group)) {
      return NextResponse.json({ error: 'Invalid priority_group' }, { status: 400 });
    }

    const db = await openDb();
    const dupe = db.prepare(`SELECT 1 FROM field_values WHERE type = ? AND (label = ? OR key = ?)`).get(type, rawLabel, key);
    if (dupe) return NextResponse.json({ error: 'Duplicate label/key' }, { status: 409 });

    const info = db.prepare(
      `INSERT INTO field_values(type, key, label, color, sort_order, priority_group, is_active)
       VALUES (?,?,?,?,?,?,?)`
    ).run(type, key, rawLabel, color, sort_order, priority_group, is_active);

    const id = typeof info.lastInsertRowid === 'bigint' ? Number(info.lastInsertRowid) : info.lastInsertRowid;
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    const label = body.label == null ? undefined : String(body.label).trim();
    const color = body.color == null ? undefined : String(body.color);
    const sort_order = body.sort_order == null ? undefined : Number(body.sort_order);
    const is_active = body.is_active == null ? undefined : (body.is_active ? 1 : 0);
    const priority_group = body.priority_group == null ? undefined : String(body.priority_group);

    const db = await openDb();
    const row = db.prepare(`SELECT * FROM field_values WHERE id = ?`).get(id) as { id:number; type:string } | undefined;
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (label !== undefined && !label) return NextResponse.json({ error: 'Label cannot be empty' }, { status: 400 });
    if (color !== undefined && color && !isHexColor(color)) return NextResponse.json({ error: 'Invalid color' }, { status: 400 });
    if (priority_group !== undefined && priority_group && !['needs_action','waiting','other'].includes(priority_group)) {
      return NextResponse.json({ error: 'Invalid priority_group' }, { status: 400 });
    }

    // uniqueness check for label
    if (label !== undefined) {
      const dupe = db.prepare(`SELECT 1 FROM field_values WHERE type = ? AND label = ? AND id <> ?`).get(row.type, label, id);
      if (dupe) return NextResponse.json({ error: 'Duplicate label' }, { status: 409 });
    }

  const now = new Date().toISOString();

    db.prepare(
      `UPDATE field_values SET 
        label = COALESCE(?, label),
        color = CASE WHEN ? IS NULL THEN color ELSE ? END,
        sort_order = COALESCE(?, sort_order),
        priority_group = CASE WHEN ? IS NULL THEN priority_group ELSE ? END,
        is_active = COALESCE(?, is_active),
        updated_at = ?
       WHERE id = ?`
    ).run(
      label ?? null,
      color === undefined ? null : color,
      color === undefined ? null : color,
      sort_order ?? null,
      priority_group === undefined ? null : priority_group,
      priority_group === undefined ? null : priority_group,
      is_active ?? null,
      now,
      id
    );

    const updated = db.prepare(`SELECT * FROM field_values WHERE id = ?`).get(id) as {
      id:number; type:string; key:string; label:string; color:string|null; sort_order:number; priority_group:string|null; is_active:0|1
    };
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id')) || Number(body.id);
    const mergeIntoId = body.mergeIntoId == null ? undefined : Number(body.mergeIntoId);
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const db = await openDb();
    const row = db.prepare(`SELECT * FROM field_values WHERE id = ?`).get(id) as { id:number; type: ValueType } | undefined;
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const usage = db.prepare(
      row.type === 'status'
        ? `SELECT COUNT(1) as c FROM applications WHERE status_id = ?`
        : row.type === 'last_step'
        ? `SELECT COUNT(1) as c FROM applications WHERE last_step_id = ?`
        : `SELECT COUNT(1) as c FROM applications WHERE modality_id = ?`
    ).get(id) as { c: number };

    if (usage.c > 0) {
      if (mergeIntoId == null || !Number.isInteger(mergeIntoId)) {
        return NextResponse.json({ error: 'Value in use; provide mergeIntoId to remap' }, { status: 400 });
      }
  const tgt = db.prepare(`SELECT * FROM field_values WHERE id = ? AND type = ?`).get(mergeIntoId, row.type) as { id:number } | undefined;
      if (!tgt) return NextResponse.json({ error: 'mergeIntoId not found or wrong type' }, { status: 400 });
  const tx = db.transaction(() => {
        if (row.type === 'status') db.prepare(`UPDATE applications SET status_id = ? WHERE status_id = ?`).run(mergeIntoId, id);
        else if (row.type === 'last_step') db.prepare(`UPDATE applications SET last_step_id = ? WHERE last_step_id = ?`).run(mergeIntoId, id);
        else db.prepare(`UPDATE applications SET modality_id = ? WHERE modality_id = ?`).run(mergeIntoId, id);
        db.prepare(`DELETE FROM field_values WHERE id = ?`).run(id);
  });
  tx();
      return NextResponse.json({ success: true, mergedInto: mergeIntoId });
    }

    db.prepare(`DELETE FROM field_values WHERE id = ?`).run(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
