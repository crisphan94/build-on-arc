import { NextResponse } from 'next/server'
import { getGlobalPayments } from '@/lib/global-payments'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json(getGlobalPayments())
}
