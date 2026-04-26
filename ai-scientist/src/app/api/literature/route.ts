import { NextRequest, NextResponse } from 'next/server';
import { searchLiterature } from '@/lib/ai-pipeline';
import { StructuredHypothesis } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { structured_hypothesis } = await req.json();

    if (!structured_hypothesis) {
      return NextResponse.json(
        { error: 'Structured hypothesis is required.' },
        { status: 400 }
      );
    }

    const result = await searchLiterature(structured_hypothesis as StructuredHypothesis);

    return NextResponse.json({
      success: true,
      literature_result: result,
    });
  } catch (error) {
    console.error('Literature search error:', error);
    return NextResponse.json(
      { error: 'Failed to search literature. Please try again.' },
      { status: 500 }
    );
  }
}
