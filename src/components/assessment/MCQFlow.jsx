import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Volume2, CheckCircle2 } from 'lucide-react';

const LEVELS = ['A1', 'A2', 'B1', 'B2'];
const MAX_ROUNDS = 3;
const QUESTIONS_PER_ROUND = 3;

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildReasoning(level, module, rounds, scores) {
  const scoreStr = scores.map((s, i) => `Round ${i + 1}: ${s}/${QUESTIONS_PER_ROUND}`).join(', ');
  const levelLabels = { A1: 'beginner', A2: 'elementary', B1: 'intermediate', B2: 'upper-intermediate' };
  const moduleLabels = { reading: 'reading comprehension', listening: 'listening comprehension' };
  const moduleLabel = moduleLabels[module] || module;
  return `Based on your answers (${scoreStr}), your ${moduleLabel} aligns with the ${level} ${levelLabels[level] || ''} level. The adaptive algorithm confirmed this by testing you across multiple difficulty rounds.`;
}

export default function MCQFlow({ module, language, onComplete, onCancel }) {
  const [phase, setPhase] = useState('loading'); // loading | question | done | no_questions
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  // Algorithm state
  const [currentLevel, setCurrentLevel] = useState('A2');
  const [previousLevel, setPreviousLevel] = useState(null);
  const [confirmedLevel, setConfirmedLevel] = useState(null);
  const [rounds, setRounds] = useState(0);
  const [roundScores, setRoundScores] = useState([]);
  const [sessionAnswers, setSessionAnswers] = useState({});
  const [allQuestionIds, setAllQuestionIds] = useState([]);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadQuestionsForLevel('A2');
  }, []);

  const loadQuestionsForLevel = async (level) => {
    setPhase('loading');
    setSelectedAnswer(null);
    setConfirmed(false);
    setCurrentQ(0);

    const pool = await base44.entities.AssessmentQuestion.filter({
      module,
      level,
      language,
    });
    const picked = shuffle(pool).slice(0, QUESTIONS_PER_ROUND);
    if (picked.length === 0) {
      setPhase('no_questions');
      return;
    }
    setQuestions(picked);
    setPhase('question');
  };

  const handleSelect = (option) => {
    if (confirmed) return;
    setSelectedAnswer(option);
  };

  const handleConfirm = () => {
    if (!selectedAnswer) return;
    const q = questions[currentQ];
    setSessionAnswers((prev) => ({ ...prev, [q.id]: selectedAnswer }));
    setAllQuestionIds((prev) => [...prev, q.id]);
    setConfirmed(true);
  };

  const handleNext = () => {
    if (currentQ + 1 < questions.length) {
      setCurrentQ(currentQ + 1);
      setSelectedAnswer(null);
      setConfirmed(false);
    } else {
      // End of round — tally score (all answers already in sessionAnswers via handleConfirm)
      const finalAnswers = { ...sessionAnswers, [questions[currentQ].id]: selectedAnswer };
      const score = questions.reduce((acc, q) => {
        return acc + (finalAnswers[q.id] === q.correct_answer ? 1 : 0);
      }, 0);
      runAlgorithm(score);
    }
  };

  const runAlgorithm = (score) => {
    const newRounds = rounds + 1;
    const newScores = [...roundScores, score];
    setRounds(newRounds);
    setRoundScores(newScores);

    const idx = LEVELS.indexOf(currentLevel);
    let newConfirmedLevel = null;
    let newCurrentLevel = currentLevel;
    let newPreviousLevel = previousLevel;

    const passed = score >= 2;

    if (passed) {
      if (currentLevel === 'B2') {
        newConfirmedLevel = 'B2';
      } else if (previousLevel !== null && LEVELS.indexOf(previousLevel) === idx + 1) {
        newConfirmedLevel = currentLevel;
      } else {
        newPreviousLevel = currentLevel;
        newCurrentLevel = LEVELS[idx + 1];
      }
    } else {
      if (currentLevel === 'A1') {
        newConfirmedLevel = 'A1';
      } else if (previousLevel !== null && LEVELS.indexOf(previousLevel) === idx - 1) {
        newConfirmedLevel = previousLevel;
      } else {
        newPreviousLevel = currentLevel;
        newCurrentLevel = LEVELS[idx - 1];
      }
    }

    if (!newConfirmedLevel && newRounds >= MAX_ROUNDS) {
      newConfirmedLevel = newCurrentLevel;
    }

    if (newConfirmedLevel) {
      setConfirmedLevel(newConfirmedLevel);
      saveSession(newConfirmedLevel, allQuestionIds, { ...sessionAnswers }, newScores);
    } else {
      setCurrentLevel(newCurrentLevel);
      setPreviousLevel(newPreviousLevel);
      loadQuestionsForLevel(newCurrentLevel);
    }
  };

  const saveSession = async (level, qIds, answers, scores) => {
    setIsSaving(true);
    setPhase('done');
    const reasoning = buildReasoning(level, module, rounds + 1, scores);
    const session = await base44.entities.AssessmentSession.create({
      module,
      recommended_level: level,
      questions_asked: qIds,
      answers,
      reasoning,
      language,
    });
    await base44.auth.updateMe({ [`${module}_cefr_level`]: level });
    setIsSaving(false);
    onComplete({ level, reasoning, session });
  };

  if (phase === 'no_questions') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <p className="text-gray-700 font-medium">No questions available yet</p>
        <p className="text-sm text-gray-500">Assessment questions for <strong>{language} {module}</strong> haven't been added yet. Please check back later or contact an admin.</p>
        <Button variant="outline" onClick={onCancel}>Go Back</Button>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-gray-500">Loading questions…</p>
      </div>
    );
  }

  if (phase === 'done' || isSaving) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        <p className="text-gray-500">Saving your results…</p>
      </div>
    );
  }

  const q = questions[currentQ];
  const totalQs = questions.length;
  const progressPct = ((currentQ + (confirmed ? 1 : 0)) / totalQs) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 capitalize">{module} Assessment · Round {rounds + 1}</p>
          <p className="text-xs text-gray-400">Testing at level <Badge className="text-xs">{currentLevel}</Badge></p>
        </div>
        <span className="text-sm text-gray-500">{currentQ + 1} / {totalQs}</span>
      </div>
      <Progress value={progressPct} className="h-1.5" />

      {/* Listening audio */}
      {module === 'listening' && q.audio_url && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Volume2 className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Listen carefully</span>
          </div>
          <audio controls className="w-full" src={q.audio_url} />
        </div>
      )}

      {/* Passage (reading only) */}
      {module === 'reading' && q.passage && (
        <div className="bg-gray-50 border rounded-xl p-4 text-sm leading-relaxed text-gray-700">
          {q.passage}
        </div>
      )}

      {/* Question */}
      <div>
        <p className="font-semibold text-gray-800 mb-4">{q.question}</p>
        <div className="space-y-2">
          {(q.options || []).map((opt, i) => {
            let cls = 'w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ';
            if (!confirmed) {
              cls += selectedAnswer === opt
                ? 'border-blue-500 bg-blue-50 text-blue-800'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50';
            } else {
              if (opt === q.correct_answer) cls += 'border-green-500 bg-green-50 text-green-800';
              else if (opt === selectedAnswer) cls += 'border-red-400 bg-red-50 text-red-700';
              else cls += 'border-gray-200 text-gray-400';
            }
            return (
              <button key={i} className={cls} onClick={() => handleSelect(opt)} disabled={confirmed}>
                {opt}
                {confirmed && opt === q.correct_answer && (
                  <CheckCircle2 className="inline ml-2 w-4 h-4 text-green-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} size="sm">Cancel</Button>
        {!confirmed ? (
          <Button onClick={handleConfirm} disabled={!selectedAnswer} className="ml-auto">
            Confirm Answer
          </Button>
        ) : (
          <Button onClick={handleNext} className="ml-auto">
            {currentQ + 1 < totalQs ? 'Next Question →' : 'Finish Round →'}
          </Button>
        )}
      </div>
    </div>
  );
}