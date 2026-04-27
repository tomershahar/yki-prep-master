import React from "react";
import { Link } from "react-router-dom";
import { Languages, BookOpen, Headphones, Pen, Mic, ArrowRight } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Languages className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-800">Nordic Test Prep</span>
        </div>

        <h1 className="text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
          About Nordic Test Prep
        </h1>

        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
          Nordic Test Prep is an AI-powered language learning platform built specifically for
          people preparing for Nordic language proficiency exams — including the Finnish YKI,
          Swedish Swedex, TISUS and SFI, and Danish Prøve i Dansk (PD2 &amp; PD3).
        </p>

        <h2 className="text-2xl font-bold text-slate-800 mb-4">What We Do</h2>
        <p className="text-slate-600 mb-6 leading-relaxed">
          Our platform generates authentic, exam-style practice content using advanced AI models
          calibrated to the Common European Framework of Reference for Languages (CEFR), covering
          levels A1 through C2. Whether you are a complete beginner or an advanced learner aiming
          for near-native mastery, Nordic Test Prep adapts to your level and helps you improve
          across all four core skills: reading, listening, writing, and speaking.
        </p>
        <p className="text-slate-600 mb-6 leading-relaxed">
          After every practice session or full exam simulation, our AI provides detailed,
          personalised feedback — explaining what you got right, where you went wrong, and exactly
          what to work on next. You can track your progress over time, earn achievements, build a
          personal word bank, and get a real-time exam readiness score so you always know where
          you stand.
        </p>

        <h2 className="text-2xl font-bold text-slate-800 mb-4">Who It Is For</h2>
        <p className="text-slate-600 mb-6 leading-relaxed">
          Nordic Test Prep is built for immigrants, students, and professionals who need to pass a
          formal language proficiency exam to obtain citizenship, a residence permit, or a
          university place in Finland, Sweden, or Denmark. It is equally useful for language
          enthusiasts who simply want to measure and improve their Nordic language skills in a
          structured, exam-focused way.
        </p>

        <h2 className="text-2xl font-bold text-slate-800 mb-4">Who Builds It</h2>
        <p className="text-slate-600 mb-8 leading-relaxed">
          Nordic Test Prep is an independent product built by a small team passionate about
          language learning and accessible education. We combine expertise in Nordic languages,
          CEFR assessment methodology, and modern AI technology to give every learner the best
          possible chance of passing their exam on the first attempt.
        </p>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {[
            { icon: BookOpen, label: "Reading Practice", desc: "Authentic passages at your exact CEFR level" },
            { icon: Headphones, label: "Listening Exercises", desc: "AI-generated audio with native-like voices" },
            { icon: Pen, label: "Writing Tasks", desc: "Detailed AI feedback on grammar and style" },
            { icon: Mic, label: "Speaking Practice", desc: "Record and get scored on fluency and accuracy" },
          ].map(({ icon: FeatureIcon, label, desc }) => (
            <div key={label} className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <FeatureIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Start Practising <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/Contact"
            className="inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}