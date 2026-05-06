import { NextResponse } from 'next/server'

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:4321',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(req: Request) {
  try {
    const { level, message, details } = await req.json()
    const timestamp = new Date().toLocaleTimeString()
    
    // Warna merah untuk error di terminal
    const prefix = `\x1b[31m[CLIENT-ERROR]\x1b[0m`
    
    console.log(`${prefix} ${timestamp}: ${message}`)
    if (details) {
      console.log('\x1b[33mDetails:\x1b[0m', JSON.stringify(details, null, 2))
    }

    return NextResponse.json({ success: true }, {
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:4321',
      }
    })
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}
