import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { gradeAssessmentWritingEntry as gradeAssessmentWriting } from '@/functions/gradeAssessmentWriting/entry';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertCircle } from 'lucide-react';

const WRITING_PROMPTS = {
  finnish: 'Kerro lyhyesti tavallisesta viikonlopustasi tai viimeaikaisesta kokemuksestasi. Voit kirjoittaa vapaasti.',
  swedish: 'Berätta kort om din vanliga helg eller en nyligen upplevelse. Du kan skriva fritt.',
  danish: 'Fortæl kort om din typiske weekend eller en nylig oplevelse. Du kan skrive frit.',
};

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function WritingFlow({ language, onComplete, onCancel }) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const prompt = WRITING_PROMPTS[language] || WRITING_PROMPTS.finnish;
  const wordCount = countWords(text);
  const canSubmit = wordCount >= 10;

  const wordCountColor =
    wordCount >= 50 && wordCount <= 80
      ? 'text-green-600'
      : wordCount > 80
      ? 'text-amber-600'
      : wordCount >= 10
      ? 'text-gray-500'
      : 'text-red-500';

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await gradeAssessmentWriting({
        user_text: text,
        language,
        prompt_given: prompt,
      });

      const { recommended_level, reasoning, raw_ai_response } = res.data;

      const session = await base44.entities.AssessmentSession.create({
        module: 'writing',
        recommended_level,
        reasoning,
        raw_ai_response,
        prompt_given: prompt,
        user_text: text,
        language,
      });

      await base44.auth.updateMe({ writing_cefr_level: recommended_level });
      onComplete({ level: recommended_level, reasoning, session });
    } catch (err) {
      // Recovery: check if session was saved in background within last 90s
      try {
        const recent = await base44.entities.AssessmentSession.filter(
          { module: 'writing' },
          '-created_date',
          1
        );
        const ninetySecondsAgo = Date.now() - 90000;
        if (recent.length > 0 && new Date(recent[0].created_date).getTime() > ninetySecondsAgo) {
          const s = recent[0];
          onComplete({ level: s.recommended_level, reasoning: s.reasoning, session: s });
          return;
        }
      } catch (_) {}
      setError('Assessment could not be completed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm font-medium text-amber-800 mb-1">Writing Prompt</p>
        <p className="text-gray-700 text-sm leading-relaxed">{prompt}</p>
      </div>

      <div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your response here…"
          className="min-h-[160px] text-sm"
          disabled={isSubmitting}
        />
        <div className={`text-xs mt-1.5 ${wordCountColor}`}>
          {wordCount} words
          {wordCount < 10 && ' — Please write at least 10 words'}
          {wordCount >= 10 && wordCount < 50 && ' — Aim for 50–80 words for a more accurate result'}
          {wordCount >= 50 && wordCount <= 80 && ' — Great length!'}
          {wordCount > 80 && ' — Good, but shorter responses are fine too'}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting} size="sm">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="ml-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Grading…
            </>
          ) : (
            'Submit Writing'
          )}
        </Button>
      </div>
    </div>
  );
}