import { NextRequest, NextResponse } from 'next/server'

const VERIFY_TOKEN = 'solo_ai_webhook_2026'

// Meta webhook verification (GET)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Webhook] Meta verification success')
    return new NextResponse(challenge, { status: 200 })
  }

  console.warn('[Webhook] Meta verification failed — token mismatch or wrong mode')
  return new NextResponse('Forbidden', { status: 403 })
}

// Receive WhatsApp messages (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[Webhook] Incoming WhatsApp message:', JSON.stringify(body, null, 2))

    // TODO: hook up Claude AI here
  } catch (err) {
    console.error('[Webhook] Failed to parse body:', err)
  }

  // Always return 200 to Meta
  return new NextResponse('EVENT_RECEIVED', { status: 200 })
}
