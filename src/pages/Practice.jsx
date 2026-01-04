import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { PracticeSession } from "@/entities/PracticeSession";
import { InvokeLLM } from "@/integrations/Core";
import { generateSpeech } from '@/functions/generateSpeech';
// Still imported, but no longer used for listening practice generation
import { KnowledgeBaseContent } from "@/entities/KnowledgeBaseContent";
import { Achievement } from "@/entities/Achievement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Headphones, Mic, PenTool, Play, Loader2, Clock, X, Lightbulb, Check } from "lucide-react";
import QuickPracticeSession from "../components/exam/QuickPracticeSession";
import { staticContent } from "../components/exam/StaticPracticeContent";
import AIGrammarTips from "../components/practice/AIGrammarTips";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const difficultyLevels = ["A1", "A2", "B1", "B2"];

export default function Practice() {
  const [user, setUser] = useState(null);
  const [activeExam, setActiveExam] = useState(null);
  const [activeSection, setActiveSection] = useState(false);
  const [isLoadingExam, setIsLoadingExam] = useState(false);
  const [practiceReady, setPracticeReady] = useState(false); // New state for two-stage loading
  const [isCompleting, setIsCompleting] = useState(false); // Safeguard state
  const [showGrammarTips, setShowGrammarTips] = useState(true); // New state for showing/hiding grammar tips
  const [completionDialog, setCompletionDialog] = useState(null); // For completion message dialog

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sectionToStart = params.get('start');
    if (user && sectionToStart && !activeExam && !isLoadingExam) {
      const sectionObject = practiceSections.find((s) => s.id === sectionToStart);
      if (sectionObject) {
        startPractice(sectionObject);
      }
    }
  }, [user, activeExam, isLoadingExam]);

  const loadUserData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      // Initialize showGrammarTips based on user preferences, default to true
      setShowGrammarTips(currentUser.show_grammar_tips !== false);
      const lastRefresh = localStorage.getItem('dashboard_refresh_needed');
      if (lastRefresh) {
        localStorage.removeItem('dashboard_refresh_needed');
        window.dispatchEvent(new Event('storage'));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const practiceSections = [
    { id: 'reading', title: 'Reading Practice', icon: BookOpen, color: 'from-amber-400 to-orange-500', questions: '4-6 questions' },
    { id: 'listening', title: 'Listening Practice', icon: Headphones, color: 'from-blue-400 to-cyan-500', questions: '4-6 questions' },
    { id: 'speaking', title: 'Speaking Practice', icon: Mic, color: 'from-green-400 to-emerald-500', questions: '4-6 questions' },
    { id: 'writing', title: 'Writing Practice', icon: PenTool, color: 'from-purple-400 to-pink-500', questions: '4-6 questions' }
  ];


  const getAIPrompt = (section, language, difficulty) => {
    const languageName = language === 'finnish' ? 'Finnish' : 'Swedish';

    const baseSystemInstruction = `You are a YKI Practice Generator. Your task is to generate high-quality practice content for CEFR level ${difficulty} in ${languageName}. Ensure all content is culturally relevant, natural, and grammatically correct. Respond in the specified JSON format.

**Use the provided Knowledge Base documents, especially any file defining CEFR levels, as your primary source of truth for level-specific requirements.**`;

    switch (section.id) {
      case 'reading':
        return `${baseSystemInstruction}

TASK: Create a complete reading comprehension exercise for level ${difficulty} in ${languageName}.

INSTRUCTIONS:
1. Generate a short reading text ENTIRELY in ${languageName}.
   - Topic must be culturally relevant for adult learners in Finland/Sweden (e.g., daily routines, work, public services, culture).

2. Match the CEFR level expectations **exactly**:
   - A1: 100–120 words. Very simple vocabulary. Basic sentence structures.
   - A2: 150–180 words. Simple vocabulary, some thematic terms. Compound sentences with basic connectors.
   - B1: 180–220 words. Compound and complex sentences. Include reasoning, descriptive expressions, and opinions.
   - B2: 220–250 words. Complex structures, subordinate clauses, passive voice, conditional sentences, and abstract vocabulary.

3. Generate **5 multiple-choice questions** in ${languageName}.
   - At least 3 must test inference or interpretation, not just recall.
   - Each question must follow the JSON format below.

4. Return a valid JSON object with this exact structure:
{
  "text": "Reading passage content in ${languageName}",
  "questions": [
    {
      "question_type": "multiple_choice",
      "question": "Question in ${languageName}",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "Option A",
      "explanation": "Explanation in ${languageName}"
    }
  ]
}`;

      case 'listening':
        return `${baseSystemInstruction}

TASK: Create a complete listening comprehension exercise for level ${difficulty} in ${languageName}.

INSTRUCTIONS:
1. Generate a short audio script (150-200 words max) for a single speaker ENTIRELY in ${languageName}.
   - Choose a realistic scenario: News Report, Personal Story, Narrative, or Announcement.

2. Match the CEFR level expectations **exactly** for spoken language.

3. Generate **4-6 multiple-choice questions** in ${languageName}.
   - For A1, questions must test direct recall.
   - For A2-B2, at least 3 questions must test inference or interpretation.

4. Return a valid JSON object with this exact structure:
{
  "audio_script": "The single-person script in ${languageName}",
  "scenario_description": "Brief context description in ${languageName}",
  "questions": [
    {
      "question_type": "multiple_choice",
      "question": "Question in ${languageName}",
      "options": ["A in ${languageName}", "B in ${languageName}", "C in ${languageName}", "D in ${languageName}"],
      "correct_answer": "Correct option",
      "explanation": "Explanation in ${languageName}"
    }
  ]
}`;

      case 'writing':
        return `${baseSystemInstruction}

TASK: Create a complete writing exercise with two distinct tasks for level ${difficulty} in ${languageName}.

INSTRUCTIONS:
1. Generate two writing tasks:
   - Task 1: An Informal Message (e.g., email to a friend).
   - Task 2: A Formal Message or Opinion Piece (e.g., official email, short essay).

2. Match the CEFR level expectations **exactly** for prompts and word counts:
   - A1: 30-50 words per task.
   - A2: 40-60 words per task.
   - B1: 60-100 words per task.
   - B2: 80-120 words per task.

3. For each task, provide a sample answer and clear assessment criteria.

4. Return a valid JSON object with this exact structure:
{
  "tasks": [
    {
      "task_type": "Informal Message",
      "prompt": "Prompt in ${languageName}",
      "word_count": "e.g., 30-50 words",
      "sample_answer": "Example response in ${languageName}",
      "assessment_criteria": { "task_fulfillment": "...", "language_sophistication": "...", "grammatical_accuracy": "..." }
    },
    {
      "task_type": "Formal Message",
      "prompt": "Prompt in ${languageName}",
      "word_count": "e.g., 80-120 words",
      "sample_answer": "Example response in ${languageName}",
      "assessment_criteria": { "task_fulfillment": "...", "language_sophistication": "...", "grammatical_accuracy": "..." }
    }
  ]
}`;

      case 'speaking':
        return `${baseSystemInstruction}

TASK: Create a complete speaking exercise with two distinct tasks for level ${difficulty} in ${languageName}.

INSTRUCTIONS:
1. Generate two speaking tasks:
   - Task 1: A Simple Situational Response (target ~30 seconds).
   - Task 2: A Short Monologue or Description (target 1-2 minutes).

2. Match the CEFR level expectations **exactly** for prompts:
   - A1: Simple personal questions.
   - A2: Basic descriptions and opinions.
   - B1: Narrating experiences with reasoning.
   - B2: Discussing abstract topics with detail.

3. For each task, provide a sample answer and assessment criteria.

4. Return a valid JSON object with this exact structure:
{
  "tasks": [
    {
      "task_type": "Situational Response",
      "prompt": "Prompt in ${languageName}",
      "sample_answer": "Example response in ${languageName}",
      "assessment": "Assessment criteria in ${languageName}",
      "time_limit": "30 seconds"
    },
    {
      "task_type": "Monologue",
      "prompt": "Prompt in ${languageName}",
      "sample_answer": "Example response in ${languageName}",
      "assessment": "Assessment criteria in ${languageName}",
      "time_limit": "90 seconds"
    }
  ]
}`;

      default:
        return '';
    }
  };

  const generateQuickPractice = async (section, language, difficulty) => {
    try {
      const knowledgeFiles = await KnowledgeBaseContent.list();
      const fileUrls = knowledgeFiles.map((file) => file.file_url);

      // OPTIMIZED PROMPT - shorter and more focused
      const prompt = getAIPrompt(section, language, difficulty);

      let responseSchema;
      if (section.id === 'reading') {
        responseSchema = {
          type: "object",
          properties: {
            text: { type: "string" },
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question_type: { type: "string" },
                  question: { type: "string" },
                  options: { type: "array", items: { type: "string" } },
                  correct_answer: { type: "string" },
                  explanation: { type: "string" }
                },
                required: ["question_type", "question", "correct_answer"]
              }
            }
          },
          required: ["text", "questions"]
        };
      } else if (section.id === 'listening') {
        responseSchema = {
          type: "object",
          properties: {
            audio_script: { type: "string" },
            scenario_description: { type: "string" },
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question_type: { type: "string" },
                  question: { type: "string" },
                  options: { type: "array", items: { type: "string" } },
                  correct_answer: { type: "string" },
                  explanation: { type: "string" }
                },
                required: ["question_type", "question", "correct_answer"]
              }
            }
          },
          required: ["audio_script", "scenario_description", "questions"]
        };
      } else {// writing or speaking
        responseSchema = {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  task_type: { type: "string" },
                  prompt: { type: "string" },
                  word_count: { type: "string" },
                  sample_answer: { type: "string" },
                  comments: { type: "string" },
                  assessment: { type: "string" },
                  time_limit: { type: "string" },
                  assessment_criteria: {
                    type: "object",
                    properties: {
                      task_fulfillment: { type: "string" },
                      language_sophistication: { type: "string" },
                      grammatical_accuracy: { type: "string" }
                    }
                  }
                },
                required: ["task_type", "prompt", "sample_answer"]
              }
            }
          },
          required: ["tasks"]
        };
      }

      // Increased timeout for GPT-4o processing
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Generation timeout')), 100000); // 100 second timeout for GPT-4o
      });

      const generationPromise = InvokeLLM({
        prompt: prompt,
        response_json_schema: responseSchema,
        file_urls: fileUrls,
        model: "gpt-4o" // UPGRADED: Use GPT-4o instead of mini
      });

      const response = await Promise.race([generationPromise, timeoutPromise]);
      return response;
    } catch (error) {
      console.error("Error generating quick practice:", error);
      throw error;
    }
  };

  const getStaticPractice = (section, language, difficulty, passedPractices = []) => {
    console.log('=== DEBUG: getStaticPractice ===');
    console.log('Section:', section.id, 'Language:', language, 'Difficulty:', difficulty);

    const langContent = staticContent[section.id];
    if (!langContent) {
      console.log('No language content found for section:', section.id);
      return null;
    }

    const languageContent = langContent[language];
    if (!languageContent) {
      console.log('No content found for language:', language);
      return null;
    }

    let difficultyContent = languageContent[difficulty] || languageContent[Object.keys(languageContent)[0]];
    if (!difficultyContent || !Array.isArray(difficultyContent)) {
      console.log('No difficulty content found for:', difficulty);
      return null;
    }

    console.log('Total practices available:', difficultyContent.length);
    console.log('User passed practices:', passedPractices);

    // Create practice IDs for all available practices
    const allPracticeIds = difficultyContent.map((_, index) =>
      `${section.id}-${language}-${difficulty}-${index}`
    );
    console.log('All practice IDs for this level:', allPracticeIds);

    // Filter out practices that have been passed
    const availablePracticeIndices = [];
    difficultyContent.forEach((content, index) => {
      const practiceId = `${section.id}-${language}-${difficulty}-${index}`;
      const isPassed = passedPractices.includes(practiceId);
      console.log(`Practice ${practiceId}: ${isPassed ? 'PASSED' : 'AVAILABLE'}`);
      if (!isPassed) {
        availablePracticeIndices.push(index);
      }
    });

    console.log('Available practice indices:', availablePracticeIndices);

    if (availablePracticeIndices.length === 0) {
      console.log('No available practices left');
      return null;
    }

    // Select a random available practice
    const randomIndex = Math.floor(Math.random() * availablePracticeIndices.length);
    const selectedIndex = availablePracticeIndices[randomIndex];
    const practiceId = `${section.id}-${language}-${difficulty}-${selectedIndex}`;

    console.log('Selected practice index:', selectedIndex, 'ID:', practiceId);

    return {
      section: section.id,
      language: language,
      difficulty: difficulty,
      content: JSON.stringify(difficultyContent[selectedIndex]),
      is_practice: true,
      source: 'static',
      practiceId: practiceId
    };
  };

  const startPractice = async (section) => {
    // Check for iOS Chrome microphone issues before starting speaking practice
    if (section.id === 'speaking') {
      const isIOSChrome = /CriOS/.test(navigator.userAgent) && /iPhone|iPad/.test(navigator.userAgent);
      if (isIOSChrome) {
        const proceed = confirm("⚠️ Microphone Issue Detected\n\nRecording doesn't work properly in Chrome on iPhone/iPad.\n\nFor speaking practice, we recommend:\n• Opening this page in Safari instead\n• Using Safari for all speaking exercises\n\nDo you want to continue anyway? (Recording may not work correctly)");
        if (!proceed) {
          return; // User chose not to continue
        }
      }
    }

    setIsLoadingExam(true);
    setPracticeReady(false);
    setActiveSection(section);

    try {
      let currentUser = await User.me();
      const language = currentUser.target_language;
      const difficulty = currentUser[`${section.id}_level`] || 'A1';

      // Add loading timeout alert for speaking
      let timeoutAlert = null;
      if (section.id === 'speaking') {
        timeoutAlert = setTimeout(() => {
          console.log("Speaking practice is taking longer than expected, still generating...");
        }, 20000); // Show message after 20 seconds
      }

      try {
        const generatedContent = await generateQuickPractice(section, language, difficulty);

        if (timeoutAlert) clearTimeout(timeoutAlert);

        // For speaking, we don't need audio generation like listening
        if (section.id === 'listening' && generatedContent?.audio_script) {
          try {
            const { data: audioData } = await generateSpeech({
              text_to_speak: generatedContent.audio_script,
              language: language
            });
            if (audioData.status === 'success') {
              generatedContent.audio_base64 = audioData.audio_base64;
            } else {
              throw new Error(audioData.message || 'Failed to generate speech.');
            }
          } catch (audioError) {
            console.error("Failed to pre-generate audio:", audioError);
            alert(`There was an issue generating the audio for this practice: ${audioError.message}. Please try again.`);
            setActiveSection(null);
            setIsLoadingExam(false);
            return;
          }
        }

        if (generatedContent && (generatedContent.questions || generatedContent.tasks)) {
          setActiveExam({
            section: section.id,
            language: language,
            difficulty: difficulty,
            content: JSON.stringify(generatedContent),
            is_practice: true,
            source: 'ai',
            practiceId: null
          });
          setPracticeReady(true);
        } else {
          throw new Error("Generated content is invalid or missing required fields");
        }
      } catch (generationError) {
        if (timeoutAlert) clearTimeout(timeoutAlert);
        console.error("AI practice generation failed, falling back to static content. Error:", generationError);

        alert("We couldn't generate a unique AI practice for you at this moment. Don't worry, here is a pre-made practice session instead!");

        const staticPractice = getStaticPractice(section, language, difficulty, currentUser.passed_practices || []);

        if (staticPractice) {
          console.log("Successfully fell back to static practice:", staticPractice.practiceId);
          let staticContent = JSON.parse(staticPractice.content);

          // For listening, the static content needs its audio generated on-the-fly.
          if (section.id === 'listening' && staticContent?.audio_script) {
            try {
              const { data: audioData } = await generateSpeech({
                text_to_speak: staticContent.audio_script,
                language: language
              });
              if (audioData.status === 'success') {
                staticContent.audio_base64 = audioData.audio_base64;
                staticPractice.content = JSON.stringify(staticContent); // Update content with audio
              } else {
                throw new Error(audioData.message || 'Failed to generate speech for static content.');
              }
            } catch (audioError) {
              console.error("Failed to generate audio for fallback practice:", audioError);
              alert(`We couldn't prepare the audio for the backup practice. Please try again.`);
              setActiveSection(null);
              setIsLoadingExam(false);
              return;
            }
          }

          setActiveExam(staticPractice);
          setPracticeReady(true);
        } else {
          console.error("Fallback to static practice also failed (no content available).");
          alert("Sorry, we couldn't prepare a practice session for you, not even a pre-made one. Please try again later.");
          setActiveSection(null);
          setIsLoadingExam(false);
        }
      }
    } catch (error) {
      console.error("Error starting practice:", error);
      alert("An error occurred while preparing your practice session. Please try again.");
      setActiveSection(null);
      setIsLoadingExam(false);
    }
  };

  const checkAndAwardAchievements = async (currentUser) => {
    // 1. Get all data
    const [allSessions, allAchievements] = await Promise.all([
      PracticeSession.filter({ created_by: currentUser.email }),
      Achievement.list()]
    );

    const userAchievements = new Set(currentUser.achievements || []);
    const achievementsToAward = [];

    // 2. Separate session types
    const practiceSessions = allSessions.filter((s) => s.session_type === 'practice');
    const examSessions = allSessions.filter((s) => s.session_type === 'full_exam');
    const passingPracticeSessions = practiceSessions.filter((s) => s.score >= 75);
    const passingExamSessions = examSessions.filter((s) => s.score >= 75);

    // 3. Loop through achievements that the user has NOT yet earned
    for (const ach of allAchievements) {
      if (userAchievements.has(ach.id)) continue; // Skip already earned achievements

      let unlocked = false;

      // 4. Check conditions for each category
      switch (ach.category) {
        case 'completion':
          if (ach.title.toLowerCase().includes('practice') && practiceSessions.length >= ach.requirement) {
            unlocked = true;
          } else if (ach.title.toLowerCase().includes('exam') && examSessions.length >= ach.requirement) {
            unlocked = true;
          }
          break;

        case 'milestone':
          if (ach.title.toLowerCase().includes('first pass')) {
            if (passingPracticeSessions.length >= 1 || passingExamSessions.length >= 1) {
              unlocked = true;
            }
          } else if (ach.title.toLowerCase().includes('perfect')) {
            const perfectSessions = allSessions.filter((s) => s.score >= 100);
            if (perfectSessions.length >= ach.requirement) unlocked = true;
          } else if (ach.title.toLowerCase().includes('excellence')) {
            const excellentSessions = allSessions.filter((s) => s.score >= 90);
            if (excellentSessions.length >= ach.requirement) unlocked = true;
          }
          break;

        case 'streak':
          // Current streak logic is handled on the dashboard and is complex.
          // This check assumes a separate logic calculates and stores the user's streak.
          break;

        case 'hours':
          const totalHours = currentUser.total_hours_trained || 0;
          if (totalHours >= ach.requirement) unlocked = true;
          break;

        case 'reading':
        case 'listening':
        case 'speaking':
        case 'writing':
          const passedMasterySessions = allSessions.filter((s) => s.exam_section === ach.category && s.score >= 75);
          if (passedMasterySessions.length >= ach.requirement) {
            unlocked = true;
          }
          break;
      }

      // 5. Award achievement
      if (unlocked) {
        achievementsToAward.push(ach);
        userAchievements.add(ach.id);
      }
    }

    // 6. Update user if new achievements were found
    if (achievementsToAward.length > 0) {
      await User.updateMyUserData({ achievements: Array.from(userAchievements) });
      achievementsToAward.forEach((ach, index) => {
        setTimeout(() => {
          alert(`🎉 Achievement Unlocked: ${ach.title}!\n${ach.description}`);
        }, index * 500); // Stagger alerts to prevent them from overlapping
      });
    }
  };

  const handlePracticeComplete = async (sessionData, practiceId, markAsCompleted) => {
    if (isCompleting) return; // Prevent double execution
    setIsCompleting(true);

    try {
      console.log('=== PRACTICE COMPLETION DEBUG ===');
      console.log('Session data:', sessionData);
      console.log('Practice ID:', practiceId);
      console.log('Mark as completed:', markAsCompleted);
      console.log('Score:', sessionData.score);

      // FIXED: Add validation for required fields
      if (!sessionData.section || sessionData.score === undefined) {
        throw new Error('Missing required session data (section or score)');
      }

      // FIXED: Ensure all required fields are present with defaults
      const completeSessionData = {
        exam_section: sessionData.section,
        session_type: 'practice',
        duration_minutes: sessionData.duration_minutes || 10,
        score: Math.max(0, Math.min(100, sessionData.score || 0)), // Ensure score is between 0-100
        questions_attempted: sessionData.questions_attempted || 1,
        questions_correct: sessionData.questions_correct || 0,
        difficulty_level: sessionData.difficulty_level || 'A1',
        answers: sessionData.answers || {},
        feedback: sessionData.feedback || null,
        cefr_level: sessionData.cefr_level || 'A1',
        detailed_feedback: sessionData.detailed_feedback || null
      };

      console.log('Complete session data to save:', completeSessionData);

      // FIXED: Add try-catch around the database save operation
      let savedSession;
      try {
        savedSession = await PracticeSession.create(completeSessionData);
        console.log('Session saved successfully:', savedSession);
      } catch (dbError) {
        console.error('Database save error:', dbError);
        throw new Error(`Failed to save practice session: ${dbError.message}`);
      }

      const hoursToAdd = (completeSessionData.duration_minutes || 10) / 60;
      let currentUser = await User.me();

      const shouldMarkAsPassed = sessionData.score >= 75 || markAsCompleted;
      console.log('Should mark as passed:', shouldMarkAsPassed);

      // Logic for static practices (only applies if practiceId exists)
      if (practiceId && shouldMarkAsPassed) {
        try {
          const currentPassedPractices = currentUser.passed_practices || [];
          console.log('Current passed practices before update:', currentPassedPractices);

          if (!currentPassedPractices.includes(practiceId)) {
            const newPassedPractices = [...currentPassedPractices, practiceId];
            console.log('New passed practices array:', newPassedPractices);

            await User.updateMyUserData({ passed_practices: newPassedPractices });
            console.log('Updated passed practices in database');

            // Refresh user data after update
            currentUser = await User.me();
            console.log('Verification - passed practices after update:', currentUser.passed_practices);
          } else {
            console.log('Practice already marked as passed');
          }
        } catch (passedPracticeError) {
          console.error('Error updating passed practices:', passedPracticeError);
          // Don't throw here - this is not critical to the main flow
        }
      }

      // FIXED: Add try-catch around user data updates
      try {
        const sectionId = sessionData.section;
        const userCurrentLevel = currentUser[`${sectionId}_level`] || 'A1';
        const countKey = `${sectionId}_${userCurrentLevel}`;

        const currentCounts = currentUser.practice_completion_counts || {};
        const newCount = (currentCounts[countKey] || 0) + 1;
        const updatedCounts = { ...currentCounts, [countKey]: newCount };

        // Update completion counts
        await User.updateMyUserData({ practice_completion_counts: updatedCounts });
        currentUser = await User.me(); // Refresh user data after update

        // Check for level-up offer
        if (newCount > 0 && newCount % 10 === 0) {
          const currentIndex = difficultyLevels.indexOf(userCurrentLevel);
          if (currentIndex < difficultyLevels.length - 1) {
            const newLevel = difficultyLevels[currentIndex + 1];
            if (confirm(`You've completed ${newCount} practices for ${sectionId} at level ${userCurrentLevel}!
Would you like to advance to level ${newLevel}?`)) {
              await User.updateMyUserData({ [`${sectionId}_level`]: newLevel });
              alert(`You've been advanced to level ${newLevel} for ${sectionId}!`);
              currentUser = await User.me(); // Refresh user again
            } else {
              alert("No problem, you can keep practicing at your current level.");
            }
          }
        }

        // Update training hours
        const currentSectionHours = currentUser[`${sessionData.section}_hours_trained`] || 0;
        const currentTotalHours = currentUser.total_hours_trained || 0;

        await User.updateMyUserData({
          [`${sessionData.section}_hours_trained`]: currentSectionHours + hoursToAdd,
          total_hours_trained: currentTotalHours + hoursToAdd
        });

        // Refresh user data once more before checking achievements
        currentUser = await User.me();
      } catch (userUpdateError) {
        console.error('Error updating user data:', userUpdateError);
        // Don't throw here - the main session was saved successfully
        alert('Practice completed but there was an issue updating your progress. Your session was still saved.');
      }

      // FIXED: Add try-catch around achievements check
      try {
        await checkAndAwardAchievements(currentUser);
      } catch (achievementError) {
        console.error('Error checking achievements:', achievementError);
        // Don't throw here - not critical
      }

      // Success message
      let message = `Your score is ${sessionData.score}%.`;
      const passedText = practiceId && shouldMarkAsPassed ? "This practice has been marked as completed and won't appear again." : "Keep practicing to improve your score!";
      message += ` ${passedText}`;

      const finalCurrentLevel = currentUser[`${sessionData.section}_level`] || 'A1';
      let bonusMessage = '';
      if (sessionData.score >= 90) {
        const currentIndex = difficultyLevels.indexOf(finalCurrentLevel);
        if (currentIndex < difficultyLevels.length - 1) {
          bonusMessage = `Excellent! You're doing great at level ${finalCurrentLevel}. If you feel ready for a bigger challenge, you can change your level in the Settings page.`;
        } else {
          bonusMessage = `Perfect score! You're already at the highest level (${finalCurrentLevel}) for this section!`;
        }
      }

      setCompletionDialog({
        score: sessionData.score,
        message,
        bonusMessage
      });

      setActiveExam(null);
      setActiveSection(null);
      await loadUserData();

      localStorage.setItem('dashboard_refresh_needed', 'true');

      if (window.location.search.includes('start=')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

    } catch (error) {
      console.error("Error saving practice session:", error);
      // FIXED: More specific error message
      let errorMessage = "Error saving your results. ";
      if (error.message.includes('database') || error.message.includes('Failed to save')) {
        errorMessage += "There was a problem connecting to the database. Please check your internet connection and try again.";
      } else if (error.message.includes('session data')) {
        errorMessage += "The practice data was incomplete. Please try the practice again.";
      } else {
        errorMessage += "Please try again or contact support if the problem persists.";
      }
      alert(errorMessage);
    } finally {
      setIsCompleting(false); // Reset the safeguard
    }
  };

  const handlePracticeCancel = () => {
    if (confirm("Are you sure you want to exit the practice? Your progress will be lost.")) {
      setActiveExam(null);
      setActiveSection(null);
      setIsLoadingExam(false); // Make sure to exit loading state
      setPracticeReady(false);
      if (window.location.search.includes('start=')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  };

  if (isLoadingExam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <div className="max-w-2xl w-full space-y-6">
          {/* Loading Animation */}
          <div className="mb-8">
            {practiceReady ? (
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-white" />
              </div>
            ) : (
              <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-6" />
            )}
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {practiceReady ? "Your Practice is Ready!" : "Preparing Your Practice..."}
            </h2>
            <p className="text-gray-600">
              {practiceReady ? "You can review the tips below or start your practice now." : "Creating personalized practice content for your level..."}
            </p>
          </div>

          {user && activeSection && showGrammarTips &&
            <div className="mb-6 relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 z-10"
                onClick={() => setShowGrammarTips(false)}
                aria-label="Hide grammar tips">

                <X className="w-4 h-4" />
              </Button>
              <AIGrammarTips
                language={user.target_language}
                level={user[`${activeSection.id}_level`] || 'A1'}
                section={activeSection.id} />

            </div>
          }

          {practiceReady &&
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              {!showGrammarTips && user?.show_grammar_tips !== false &&
                <Button
                  variant="outline"
                  onClick={() => setShowGrammarTips(true)}
                  aria-label="Show grammar tips">

                  <Lightbulb className="w-4 h-4 mr-2" />
                  Show Tips
                </Button>
              }
              <Button size="lg" onClick={() => setIsLoadingExam(false)} className="bg-green-600 hover:bg-green-700">
                <Play className="w-5 h-5 mr-2" />
                Continue to Practice
              </Button>
            </div>
          }

          {!practiceReady &&
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-sm text-gray-500">
                {activeSection?.id === 'listening' ?
                  "We're generating unique audio content with natural speech..." :
                  "Creating personalized practice content for your level..."
                }
              </p>
            </div>
          }
        </div>
      </div>);

  }

  if (activeExam && activeSection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8">
        <QuickPracticeSession
          section={activeSection}
          exam={activeExam}
          onComplete={(sessionData, markAsCompleted) => handlePracticeComplete(sessionData, activeExam.practiceId, markAsCompleted)}
          onCancel={handlePracticeCancel} />

      </div>);

  }

  return (
    <>
      <div className="mx-auto p-4 md:p-8 max-w-7xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quick Practice</h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Build your skills with focused, untimed practice sessions. Each practice has 4-6 questions tailored to your level.</p>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="secondary" className="text-sm">Language: {String(user?.target_language === 'finnish' ? 'Finnish' : 'Swedish')}</Badge>
            <Badge variant="outline" className="text-sm flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Untimed Practice
            </Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {practiceSections.map((section) => {
            const userLevel = user ? user[`${section.id}_level`] : 'A1';
            return (
              <Card key={section.id} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${section.color} opacity-10 rounded-full transform translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform`}></div>
                <CardHeader className="relative">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 bg-gradient-to-br ${section.color} rounded-xl`}>
                      <section.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">Level {userLevel}</Badge>
                        <Badge variant="outline" className="text-xs">{section.questions}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Practice your {String(section.title).toLowerCase()} skills with targeted exercises designed for your current level.</p>
                  <Button
                    onClick={() => startPractice(section)}
                    className={`w-full bg-gradient-to-r ${section.color} hover:opacity-90 text-white shadow-lg group-hover:scale-105 transition-transform`}
                    disabled={isLoadingExam}>
                    <Play className="w-4 h-4 mr-2" />
                    Start Practice
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Completion Dialog */}
      <Dialog open={!!completionDialog} onOpenChange={(open) => !open && setCompletionDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Check className="w-6 h-6 text-green-600" />
              Practice Completed!
            </DialogTitle>
          </DialogHeader>
          {completionDialog && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  {String(completionDialog.score)}%
                </div>
                <p className="text-gray-600">{String(completionDialog.message || '')}</p>
              </div>
              {completionDialog.bonusMessage && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">{String(completionDialog.bonusMessage || '')}</p>
                </div>
              )}
              <Button 
                onClick={() => setCompletionDialog(null)} 
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Continue
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}