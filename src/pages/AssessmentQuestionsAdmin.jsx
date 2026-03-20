import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { generateAssessmentQuestions } from '@/functions/generateAssessmentQuestions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Trash2, RefreshCw, Plus, Volume2, BookOpen, Headphones } from 'lucide-react';
import { toast } from 'sonner';

const LANGUAGES = ['finnish', 'swedish', 'danish'];
const MODULES = ['reading', 'listening'];
const LEVELS = ['A1', 'A2', 'B1', 'B2'];
const COUNTS = [3, 5, 10];

const LEVEL_COLORS = {
  A1: 'bg-green-100 text-green-700',
  A2: 'bg-blue-100 text-blue-700',
  B1: 'bg-yellow-100 text-yellow-700',
  B2: 'bg-red-100 text-red-700',
};

export default function AssessmentQuestionsAdmin() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [filterLang, setFilterLang] = useState('all');
  const [filterModule, setFilterModule] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');

  // Generation form
  const [genLang, setGenLang] = useState('finnish');
  const [genModule, setGenModule] = useState('reading');
  const [genLevel, setGenLevel] = useState('A2');
  const [genCount, setGenCount] = useState(5);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    const all = await base44.entities.AssessmentQuestion.list('-created_date', 200);
    setQuestions(all);
    setLoading(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateAssessmentQuestions({
        language: genLang,
        module: genModule,
        level: genLevel,
        count: genCount,
      });
      toast.success(`Generated ${res.data.created} questions!`);
      await fetchQuestions();
    } catch (e) {
      toast.error('Generation failed: ' + (e.message || 'Unknown error'));
    }
    setGenerating(false);
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    await base44.entities.AssessmentQuestion.delete(id);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    setDeleting(null);
    toast.success('Question deleted');
  };

  const filtered = questions.filter((q) => {
    if (filterLang !== 'all' && q.language !== filterLang) return false;
    if (filterModule !== 'all' && q.module !== filterModule) return false;
    if (filterLevel !== 'all' && q.level !== filterLevel) return false;
    return true;
  });

  // Counts per combination
  const countMatrix = {};
  LANGUAGES.forEach((lang) => {
    MODULES.forEach((mod) => {
      LEVELS.forEach((lvl) => {
        const key = `${lang}-${mod}-${lvl}`;
        countMatrix[key] = questions.filter(
          (q) => q.language === lang && q.module === mod && q.level === lvl
        ).length;
      });
    });
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assessment Questions</h1>
        <p className="text-gray-500 text-sm mt-1">Manage AI-generated MCQ questions for level assessment</p>
      </div>

      {/* Coverage Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Question Bank Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr>
                  <th className="text-left py-1 pr-4 text-gray-500">Language</th>
                  <th className="text-left py-1 pr-4 text-gray-500">Module</th>
                  {LEVELS.map((l) => (
                    <th key={l} className="text-center py-1 px-3 text-gray-500">{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LANGUAGES.map((lang) =>
                  MODULES.map((mod) => (
                    <tr key={`${lang}-${mod}`} className="border-t border-gray-100">
                      <td className="py-1.5 pr-4 capitalize font-medium text-gray-700">{lang}</td>
                      <td className="py-1.5 pr-4 capitalize text-gray-500 flex items-center gap-1">
                        {mod === 'reading' ? <BookOpen className="w-3 h-3" /> : <Headphones className="w-3 h-3" />}
                        {mod}
                      </td>
                      {LEVELS.map((lvl) => {
                        const n = countMatrix[`${lang}-${mod}-${lvl}`];
                        return (
                          <td key={lvl} className="text-center py-1.5 px-3">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${n >= 5 ? 'bg-green-100 text-green-700' : n > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-400'}`}>
                              {n}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3">Green = 5+ questions (good). Yellow = some. Gray = none. Aim for at least 5 per cell.</p>
        </CardContent>
      </Card>

      {/* Generate Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4" /> Generate New Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Language</label>
              <Select value={genLang} onValueChange={setGenLang}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Module</label>
              <Select value={genModule} onValueChange={setGenModule}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODULES.map((m) => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Level</label>
              <Select value={genLevel} onValueChange={setGenLevel}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Count</label>
              <Select value={String(genCount)} onValueChange={(v) => setGenCount(Number(v))}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNTS.map((c) => <SelectItem key={c} value={String(c)}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {generating ? 'Generating…' : `Generate ${genCount} Questions`}
            </Button>
          </div>
          {genModule === 'listening' && (
            <p className="text-xs text-amber-600 mt-2">⚠️ Listening questions include TTS audio generation — may take 30–90 seconds.</p>
          )}
        </CardContent>
      </Card>

      {/* Question List */}
      <div>
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <Select value={filterLang} onValueChange={setFilterLang}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Language" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              {LANGUAGES.map((l) => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterModule} onValueChange={setFilterModule}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Module" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {MODULES.map((m) => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-28"><SelectValue placeholder="Level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchQuestions} className="ml-auto">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
          <span className="text-sm text-gray-500">{filtered.length} questions</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No questions found. Generate some above!
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((q) => (
              <Card key={q.id} className="border border-gray-100">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${LEVEL_COLORS[q.level]}`}>{q.level}</span>
                        <span className="text-xs text-gray-500 capitalize">{q.language}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          {q.module === 'reading' ? <BookOpen className="w-3 h-3" /> : <Headphones className="w-3 h-3" />}
                          {q.module}
                        </span>
                        {q.audio_url && <span className="text-xs text-blue-500 flex items-center gap-1"><Volume2 className="w-3 h-3" />audio</span>}
                      </div>
                      {q.passage && (
                        <p className="text-xs text-gray-500 bg-gray-50 rounded p-2 mb-2 line-clamp-2">{q.passage}</p>
                      )}
                      <p className="text-sm font-medium text-gray-800 mb-1">{q.question}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(q.options || []).map((opt, i) => (
                          <span key={i} className={`text-xs px-2 py-0.5 rounded border ${opt === q.correct_answer ? 'bg-green-50 border-green-300 text-green-700 font-medium' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                            {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(q.id)}
                      disabled={deleting === q.id}
                      className="text-gray-400 hover:text-red-500 shrink-0"
                    >
                      {deleting === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}