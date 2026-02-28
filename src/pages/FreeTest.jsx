import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FREE_TEST_CONTENT, LANGUAGE_LABELS, CEFR_ESTIMATE } from "@/data/freeTestContent";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Headphones, Mic, PenTool, CheckCircle, ArrowRight } from "lucide-react";

const STEPS = ["language", "reading", "listening", "speaking", "writing", "results"];

export default function FreeTest() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState(null);
  const [answers, setAnswers] = useState({ reading: {}, listening: {} });
  const [speakingNote, setSpeakingNote] = useState("");
  const [writingText, setWritingText] = useState("");

  useEffect(() => {
    document.title = "Free Mini Language Test – YKI Prep Master";
  }, []);

  const content = language ? FREE_TEST_CONTENT[language] : null;
  const stepName = STEPS[step];
  const progress = (step / (STEPS.length - 1)) * 100;

  const handleAnswer = (section, questionId, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [section]: { ...prev[section], [questionId]: optionIndex }
    }));
  };

  const calcScore = (section) => {
    const questions = content[section].questions;
    const sectionAnswers = answers[section];
    const correct = questions.filter(q => sectionAnswers[q.id] === q.correct).length;
    return { correct, total: questions.length };
  };

  const getCefrEstimate = () => {
    const reading = calcScore("reading");
    const listening = calcScore("listening");
    const total = reading.correct + listening.correct;
    const max = reading.total + listening.total;
    const pct = total / max;
    if (pct >= 0.75) return CEFR_ESTIMATE.high;
    if (pct >= 0.45) return CEFR_ESTIMATE.mid;
    return CEFR_ESTIMATE.low;
  };

  const goNext = () => setStep(s => Math.min(s + 1, STEPS.length - 1));

  const handleReset = () => {
    setStep(0);
    setLanguage(null);
    setAnswers({ reading: {}, listening: {} });
    setSpeakingNote("");
    setWritingText("");
  };

  if (stepName === "language") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-xl w-full space-y-8">
          <div className="text-center space-y-3">
            <Badge className="bg-blue-600 text-white px-4 py-1 text-sm">Free Mini-Test</Badge>
            <h1 className="text-3xl font-bold text-gray-900">Try a Sample Language Exam</h1>
            <p className="text-gray-600">
              Experience what a real YKI / Swedex / PD3 exam feels like in 10 minutes — no account needed.
            </p>
          </div>
          <div className="grid gap-4">
            {Object.entries(LANGUAGE_LABELS).map(([lang, meta]) => (
              <Card
                key={lang}
                className={`cursor-pointer hover:shadow-md transition-all border-2 ${language === lang ? "border-blue-500" : "border-transparent"}`}
                onClick={() => setLanguage(lang)}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <span className="text-4xl">{meta.flag}</span>
                  <div>
                    <div className="font-semibold text-lg">{meta.name}</div>
                    <div className="text-sm text-gray-500">{meta.exam} exam</div>
                  </div>
                  {language === lang && <CheckCircle className="ml-auto w-6 h-6 text-blue-600" />}
                </CardContent>
              </Card>
            ))}
          </div>
          <Button size="lg" className="w-full" disabled={!language} onClick={goNext}>
            Start Free Test <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <button className="text-blue-600 underline" onClick={() => navigate(createPageUrl("Dashboard"))}>
              Go to dashboard
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (stepName === "reading") {
    const { title, text, questions } = content.reading;
    return (
      <TestShell step={step} progress={progress} title="Reading" icon={BookOpen} onNext={goNext} canNext={Object.keys(answers.reading).length === questions.length}>
        <p className="text-sm text-gray-500 mb-2">Read the text, then answer the questions.</p>
        <Card className="bg-gray-50 mb-4">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">{title}</h3>
            <p className="text-sm leading-relaxed whitespace-pre-line">{text}</p>
          </CardContent>
        </Card>
        <div className="space-y-4">
          {questions.map(q => (
            <QuestionCard key={q.id} q={q} selected={answers.reading[q.id]} onSelect={(i) => handleAnswer("reading", q.id, i)} />
          ))}
        </div>
      </TestShell>
    );
  }

  if (stepName === "listening") {
    const { title, script, questions } = content.listening;
    return (
      <TestShell step={step} progress={progress} title="Listening" icon={Headphones} onNext={goNext} canNext={Object.keys(answers.listening).length === questions.length}>
        <p className="text-sm text-gray-500 mb-2">Read the conversation, then answer the questions.</p>
        <Card className="bg-blue-50 border-blue-200 mb-4">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Headphones className="w-4 h-4" />{title}
            </h3>
            <p className="text-sm leading-relaxed whitespace-pre-line font-mono text-gray-700">{script}</p>
          </CardContent>
        </Card>
        <div className="space-y-4">
          {questions.map(q => (
            <QuestionCard key={q.id} q={q} selected={answers.listening[q.id]} onSelect={(i) => handleAnswer("listening", q.id, i)} />
          ))}
        </div>
      </TestShell>
    );
  }

  if (stepName === "speaking") {
    return (
      <TestShell step={step} progress={progress} title="Speaking" icon={Mic} onNext={goNext} canNext={true}>
        <Card className="bg-purple-50 border-purple-200 mb-4">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-purple-800 mb-1">Speaking prompt</p>
            <p className="text-base">{content.speaking.prompt}</p>
          </CardContent>
        </Card>
        <p className="text-sm text-gray-500">
          In the real exam, you would record a 1–2 minute spoken response. For this free test, just read the prompt aloud to yourself.
        </p>
        <Textarea
          className="mt-3"
          placeholder="Optional: jot down notes or key points..."
          value={speakingNote}
          onChange={e => setSpeakingNote(e.target.value)}
          rows={3}
        />
      </TestShell>
    );
  }

  if (stepName === "writing") {
    return (
      <TestShell step={step} progress={progress} title="Writing" icon={PenTool} onNext={goNext} canNext={true}>
        <Card className="bg-green-50 border-green-200 mb-4">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-green-800 mb-1">Writing task</p>
            <p className="text-base">{content.writing.prompt}</p>
          </CardContent>
        </Card>
        <Textarea
          placeholder="Write your response here..."
          value={writingText}
          onChange={e => setWritingText(e.target.value)}
          rows={6}
          className="mt-2"
        />
        <p className="text-xs text-gray-400 mt-1">
          {writingText.split(/\s+/).filter(Boolean).length} words
        </p>
      </TestShell>
    );
  }

  if (stepName === "results") {
    const readingScore = calcScore("reading");
    const listeningScore = calcScore("listening");
    const estimate = getCefrEstimate();
    const lang = LANGUAGE_LABELS[language];
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-xl w-full space-y-6">
          <div className="text-center space-y-2">
            <span className="text-5xl">{lang.flag}</span>
            <h1 className="text-3xl font-bold text-gray-900">Your Mini-Test Results</h1>
            <Badge className="bg-blue-600 text-white text-sm px-4 py-1">{lang.name} · {lang.exam}</Badge>
          </div>
          <Card className="border-2 border-blue-200">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Reading
                </span>
                <span className="font-bold">{readingScore.correct}/{readingScore.total}</span>
              </div>
              <Progress value={(readingScore.correct / readingScore.total) * 100} className="h-2" />
              <div className="flex items-center justify-between">
                <span className="font-medium flex items-center gap-2">
                  <Headphones className="w-4 h-4" /> Listening
                </span>
                <span className="font-bold">{listeningScore.correct}/{listeningScore.total}</span>
              </div>
              <Progress value={(listeningScore.correct / listeningScore.total) * 100} className="h-2" />
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-6 text-center space-y-2">
              <p className="text-sm text-blue-100">Estimated level</p>
              <p className="text-4xl font-bold">{estimate.label}</p>
              <p className="text-blue-100 text-sm">{estimate.message}</p>
            </CardContent>
          </Card>
          <div className="space-y-3">
            <Button size="lg" className="w-full" onClick={() => navigate(createPageUrl("Dashboard"))}>
              Create Free Account to Prepare Fully <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button variant="outline" className="w-full" onClick={handleReset}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function TestShell({ step, progress, title, icon: Icon, onNext, canNext, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3 pt-4">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{title}</div>
            <Progress value={progress} className="h-1.5 mt-1" />
          </div>
          <Badge variant="outline">Step {step} / 5</Badge>
        </div>
        <div>{children}</div>
        <Button size="lg" className="w-full" disabled={!canNext} onClick={onNext}>
          Continue <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function QuestionCard({ q, selected, onSelect }) {
  return (
    <div className="space-y-2">
      <p className="font-medium text-sm">{q.question}</p>
      <div className="grid gap-2">
        {q.options.map((opt, i) => (
          <button
            key={i}
            className={`text-left px-4 py-2 rounded-lg border text-sm transition-all ${
              selected === i
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-200 hover:border-blue-400"
            }`}
            onClick={() => onSelect(i)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
