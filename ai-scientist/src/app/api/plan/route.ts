import { NextRequest } from 'next/server';
import { generateExperimentPlan, generatePlanNonStreaming } from '@/lib/ai-pipeline';
import { saveExperiment } from '@/lib/db';
import { StructuredHypothesis, LiteratureResult } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const { structured_hypothesis, literature_result, stream = true } = await req.json();

    if (!structured_hypothesis || !literature_result) {
      return new Response(
        JSON.stringify({ error: 'Structured hypothesis and literature result are required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const hypothesis = structured_hypothesis as StructuredHypothesis;
    const litResult = literature_result as LiteratureResult;
    const experimentId = uuidv4();

    saveExperiment({
      id: experimentId,
      hypothesis: hypothesis.original_text,
      structured_hypothesis: hypothesis,
      literature_result: litResult,
      domain: hypothesis.domain,
      status: 'generating',
    });

    if (stream) {
      const openaiStream = await generateExperimentPlan(hypothesis, litResult);

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      let fullContent = '';

      const transformStream = new TransformStream({
        async transform(chunk, controller) {
          const text = decoder.decode(chunk, { stream: true });
          const lines = text.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                try {
                  const cleaned = fullContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                  const plan = JSON.parse(cleaned);
                  saveExperiment({
                    id: experimentId,
                    hypothesis: hypothesis.original_text,
                    structured_hypothesis: hypothesis,
                    literature_result: litResult,
                    plan: { ...plan, hypothesis, literature_check: litResult },
                    domain: hypothesis.domain,
                    status: 'complete',
                  });
                } catch {
                  // Plan will be parsed client-side
                }

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, experiment_id: experimentId })}\n\n`));
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullContent += content;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content, experiment_id: experimentId })}\n\n`));
                }
              } catch {
                // Skip malformed chunks
              }
            }
          }
        },
      });

      const readableStream = openaiStream.pipeThrough(transformStream);

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      const plan = await generatePlanNonStreaming(hypothesis, litResult);

      saveExperiment({
        id: experimentId,
        hypothesis: hypothesis.original_text,
        structured_hypothesis: hypothesis,
        literature_result: litResult,
        plan,
        domain: hypothesis.domain,
        status: 'complete',
      });

      return new Response(
        JSON.stringify({ success: true, experiment_id: experimentId, plan }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Plan generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate experiment plan. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
