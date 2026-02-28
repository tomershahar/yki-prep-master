# User Acquisition Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a public free mini-exam (SEO/acquisition) and a shareable readiness card (word-of-mouth) to attract new users who are immigrants/expats preparing for YKI/Swedex/PD3 exams.

**Architecture:** The free mini-exam is a new public page (`src/pages/FreeTest.jsx`) using hardcoded static content — no auth or AI credits required. The readiness card wraps the existing `ExamReadiness` page (which already loads `ReadinessScore` and `user.exam_date`) with an `html2canvas`-based share button.

**Tech Stack:** React + Tailwind + Shadcn/ui, `html2canvas` (already installed v1.4.1), `date-fns` (already installed), Web Share API (mobile), download fallback (desktop), Base44 SDK.

---

## Task 1: Create static free test content

**Files:**
- Create: `src/data/freeTestContent.js`

This file holds hardcoded sample exam content for each language. No AI, no auth.

**Step 1: Create the file**

```js
// src/data/freeTestContent.js

export const FREE_TEST_CONTENT = {
  finnish: {
    reading: {
      title: "Kaupassa",
      text: `Maija menee kauppaan joka viikko. Hän ostaa yleensä leipää, maitoa ja vihanneksia.
Tänään kaupassa on ale: appelsiinit maksavat vain 1,50 euroa kilolta. Maija ottaa kaksi kiloa.
Kassalla hän maksaa kortilla. Kaikki maksaa yhteensä 18 euroa. Maija on tyytyväinen.`,
      questions: [
        {
          id: "r1",
          question: "Kuinka usein Maija käy kaupassa?",
          options: ["Joka päivä", "Joka viikko", "Joka kuukausi", "Harvoin"],
          correct: 1
        },
        {
          id: "r2",
          question: "Mitä Maija ostaa tänään erikseen?",
          options: ["Maitoa", "Leipää", "Appelsiineja", "Vihanneksia"],
          correct: 2
        },
        {
          id: "r3",
          question: "Miten Maija maksaa?",
          options: ["Käteisellä", "Kortilla", "Puhelimella", "Laskulla"],
          correct: 1
        }
      ]
    },
    listening: {
      title: "Bussiasemalla",
      script: `Mies: Anteeksi, milloin seuraava bussi lähtee Tampereelle?
Nainen: Seuraava bussi lähtee kello 14:30.
Mies: Kuinka kauan matka kestää?
Nainen: Noin kaksi tuntia.
Mies: Kiitos paljon!
Nainen: Ole hyvä!`,
      questions: [
        {
          id: "l1",
          question: "Mihin kaupunkiin mies haluaa matkustaa?",
          options: ["Helsinkiin", "Turkuun", "Tampereelle", "Ouluun"],
          correct: 2
        },
        {
          id: "l2",
          question: "Milloin bussi lähtee?",
          options: ["Kello 12:30", "Kello 13:00", "Kello 14:30", "Kello 15:00"],
          correct: 2
        },
        {
          id: "l3",
          question: "Kuinka kauan matka kestää?",
          options: ["Tunti", "Puolitoista tuntia", "Kaksi tuntia", "Kolme tuntia"],
          correct: 2
        }
      ]
    },
    speaking: {
      prompt: "Kerro lyhyesti, miten menet töihin tai kouluun. Käytät autoa, bussia vai pyörää? Miksi?"
    },
    writing: {
      prompt: "Kirjoita lyhyt viesti ystävällesi. Kutsu hänet kahville ensi viikonloppuna. Kerro missä ja milloin tapaatte. (Noin 50 sanaa)"
    }
  },
  swedish: {
    reading: {
      title: "På biblioteket",
      text: `Anna arbetar på biblioteket i centrum. Varje dag hjälper hon besökare att hitta böcker och tidningar.
Idag kommer en ung man och frågar om böcker på svenska för nybörjare.
Anna rekommenderar tre böcker och visar honom hur han kan låna dem med sitt bibliotekskort.
Mannen är nöjd och tackar Anna för hjälpen.`,
      questions: [
        {
          id: "r1",
          question: "Var arbetar Anna?",
          options: ["På en skola", "På ett bibliotek", "På ett café", "På ett kontor"],
          correct: 1
        },
        {
          id: "r2",
          question: "Vad frågar mannen efter?",
          options: ["Tidningar", "Datorhjälp", "Böcker på svenska för nybörjare", "Öppettider"],
          correct: 2
        },
        {
          id: "r3",
          question: "Hur kan mannen låna böckerna?",
          options: ["Med kontanter", "Med ett bibliotekskort", "Med ett ID-kort", "Gratis"],
          correct: 1
        }
      ]
    },
    listening: {
      title: "I affären",
      script: `Kassörska: Hej! Hittade du allt du sökte?
Kund: Ja tack. Jag har lite frågor om era erbjudanden.
Kassörska: Självklart! Vad undrar du?
Kund: Är mjölken på rea idag?
Kassörska: Ja, all mjölk är 20% billigare idag.
Kund: Utmärkt! Då tar jag två liter.`,
      questions: [
        {
          id: "l1",
          question: "Vad frågar kunden om?",
          options: ["Öppettider", "Erbjudanden", "Parkering", "Kundservice"],
          correct: 1
        },
        {
          id: "l2",
          question: "Hur mycket rabatt är det på mjölken?",
          options: ["10%", "15%", "20%", "25%"],
          correct: 2
        },
        {
          id: "l3",
          question: "Hur mycket mjölk köper kunden?",
          options: ["En liter", "Två liter", "Tre liter", "En halvliter"],
          correct: 1
        }
      ]
    },
    speaking: {
      prompt: "Berätta kort om din dag igår. Vad gjorde du på morgonen, eftermiddagen och kvällen?"
    },
    writing: {
      prompt: "Skriv ett kort meddelande till din granne. Du vill bjuda in honom/henne på middag nästa helg. Skriv var och när. (Ca 50 ord)"
    }
  },
  danish: {
    reading: {
      title: "En dag i København",
      text: `Thomas bor i en lille lejlighed i København. Han arbejder på et hospital som sygeplejerske.
Hver morgen cykler han til arbejde – det tager kun 15 minutter.
Han elsker sin by og bruger weekenderne på at udforske nye cafeer og parker.
Særligt Nørreport-kvarteret er hans yndlingssted, fordi der altid er liv og musik.`,
      questions: [
        {
          id: "r1",
          question: "Hvad arbejder Thomas som?",
          options: ["Læge", "Sygeplejerske", "Tandlæge", "Apoteker"],
          correct: 1
        },
        {
          id: "r2",
          question: "Hvordan kommer Thomas på arbejde?",
          options: ["Med bus", "Med tog", "Med cykel", "Til fods"],
          correct: 2
        },
        {
          id: "r3",
          question: "Hvad kan man finde i Nørreport-kvarteret?",
          options: ["Ro og stilhed", "Liv og musik", "Stor park", "Mange butikker"],
          correct: 1
        }
      ]
    },
    listening: {
      title: "På restauranten",
      script: `Tjener: Goddag! Er I klar til at bestille?
Gæst: Ja tak. Hvad anbefaler du?
Tjener: Vores smørrebrød er meget populært i dag.
Gæst: Det lyder godt. Jeg tager to stykker smørrebrød og en kop kaffe.
Tjener: Skal det være med mælk?
Gæst: Ja tak, gerne med lidt mælk.`,
      questions: [
        {
          id: "l1",
          question: "Hvad anbefaler tjeneren?",
          options: ["Suppe", "Smørrebrød", "Pizza", "Salat"],
          correct: 1
        },
        {
          id: "l2",
          question: "Hvad bestiller gæsten at drikke?",
          options: ["Te", "Juice", "Kaffe", "Vand"],
          correct: 2
        },
        {
          id: "l3",
          question: "Hvad vil gæsten have i sin kaffe?",
          options: ["Sukker", "Ingenting", "Mælk", "Fløde"],
          correct: 2
        }
      ]
    },
    speaking: {
      prompt: "Fortæl kort om din by eller dit nabolag. Hvad kan man gøre der? Hvad kan du lide bedst?"
    },
    writing: {
      prompt: "Skriv en kort besked til din ven. Du vil mødes i weekenden. Fortæl hvornår og hvor. (Ca. 50 ord)"
    }
  }
};

export const LANGUAGE_LABELS = {
  finnish: { name: "Finnish", flag: "🇫🇮", exam: "YKI" },
  swedish: { name: "Swedish", flag: "🇸🇪", exam: "Swedex" },
  danish: { name: "Danish", flag: "🇩🇰", exam: "PD3" }
};

export const CEFR_ESTIMATE = {
  high: { label: "B1–B2", message: "You have a strong foundation. Sign up to prepare for the full exam!" },
  mid: { label: "A2–B1", message: "Good progress! Regular practice will get you exam-ready." },
  low: { label: "A1–A2", message: "Great start! Keep practicing and you'll improve quickly." }
};
```

**Step 2: Verify the file exists**
```bash
ls src/data/freeTestContent.js
```
Expected: file listed

**Step 3: Commit**
```bash
git add src/data/freeTestContent.js
git commit -m "feat: add static free test content for Finnish, Swedish, and Danish"
```

---

## Task 2: Create FreeTest page

**Files:**
- Create: `src/pages/FreeTest.jsx`

This page is auto-registered by Base44's Vite plugin when saved. It requires no auth. It guides users through a 6-step flow: language pick → reading → listening → speaking → writing → results.

**Step 1: Create the page**

```jsx
// src/pages/FreeTest.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FREE_TEST_CONTENT, LANGUAGE_LABELS, CEFR_ESTIMATE } from "@/data/freeTestContent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Headphones, Mic, PenTool, CheckCircle, ArrowRight, Globe } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const STEPS = ["language", "reading", "listening", "speaking", "writing", "results"];

export default function FreeTest() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // index into STEPS
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

  // --- Render steps ---

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
          <Button
            size="lg"
            className="w-full"
            disabled={!language}
            onClick={goNext}
          >
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
        <p className="text-sm text-gray-500 mb-1">Read the text, then answer the questions.</p>
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
        <p className="text-sm text-gray-500 mb-1">Read the conversation, then answer the questions.</p>
        <Card className="bg-blue-50 border-blue-200 mb-4">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2"><Headphones className="w-4 h-4" />{title}</h3>
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
        <p className="text-xs text-gray-400 mt-1">{writingText.split(/\s+/).filter(Boolean).length} words</p>
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
                <span className="font-medium flex items-center gap-2"><BookOpen className="w-4 h-4" /> Reading</span>
                <span className="font-bold">{readingScore.correct}/{readingScore.total}</span>
              </div>
              <Progress value={(readingScore.correct / readingScore.total) * 100} className="h-2" />
              <div className="flex items-center justify-between">
                <span className="font-medium flex items-center gap-2"><Headphones className="w-4 h-4" /> Listening</span>
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
            <Button variant="outline" className="w-full" onClick={() => { setStep(0); setLanguage(null); setAnswers({ reading: {}, listening: {} }); setSpeakingNote(""); setWritingText(""); }}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// --- Helper components ---

function TestShell({ step, progress, title, icon: Icon, onNext, canNext, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pt-4">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{title}</div>
            <Progress value={progress} className="h-1.5 mt-1" />
          </div>
          <Badge variant="outline">Step {step} / {5}</Badge>
        </div>
        {/* Content */}
        <div>{children}</div>
        {/* Nav */}
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
```

**Step 2: Add missing `useEffect` import** — it's already used in the file. Add `import React, { useState, useEffect } from "react";` at the top (included above).

**Step 3: Verify the page auto-registers** — start the dev server and visit `/FreeTest`
```bash
npm run dev
```
Expected: page loads at `http://localhost:5173/FreeTest` without a login redirect.

**Step 4: Commit**
```bash
git add src/pages/FreeTest.jsx
git commit -m "feat: add free public mini-exam page for SEO acquisition"
```

---

## Task 3: Add "Free Mini-Test" CTA to Landing page

**Files:**
- Modify: `src/pages/Landing.jsx`

The landing page already has two buttons in the hero. Add a third, secondary button linking to the free test.

**Step 1: Find the existing buttons block in Landing.jsx**

Look for this block around line 98:
```jsx
<div className="flex flex-col sm:flex-row gap-4 justify-center">
  <Button
    size="lg"
```

**Step 2: Add the free test button after the existing buttons**

Add this button inside the same flex container:
```jsx
<Button
  size="lg"
  variant="outline"
  className="border-blue-600 text-blue-700 hover:bg-blue-50"
  onClick={() => navigate(createPageUrl("FreeTest"))}
>
  <Globe className="mr-2 w-5 h-5" />
  Try a Free Mini-Test
</Button>
```

Also add `Globe` to the lucide-react import at the top of Landing.jsx:
```jsx
import { BookOpen, Headphones, Mic, PenTool, CheckCircle, Target, TrendingUp, Award, Globe } from "lucide-react";
```

**Step 3: Verify the button appears on the landing page** — no auth needed to see Landing.

**Step 4: Commit**
```bash
git add src/pages/Landing.jsx
git commit -m "feat: add free mini-test CTA button to landing page"
```

---

## Task 4: Create ReadinessShareCard component

**Files:**
- Create: `src/components/dashboard/ReadinessShareCard.jsx`

This component renders a visually styled card (hidden off-screen) and exposes a `generateAndShare(readiness, user)` async function that:
1. Captures the card as a PNG via `html2canvas`
2. Tries `navigator.share` (Web Share API, works on mobile)
3. Falls back to downloading the image

**Step 1: Create the component**

```jsx
// src/components/dashboard/ReadinessShareCard.jsx
import React, { useRef } from "react";
import html2canvas from "html2canvas";

/**
 * Hidden card rendered off-screen, captured via html2canvas.
 * Export: useReadinessShareCard hook returns { cardRef, shareCard }
 */
export function useReadinessShareCard() {
  const cardRef = useRef(null);

  const shareCard = async ({ score, level, sectionScores, examDate, targetTest, userName }) => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });

      const dataUrl = canvas.toDataURL("image/png");

      // Try Web Share API (mobile)
      if (navigator.share && navigator.canShare) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "my-readiness-card.png", { type: "image/png" });
        const shareData = {
          title: "My Language Exam Readiness",
          text: `I'm ${score}% ready for my ${targetTest} exam! Check out this app: ykiprepmaster.com`,
          files: [file],
        };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }

      // Desktop fallback: download image
      const link = document.createElement("a");
      link.download = "my-readiness-card.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Share card error:", err);
      throw err;
    }
  };

  return { cardRef, shareCard };
}

/**
 * The hidden card element — must be rendered in the DOM to be captured.
 * Position it off-screen with a fixed pixel width for consistent rendering.
 */
export function ReadinessShareCardTemplate({ cardRef, score, level, sectionScores, examDate, targetTest, userName }) {
  const daysLeft = examDate
    ? Math.max(0, Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  const sectionEmoji = (s) => (s >= 70 ? "✅" : "⚠️");

  return (
    <div
      ref={cardRef}
      style={{
        position: "fixed",
        left: "-9999px",
        top: 0,
        width: "480px",
        padding: "32px",
        background: "linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)",
        borderRadius: "16px",
        color: "white",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <div style={{ fontSize: "11px", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>
            YKI Prep Master
          </div>
          <div style={{ fontSize: "18px", fontWeight: "700" }}>
            {userName || "Language Learner"}
          </div>
          <div style={{ fontSize: "13px", opacity: 0.8 }}>
            {targetTest} Preparation
          </div>
        </div>
        {daysLeft !== null && (
          <div style={{ textAlign: "center", background: "rgba(255,255,255,0.15)", borderRadius: "12px", padding: "10px 16px" }}>
            <div style={{ fontSize: "28px", fontWeight: "800" }}>{daysLeft}</div>
            <div style={{ fontSize: "11px", opacity: 0.8 }}>days to go</div>
          </div>
        )}
      </div>

      {/* Score */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{ fontSize: "64px", fontWeight: "800", lineHeight: 1 }}>{score}%</div>
        <div style={{ fontSize: "16px", opacity: 0.9, marginTop: "4px" }}>Ready for the exam</div>
        <div style={{ fontSize: "13px", opacity: 0.7, marginTop: "4px" }}>{level}</div>
      </div>

      {/* Section scores */}
      {sectionScores && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "24px" }}>
          {Object.entries(sectionScores).map(([section, val]) => (
            <div
              key={section}
              style={{ background: "rgba(255,255,255,0.15)", borderRadius: "8px", padding: "8px 12px" }}
            >
              <div style={{ fontSize: "11px", opacity: 0.7, textTransform: "capitalize" }}>
                {sectionEmoji(val)} {section}
              </div>
              <div style={{ fontSize: "20px", fontWeight: "700" }}>{val}%</div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: "12px", opacity: 0.6, borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "12px" }}>
        ykiprepmaster.com
      </div>
    </div>
  );
}
```

**Step 2: Verify no import errors** — no test needed for a component file, we'll test it in Task 5.

**Step 3: Commit**
```bash
git add src/components/dashboard/ReadinessShareCard.jsx
git commit -m "feat: add ReadinessShareCard component with html2canvas export"
```

---

## Task 5: Add countdown + share button to ExamReadiness page

**Files:**
- Modify: `src/pages/ExamReadiness.jsx`

The page already loads `readinessScore` (with `.score`, `.level`, `.section_scores`) and `user` (with `user.exam_date`, `user.target_test`, `user.full_name`). We need to:
1. Compute `daysLeft` from `user.exam_date`
2. Add a countdown banner near the top
3. Import and render `ReadinessShareCardTemplate` (hidden)
4. Add a "Share Your Progress" button that calls `shareCard()`

**Step 1: Read the full ExamReadiness.jsx to find the right insertion points**

Read `src/pages/ExamReadiness.jsx` to see current JSX structure (look for the return statement and score display area).

**Step 2: Add imports at the top of ExamReadiness.jsx**

Add to existing imports:
```jsx
import { differenceInCalendarDays } from "date-fns";
import { Share2 } from "lucide-react";
import { useReadinessShareCard, ReadinessShareCardTemplate } from "@/components/dashboard/ReadinessShareCard";
import { toast } from "@/components/ui/use-toast";
```

**Step 3: Add hook call inside the component (after existing state declarations)**

```jsx
const { cardRef, shareCard } = useReadinessShareCard();
```

**Step 4: Add `daysLeft` computation (after user and readinessScore are loaded)**

Add inside the component, after the existing state variables:
```jsx
const daysLeft = user?.exam_date
  ? differenceInCalendarDays(new Date(user.exam_date), new Date())
  : null;
```

**Step 5: Add share handler**

```jsx
const handleShare = async () => {
  try {
    await shareCard({
      score: readinessScore.score,
      level: readinessScore.level,
      sectionScores: readinessScore.section_scores,
      examDate: user?.exam_date,
      targetTest: user?.target_test || "YKI",
      userName: user?.full_name?.split(" ")[0] || "Language Learner",
    });
  } catch (err) {
    toast({ title: "Could not share", description: "Try again or take a screenshot.", variant: "destructive" });
  }
};
```

**Step 6: Add countdown banner to JSX**

Find the area where the score is displayed (look for `{readinessScore.score}%`). Add this block just above the score card:

```jsx
{daysLeft !== null && daysLeft >= 0 && (
  <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
    <CardContent className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Calendar className="w-6 h-6" />
        <div>
          <div className="font-bold text-lg">{daysLeft} days until your exam</div>
          <div className="text-sm text-orange-100">{user.target_test} on {new Date(user.exam_date).toLocaleDateString()}</div>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

Also add `Calendar` to the existing lucide-react import.

**Step 7: Add share button near the score display**

Find where `readinessScore.score` is shown and add the button nearby:

```jsx
<Button onClick={handleShare} variant="outline" className="gap-2">
  <Share2 className="w-4 h-4" />
  Share Your Progress
</Button>
```

**Step 8: Render hidden card template at end of JSX (just before closing `</div>`)**

```jsx
{readinessScore && user && (
  <ReadinessShareCardTemplate
    cardRef={cardRef}
    score={readinessScore.score}
    level={readinessScore.level}
    sectionScores={readinessScore.section_scores}
    examDate={user.exam_date}
    targetTest={user.target_test || "YKI"}
    userName={user.full_name?.split(" ")[0]}
  />
)}
```

**Step 9: Verify in browser**
- Log in, go to `/ExamReadiness`
- If you have a `test_date` set in Settings, the countdown banner should show
- Click "Share Your Progress" — on desktop it should download a PNG
- The card image should show your name, score, section breakdown, and days left

**Step 10: Commit**
```bash
git add src/pages/ExamReadiness.jsx
git commit -m "feat: add exam countdown and shareable readiness card to ExamReadiness page"
```

---

## Task 6: Manual end-to-end verification

**Step 1: Test FreeTest page**
1. Open `http://localhost:5173/FreeTest` in an incognito window (no auth)
2. Select Finnish, click Start
3. Answer reading questions, continue
4. Answer listening questions, continue
5. View speaking prompt, continue
6. Type in writing area, continue
7. Verify results page shows score + CEFR estimate + CTA button
8. CTA navigates to Dashboard (sign-up/login)

**Step 2: Test Landing page CTA**
1. Open `http://localhost:5173/Landing`
2. Verify "Try a Free Mini-Test" button is visible
3. Click → lands on FreeTest

**Step 3: Test Share Card**
1. Log in, navigate to ExamReadiness
2. If `test_date` is set in Settings, confirm countdown shows
3. Click "Share Your Progress"
4. On desktop: a PNG downloads — open it, verify it looks like the card template
5. Check card has: name, score %, section scores, days left, "ykiprepmaster.com"

**Step 4: Final commit if all good**
```bash
git add -A
git commit -m "chore: verify user acquisition features end-to-end"
```
