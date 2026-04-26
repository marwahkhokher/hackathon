import { NextRequest, NextResponse } from 'next/server';
import { saveFeedback, getFeedbackForExperiment } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { experiment_id, section, original_content, corrected_content, correction_type, scientist_note, domain } = body;

    if (!experiment_id || !section || !original_content || !corrected_content) {
      return NextResponse.json(
        { error: 'experiment_id, section, original_content, and corrected_content are required.' },
        { status: 400 }
      );
    }

    const feedbackId = uuidv4();

    saveFeedback({
      id: feedbackId,
      experiment_id,
      section,
      original_content,
      corrected_content,
      correction_type: correction_type || 'other',
      scientist_note: scientist_note || '',
      domain: domain || '',
    });

    return NextResponse.json({
      success: true,
      feedback_id: feedbackId,
      message: 'Feedback saved. Future plans in this domain will incorporate your corrections.',
    });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const experimentId = searchParams.get('experiment_id');

    if (!experimentId) {
      return NextResponse.json(
        { error: 'experiment_id is required.' },
        { status: 400 }
      );
    }

    const feedback = getFeedbackForExperiment(experimentId);

    return NextResponse.json({
      success: true,
      feedback,
    });
  } catch (error) {
    console.error('Feedback retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve feedback.' },
      { status: 500 }
    );
  }
}
