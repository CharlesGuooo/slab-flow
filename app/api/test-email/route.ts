import { NextResponse } from 'next/server';
import { sendEmail, generateNewOrderEmail } from '@/lib/email';

/**
 * Test email endpoint
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to } = body;

    if (!to) {
      return NextResponse.json({ error: 'Email address required' }, { status: 400 });
    }

    const emailOptions = generateNewOrderEmail(
      'Test Customer',
      12345,
      'Test Stone',
      'SlabFlow Test'
    );
    emailOptions.to = to;

    const result = await sendEmail(emailOptions);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
