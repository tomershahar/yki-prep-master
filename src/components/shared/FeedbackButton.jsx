import React from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

export default function FeedbackButton() {
    return (
        <a
            href="https://discord.gg/MSUxjVNN"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-5 right-5 z-40"
            aria-label="Give Feedback on Discord"
        >
            <Button
                className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            >
                <MessageSquare className="w-6 h-6" />
            </Button>
        </a>
    );
}