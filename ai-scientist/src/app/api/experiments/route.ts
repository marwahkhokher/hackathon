import { NextRequest, NextResponse } from 'next/server';
import { getExperiment, listExperiments } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const experiment = getExperiment(id);
      if (!experiment) {
        return NextResponse.json({ error: 'Experiment not found.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, experiment });
    }

    const experiments = listExperiments();
    return NextResponse.json({ success: true, experiments });
  } catch (error) {
    console.error('Experiments retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve experiments.' },
      { status: 500 }
    );
  }
}
