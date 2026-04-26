'use client';

import { useState, useCallback } from 'react';
import { StructuredHypothesis, LiteratureResult, ExperimentPlan, PipelineStage } from '@/types';
import { Header } from '@/components/Header';
import { PipelineProgress } from '@/components/PipelineProgress';
import { HypothesisInput } from '@/components/HypothesisInput';
import { StructuredHypothesisDisplay } from '@/components/StructuredHypothesisDisplay';
import { LiteratureDisplay } from '@/components/LiteratureDisplay';
import { PlanDisplay } from '@/components/PlanDisplay';
import { FeedbackPanel } from '@/components/FeedbackPanel';

export default function Home() {
  const [stage, setStage] = useState<PipelineStage>('input');
  const [hypothesis, setHypothesis] = useState('');
  const [structuredHypothesis, setStructuredHypothesis] = useState<StructuredHypothesis | null>(null);
  const [literatureResult, setLiteratureResult] = useState<LiteratureResult | null>(null);
  const [plan, setPlan] = useState<ExperimentPlan | null>(null);
  const [experimentId, setExperimentId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetPipeline = useCallback(() => {
    setStage('input');
    setStructuredHypothesis(null);
    setLiteratureResult(null);
    setPlan(null);
    setExperimentId(null);
    setStreamingContent('');
    setError(null);
    setIsLoading(false);
  }, []);

  const handleSubmitHypothesis = useCallback(async (text: string) => {
    setHypothesis(text);
    setError(null);
    setIsLoading(true);
    setStage('parsing');

    try {
      const res = await fetch('/api/hypothesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hypothesis: text }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStructuredHypothesis(data.structured_hypothesis);
      setStage('literature');

      const litRes = await fetch('/api/literature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structured_hypothesis: data.structured_hypothesis }),
      });

      const litData = await litRes.json();
      if (!litRes.ok) throw new Error(litData.error);

      setLiteratureResult(litData.literature_result);
      setStage('generating');

      const planRes = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structured_hypothesis: data.structured_hypothesis,
          literature_result: litData.literature_result,
          stream: true,
        }),
      });

      if (!planRes.ok) {
        const errData = await planRes.json();
        throw new Error(errData.error);
      }

      const reader = planRes.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let expId = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

          for (const line of lines) {
            const jsonStr = line.slice(6);
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.done) {
                expId = parsed.experiment_id;
                setExperimentId(expId);
              } else if (parsed.content) {
                fullContent += parsed.content;
                setStreamingContent(fullContent);
                if (parsed.experiment_id) {
                  expId = parsed.experiment_id;
                }
              }
            } catch {
              // skip
            }
          }
        }
      }

      try {
        const cleaned = fullContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsedPlan = JSON.parse(cleaned);
        const completePlan: ExperimentPlan = {
          ...parsedPlan,
          hypothesis: data.structured_hypothesis,
          literature_check: litData.literature_result,
        };
        setPlan(completePlan);
        setExperimentId(expId);
      } catch {
        setError('Failed to parse the generated plan. The AI response was malformed. Please try again.');
      }

      setStage('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      if (!structuredHypothesis) setStage('input');
    } finally {
      setIsLoading(false);
    }
  }, [structuredHypothesis]);

  const handleRegenerate = useCallback(async () => {
    if (!structuredHypothesis || !literatureResult) return;
    setError(null);
    setIsLoading(true);
    setStage('generating');
    setPlan(null);
    setStreamingContent('');

    try {
      const planRes = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structured_hypothesis: structuredHypothesis,
          literature_result: literatureResult,
          stream: true,
        }),
      });

      if (!planRes.ok) {
        const errData = await planRes.json();
        throw new Error(errData.error);
      }

      const reader = planRes.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let expId = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

          for (const line of lines) {
            const jsonStr = line.slice(6);
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.done) {
                expId = parsed.experiment_id;
                setExperimentId(expId);
              } else if (parsed.content) {
                fullContent += parsed.content;
                setStreamingContent(fullContent);
                if (parsed.experiment_id) expId = parsed.experiment_id;
              }
            } catch {
              // skip
            }
          }
        }
      }

      try {
        const cleaned = fullContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsedPlan = JSON.parse(cleaned);
        const completePlan: ExperimentPlan = {
          ...parsedPlan,
          hypothesis: structuredHypothesis,
          literature_check: literatureResult,
        };
        setPlan(completePlan);
        setExperimentId(expId);
      } catch {
        setError('Failed to parse regenerated plan. Please try again.');
      }

      setStage('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [structuredHypothesis, literatureResult]);

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header onReset={resetPipeline} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PipelineProgress stage={stage} />

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm fade-in-up">
            <p className="font-medium">Error</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        <div className="mt-8 space-y-8">
          {(stage === 'input' || stage === 'parsing') && (
            <HypothesisInput
              onSubmit={handleSubmitHypothesis}
              isLoading={isLoading && stage === 'parsing'}
              initialValue={hypothesis}
            />
          )}

          {structuredHypothesis && stage !== 'input' && stage !== 'parsing' && (
            <StructuredHypothesisDisplay hypothesis={structuredHypothesis} />
          )}

          {literatureResult && stage !== 'input' && stage !== 'parsing' && (
            <LiteratureDisplay result={literatureResult} />
          )}

          {(stage === 'generating' || stage === 'complete') && (
            <PlanDisplay
              plan={plan}
              streamingContent={streamingContent}
              isStreaming={stage === 'generating' && isLoading}
              onRegenerate={handleRegenerate}
            />
          )}

          {stage === 'complete' && plan && experimentId && (
            <FeedbackPanel
              experimentId={experimentId}
              domain={structuredHypothesis?.domain || ''}
              plan={plan}
            />
          )}
        </div>
      </main>

      <footer className="border-t border-zinc-800/50 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-zinc-500 text-sm">
          <p>AI Scientist — Powered by Fulcrum Science × Hack-Nation</p>
          <p className="mt-1">Transforming hypotheses into executable experiment plans</p>
        </div>
      </footer>
    </div>
  );
}
