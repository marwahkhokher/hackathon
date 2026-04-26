'use client';

import { useState } from 'react';
import { ExperimentPlan } from '@/types';
import { MessageSquarePlus, Send, CheckCircle2, Loader2, ChevronDown } from 'lucide-react';

interface Props {
  experimentId: string;
  domain: string;
  plan: ExperimentPlan;
}

const SECTIONS = [
  { value: 'protocol', label: 'Protocol Steps' },
  { value: 'materials', label: 'Materials & Suppliers' },
  { value: 'budget', label: 'Budget & Pricing' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'validation', label: 'Validation Strategy' },
  { value: 'overall', label: 'Overall Plan' },
];

const CORRECTION_TYPES = [
  { value: 'factual_error', label: 'Factual Error' },
  { value: 'missing_detail', label: 'Missing Detail' },
  { value: 'cost_adjustment', label: 'Cost Adjustment' },
  { value: 'protocol_improvement', label: 'Protocol Improvement' },
  { value: 'timeline_change', label: 'Timeline Change' },
  { value: 'other', label: 'Other' },
];

export function FeedbackPanel({ experimentId, domain }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [section, setSection] = useState('protocol');
  const [correctionType, setCorrectionType] = useState('protocol_improvement');
  const [originalContent, setOriginalContent] = useState('');
  const [correctedContent, setCorrectedContent] = useState('');
  const [scientistNote, setScientistNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState<{ id: string; section: string; note: string }[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalContent.trim() || !correctedContent.trim()) return;

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experiment_id: experimentId,
          section,
          original_content: originalContent,
          corrected_content: correctedContent,
          correction_type: correctionType,
          scientist_note: scientistNote,
          domain,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackHistory(prev => [
          { id: data.feedback_id, section, note: scientistNote || correctedContent.substring(0, 60) },
          ...prev,
        ]);
        setOriginalContent('');
        setCorrectedContent('');
        setScientistNote('');
        setSuccessMessage('Feedback saved! Future plans in this domain will incorporate your correction.');
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch {
      // silently fail
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fade-in-up">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 transition-colors"
      >
        <MessageSquarePlus className="w-5 h-5 text-indigo-400" />
        Scientist Feedback — Improve Future Plans
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="mt-4 glass rounded-2xl p-6">
          <p className="text-sm text-zinc-400 mb-6">
            Your corrections become training signals. When similar experiments are generated in the future,
            the system will incorporate your feedback — producing better plans without re-prompting.
          </p>

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300">{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                  Section
                </label>
                <select
                  value={section}
                  onChange={e => setSection(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50"
                >
                  {SECTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                  Correction Type
                </label>
                <select
                  value={correctionType}
                  onChange={e => setCorrectionType(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50"
                >
                  {CORRECTION_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                Original Content (what needs correction)
              </label>
              <textarea
                value={originalContent}
                onChange={e => setOriginalContent(e.target.value)}
                placeholder="Paste or describe the part of the plan that needs correction..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 min-h-[80px] resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                Corrected Content (what it should be)
              </label>
              <textarea
                value={correctedContent}
                onChange={e => setCorrectedContent(e.target.value)}
                placeholder="Provide the corrected version..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 min-h-[80px] resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                Note (optional context for the correction)
              </label>
              <textarea
                value={scientistNote}
                onChange={e => setScientistNote(e.target.value)}
                placeholder="Why is this correction important? Any additional context..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 min-h-[60px] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !originalContent.trim() || !correctedContent.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Feedback
                </>
              )}
            </button>
          </form>

          {feedbackHistory.length > 0 && (
            <div className="mt-6 pt-4 border-t border-zinc-800/50">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Recent Feedback</h4>
              <div className="space-y-2">
                {feedbackHistory.map(f => (
                  <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/30">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{f.section}</span>
                      <span className="text-xs text-zinc-500 ml-2">{f.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
