import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, Headphones, PenLine, Mic, ChevronRight, Clock } from 'lucide-react';
import MCQFlow from '@/components/assessment/MCQFlow';
import WritingFlow from '@/components/assessment/WritingFlow';
import AssessmentResultCard from '@/components/assessment/AssessmentResultCard';

const MODULES = [
  { key: 'reading', label: 'Reading', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'listening', label: 'Listening', icon: Headphones, color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'writing', label: 'Writing', icon: PenLine, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'speaking', label: 'Speaking', icon: Mic, color: 'text-green-600', bg: 'bg-green-50' },
];

const LEVEL_COLORS = {
  A1: 'bg-blue-100 text-blue-800',
  A2: 'bg-green-100 text-green-800',
  B1: 'bg-yellow-100 text-yellow-800',
  B2: 'bg-purple-100 text-purple-800',
};

function cooldownRemaining(session) {
  if (!session) return 0;
  const elapsed = Date.now() - new Date(session.created_date).getTime();
  const remaining = 86400000 - elapsed;
  return remaining > 0 ? remaining : 0;
}

function formatHours(ms) {
  return `${Math.ceil(ms / 3600000)}h`;
}

export default function LevelAssessment() {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState({ reading: null, listening: null, writing: null, speaking: null });
  const [isLoading, setIsLoading] = useState(true);
  const [activeModule, setActiveModule] = useState(null); // key of module being assessed
  const [justCompleted, setJustCompleted] = useState({}); // { [module]: { level, reasoning } }

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    const [me, reading, listening, writing, speaking] = await Promise.all([
      base44.auth.me(),
      base44.entities.AssessmentSession.filter({ module: 'reading' }, '-created_date', 1),
      base44.entities.AssessmentSession.filter({ module: 'listening' }, '-created_date', 1),
      base44.entities.AssessmentSession.filter({ module: 'writing' }, '-created_date', 1),
      base44.entities.AssessmentSession.filter({ module: 'speaking' }, '-created_date', 1),
    ]);
    setUser(me);
    setSessions({
      reading: reading[0] || null,
      listening: listening[0] || null,
      writing: writing[0] || null,
      speaking: speaking[0] || null,
    });
    setIsLoading(false);
  };

  const handleComplete = async (module, { level, reasoning }) => {
    setActiveModule(null);
    setJustCompleted((prev) => ({ ...prev, [module]: { level, reasoning } }));
    // Refresh sessions
    await loadAll();
  };

  const handleCancel = () => setActiveModule(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // If a module is active, render its flow full-screen
  if (activeModule) {
    const mod = MODULES.find((m) => m.key === activeModule);
    const Icon = mod.icon;
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-lg ${mod.bg}`}>
            <Icon className={`w-5 h-5 ${mod.color}`} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{mod.label} Assessment</h1>
            <p className="text-sm text-gray-500">Answer honestly — there are no tricks!</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            {(activeModule === 'reading' || activeModule === 'listening') && (
              <MCQFlow
                module={activeModule}
                language={user?.target_language || 'finnish'}
                onComplete={(r) => handleComplete(activeModule, r)}
                onCancel={handleCancel}
              />
            )}
            {activeModule === 'writing' && (
              <WritingFlow
                language={user?.target_language || 'finnish'}
                onComplete={(r) => handleComplete(activeModule, r)}
                onCancel={handleCancel}
              />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Level Assessment</h1>
        <p className="text-gray-500 mt-1">Find out your current level in each skill area</p>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          const session = sessions[mod.key];
          const completed = justCompleted[mod.key];
          const cefrLevel = user?.[`${mod.key}_cefr_level`];
          const cooldown = cooldownRemaining(session);
          const isOnCooldown = cooldown > 0;
          const isSpeaking = mod.key === 'speaking';

          return (
            <Card key={mod.key} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl ${mod.bg}`}>
                    <Icon className={`w-5 h-5 ${mod.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">{mod.label}</CardTitle>
                    <div className="mt-1">
                      {cefrLevel ? (
                        <Badge className={`text-xs ${LEVEL_COLORS[cefrLevel] || ''}`}>
                          {cefrLevel}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs text-gray-500">
                          Not taken
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Just-completed result */}
                {completed && (
                  <AssessmentResultCard level={completed.level} reasoning={completed.reasoning} />
                )}

                {/* Speaking deferred card */}
                {isSpeaking && !cefrLevel && (
                  <p className="text-sm text-gray-500">
                    Your speaking level will be set automatically based on your first speaking practice session.
                  </p>
                )}

                {/* Previous reasoning (not just completed) */}
                {!completed && session?.reasoning && (
                  <p className="text-xs text-gray-400 italic leading-relaxed">
                    "{session.reasoning}"
                  </p>
                )}

                {/* Action */}
                {isSpeaking ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.location.href = '/Practice'}
                  >
                    Start Speaking Practice
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : isOnCooldown ? (
                  <Button variant="ghost" size="sm" className="w-full text-gray-400" disabled>
                    <Clock className="w-4 h-4 mr-2" />
                    Re-take available in {formatHours(cooldown)}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => setActiveModule(mod.key)}
                  >
                    {cefrLevel ? 'Re-take Assessment' : 'Start Assessment'}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info footer */}
      <div className="mt-8 text-center text-sm text-gray-400">
        Each assessment takes 3–5 minutes · Results update your practice difficulty · 24h cooldown between re-takes
      </div>
    </div>
  );
}