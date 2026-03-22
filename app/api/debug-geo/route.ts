import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const headers: Record<string, string | null> = {
    'cf-ipcountry': request.headers.get('cf-ipcountry'),
    'x-vercel-ip-country': request.headers.get('x-vercel-ip-country'),
    'cf-connecting-ip': request.headers.get('cf-connecting-ip'),
    'x-forwarded-for': request.headers.get('x-forwarded-for'),
    'x-real-ip': request.headers.get('x-real-ip'),
  }

  const geo = request.geo || {}

  return NextResponse.json({ headers, geo })
}
