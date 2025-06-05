import { NextResponse } from 'next/server';

export async function GET() {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
  
  return NextResponse.json({
    url: wsUrl,
  });
} 