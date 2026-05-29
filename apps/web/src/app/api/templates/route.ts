import { NextResponse } from 'next/server';
import { TEMPLATES } from '@/data/templates';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: TEMPLATES,
    message: "Templates fetched successfully"
  });
}
