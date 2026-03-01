import React, { useState } from 'react';
import { MessageSquare, X, Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Feedback } from "@/entities/Feedback";

export default function FeedbackButton() {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!text.trim()) return;
        setSubmitting(true);
        await Feedback.create({
            feedback_text: text.trim(),
            page_context: window.location.href,
        });
        setSubmitting(false);
        setSubmitted(true);
        setText('');
        setTimeout(() => {
            setSubmitted(false);
            setOpen(false);
        }, 2000);
    };

    return (
        <>
            {open && (
                <div className="fixed bottom-20 right-5 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600">
                        <span className="text-white font-semibold text-sm">Share Feedback</span>
                        <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="p-4">
                        {submitted ? (
                            <p className="text-center text-green-600 font-medium py-4">Thanks for your feedback! 🎉</p>
                        ) : (
                            <>
                                <textarea
                                    className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700"
                                    rows={4}
                                    placeholder="Tell us what you think, found a bug, or have a suggestion..."
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                />
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || !text.trim()}
                                    className="mt-2 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white font-medium text-sm rounded-xl py-2.5 transition-opacity"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {submitting ? 'Sending...' : 'Send Feedback'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            <button
                onClick={() => setOpen(o => !o)}
                className="fixed bottom-5 right-5 rounded-full h-14 w-14 shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white z-40 flex items-center justify-center"
                aria-label="Give Feedback"
                title="Give Feedback"
            >
                <MessageSquare className="w-6 h-6" />
            </button>
        </>
    );
}