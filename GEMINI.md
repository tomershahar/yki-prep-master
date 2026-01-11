# YKI Prep Master

## Overview

The "YKI Prep Master" is an AI-powered web application designed to help users prepare for the YKI (Finnish National Certificate of Language Proficiency) exam in both Finnish and Swedish. Leveraging cutting-edge AI technology, the application provides personalized practice, instant feedback, and comprehensive progress tracking to optimize the learning experience.

## Key Features

*   **Quick Practice Sessions**: Engage in focused practice exercises for all YKI exam sections:
    *   **Reading**: Comprehension and analysis of diverse texts.
    *   **Listening**: Understanding spoken Finnish/Swedish with varied scenarios and authentic audio.
    *   **Speaking**: Practice oral communication with AI-powered transcription and grading.
    *   **Writing**: Develop written expression through AI-evaluated tasks with personalized feedback.
*   **Full Exam Simulations**: Experience realistic YKI exam conditions to gauge readiness.
*   **Adaptive Learning**: Content is tailored to the user's CEFR proficiency level (A1, A2, B1, B2) and identifies weak areas.
*   **Personalized AI Feedback**: Receive instant, detailed AI feedback on speaking and writing tasks, including scores, CEFR level estimates, strengths, and areas for improvement.
*   **Progress Tracking & Analytics**: Monitor learning progress through a comprehensive dashboard, tracking study hours, practice history, and section-specific performance.
*   **Achievement System**: Stay motivated with an achievement system that rewards milestones and consistent effort.
*   **Word Bank**: Build and manage personalized vocabulary lists.
*   **Grammar Tips**: Access AI-generated grammar tips relevant to the current practice session and user's level.
*   **Content Generation**: AI dynamically generates new and diverse practice content (reading passages, listening scripts, writing prompts, speaking scenarios) on various topics to prevent repetition.

## Technology Stack

*   **Frontend**: React, TypeScript, Tailwind CSS, Shadcn/ui
*   **Backend**: Base44 (Backend-as-a-Service)
*   **AI/ML**: Integrated with advanced LLMs (e.g., GPT-4o) for content generation, grading, and feedback.
*   **Real-time Capabilities**: Utilizes real-time subscriptions for immediate updates.
*   **Testing**: Playwright for end-to-end UI testing.

## How it Works

Users can select an exam section and difficulty level to start a practice session. The AI dynamically generates unique content for each session, provides feedback, and helps track progress. Admin users have access to additional tools for content management, analytics, and model evaluation.

## Recent Improvements and Highlights

*   **Enhanced AI Grading**: Significant improvements to AI grading accuracy for both speaking and writing tasks, addressing previous feedback on grading failures (e.g., 500 errors).
*   **Diverse Practice Content**: Expanded prompt engineering to ensure a wider variety of topics and scenarios for reading, listening, speaking, and writing exercises, making practice more engaging and comprehensive.
*   **Robust Testing Infrastructure**: Implemented and refined automated testing using Playwright, including CI/CD pipeline integration, to ensure application stability and reliability.
*   **Improved User Experience**: Refinements to loading states, error handling, and user guidance within practice sessions.

## Target Audience

This application is ideal for individuals preparing for the YKI exam in Finnish or Swedish, including language students, immigrants, and anyone looking to improve their language proficiency for official certification or personal development.
