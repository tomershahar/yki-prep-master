import React from "react";
import { Link } from "react-router-dom";
import { Languages, Mail, MessageSquare, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Languages className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-800">Nordic Test Prep</span>
        </div>

        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 leading-tight">
          Contact Us
        </h1>
        <p className="text-lg text-slate-600 mb-10 leading-relaxed">
          Have a question, found a bug, or want to share feedback? We'd love to hear from you.
          Reach out through any of the channels below and we'll get back to you as soon as possible.
        </p>

        <div className="space-y-4">
          {/* Email */}
          <Card className="border border-slate-200 shadow-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 mb-1">Email</p>
                <p className="text-slate-500 text-sm mb-2">
                  For general enquiries, bug reports, or partnership requests:
                </p>
                <a
                  href="mailto:hello@nordictestprep.com"
                  className="text-blue-600 hover:underline font-medium"
                >
                  hello@nordictestprep.com
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Discord */}
          <Card className="border border-slate-200 shadow-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 mb-1">Discord Community</p>
                <p className="text-slate-500 text-sm mb-2">
                  Join our community to ask questions, share tips, and connect with other learners
                  preparing for Nordic language exams.
                </p>
                <a
                  href="https://discord.gg/RnyuNWcg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline font-medium"
                >
                  Join our Discord server →
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10">
          <Link
            to="/About"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to About
          </Link>
        </div>
      </div>
    </div>
  );
}