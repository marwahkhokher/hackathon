import { NextRequest, NextResponse } from 'next/server';
import { parseHypothesis } from '@/lib/ai-pipeline';

export async function POST(req: NextRequest) {
  try {
    const { hypothesis } = await req.json();

    if (!hypothesis || typeof hypothesis !== 'string' || hypothesis.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a valid scientific hypothesis (at least 10 characters).' },
        { status: 400 }
      );
    }

    const structured = await parseHypothesis(hypothesis.trim());

    return NextResponse.json({
      success: true,
      structured_hypothesis: structured,
    });
  } catch (error) {
    console.error('Hypothesis parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse hypothesis. Please check your API key and try again.' },
      { status: 500 }
    );
  }
}
