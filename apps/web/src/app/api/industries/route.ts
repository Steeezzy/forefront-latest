import { NextResponse } from 'next/server';
import { INDUSTRIES } from '@/data/industries';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: INDUSTRIES,
    message: "Industries fetched successfully"
  });
}
