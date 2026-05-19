export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const QUEUE_PATH = '/Users/ryanthomson/.openclaw/workspace/scripts/feedback-queue.json';

function readQueue(): Array<Record<string, unknown>> {
  if (!existsSync(QUEUE_PATH)) return [];
  try {
    const raw = readFileSync(QUEUE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeQueue(items: Array<Record<string, unknown>>) {
  writeFileSync(QUEUE_PATH, JSON.stringify(items, null, 2), 'utf-8');
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, email, type, message } = body as {
    name?: string;
    email?: string;
    type?: string;
    message?: string;
  };

  if (!message || !String(message).trim()) {
    return NextResponse.json({ ok: false, error: 'Message is required' }, { status: 400 });
  }

  const entry = {
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    name: name || '',
    email: email || '',
    type: type || 'Other',
    message: String(message).trim(),
    status: 'new',
  };

  try {
    const queue = readQueue();
    queue.push(entry);
    writeQueue(queue);
  } catch (err) {
    console.error('[FEEDBACK] Failed to write queue:', err);
    return NextResponse.json({ ok: false, error: 'Failed to save feedback' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ message: 'Feedback endpoint active' });
}
