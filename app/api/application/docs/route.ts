import { NextResponse } from 'next/server';
import { getDocsForApplications } from '../../../../lib/db';

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get('ids');
  if (!idsParam) {
    return NextResponse.json({}, { status: 200 });
  }
  const ids = idsParam
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => !isNaN(n));
  const map = await getDocsForApplications(ids);
  return NextResponse.json(map, { status: 200 });
}
