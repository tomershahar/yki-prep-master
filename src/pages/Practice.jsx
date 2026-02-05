import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { PracticeSession } from "@/entities/PracticeSession";
import { TestConfiguration } from "@/entities/TestConfiguration";
import { InvokeLLM } from "@/integrations/Core";
import { generateSpeech } from '@/functions/generateSpeech';
import { KnowledgeBaseContent } from "@/entities/KnowledgeBaseContent";
import { Achievement } from "@/entities/Achievement";
import { getContentGenerationHelper } from '@/functions/getContentGenerationHelper';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Headphones, Mic, PenTool, Play, Loader2, Clock, X, Lightbulb, Check } from "lucide-react";
import QuickPracticeSession from "../components/exam/QuickPracticeSession";
import { staticContent } from "../components/exam/StaticPracticeContent";
import AIGrammarTips from "../components/practice/AIGrammarTips";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getWritingWeakSpots } from '@/functions/getWritingWeakSpots';
import { checkAndAwardAchievements } from '../components/shared/achievementUtils';
import { useKeyboardShortcuts } from '../components/shared/KeyboardShortcuts';
import ErrorBoundary from '../components/shared/ErrorBoundary';
import { calculateReadinessScore } from '@/functions/calculateReadinessScore';
import { toast } from "@/components/ui/use-toast";

const difficultyLevels = ["A1", "A2", "B1", "B2"];

export default function Practice() {
  const [user, setUser] = useState(null);
  const [testConfig, setTestConfig] = useState(null);
  const [activeExam, setActiveExam] = useState(null);
  const [activeSection, setActiveSection] = useState(false);
  const [isLoadingExam, setIsLoadingExam] = useState(false);
  const [practiceReady, setPracticeReady] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showGrammarTips, setShowGrammarTips] = useState(true);
  const [completionDialog, setCompletionDialog] = useState(null);

  // Keyboard shortcuts (only enable when practice is ready)
  useKeyboardShortcuts({
    onNext: () => practiceReady && !isLoadingExam && setIsLoadingExam(false),
    enabled: practiceReady && isLoadingExam,
  });

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
      
      // Load test configuration
      const configs = await TestConfiguration.filter({
        country_code: currentUser.target_country || 'FI',
        test_name: currentUser.target_test || 'YKI',
        is_active: true
      });
      if (configs && configs.length > 0) {
        setTestConfig(configs[0]);
      }
      
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


  const getAIPrompt = (section, language, difficulty, weakSpotsData = null) => {
    const languageName = language === 'finnish' ? 'Finnish' : language === 'swedish' ? 'Swedish' : 'Danish';

    // Build weak spots context for writing
    let weakSpotsContext = '';
    if (section.id === 'writing' && weakSpotsData && weakSpotsData.weakSpots && weakSpotsData.weakSpots.length > 0) {
      weakSpotsContext = `\n\n**IMPORTANT - Target Student's Weak Areas:**
This student has shown recurring difficulties in:
${weakSpotsData.weakSpots.map(ws => `- ${ws.description}`).join('\n')}
${weakSpotsData.specificIssues && weakSpotsData.specificIssues.length > 0 ? `\nSpecific issues: ${weakSpotsData.specificIssues.join(', ')}` : ''}

**Create prompts that will naturally require the student to use these challenging areas.** For example, if they struggle with past tense, create a prompt about describing a past event. If they have vocabulary issues, create a prompt requiring specific vocabulary domains they've struggled with.`;
    }

    const baseSystemInstruction = `You are a YKI Practice Generator. Your task is to generate high-quality practice content for CEFR level ${difficulty} in ${languageName}. Ensure all content is culturally relevant, natural, and grammatically correct. Respond in the specified JSON format.

**Use the provided Knowledge Base documents, especially any file defining CEFR levels, as your primary source of truth for level-specific requirements.**${weakSpotsContext}`;

    switch (section.id) {
      case 'reading':
        return `${baseSystemInstruction}

TASK: Create a complete reading comprehension exercise for level ${difficulty} in ${languageName}.

INSTRUCTIONS:
1. Generate a short reading text ENTIRELY in ${languageName}.
   - Topic must be culturally relevant for adult learners in Finland/Sweden
   - USE DIVERSE TOPICS: Choose from various themes such as:
     * Work & Career (job applications, workplace situations, professional emails)
     * Daily Life (shopping, transportation, housing, health services)
     * Education & Learning (school systems, courses, studying abroad)
     * Culture & Society (festivals, traditions, social customs, history)
     * Nature & Environment (seasons, outdoor activities, sustainability)
     * Technology & Media (social media, digital services, online communication)
     * Food & Dining (restaurants, recipes, food culture)
     * Travel & Tourism (hotels, attractions, travel planning)
     * Government & Public Services (immigration, healthcare, civic duties)
     * Hobbies & Leisure (sports, arts, entertainment, social activities)
   - AVOID repeating the same topic - vary themes to keep practice interesting

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
   - USE VARIED REALISTIC SCENARIOS from diverse contexts:
     * News Reports (local events, weather, cultural news, sports updates)
     * Personal Stories (travel experiences, life events, memories, achievements)
     * Announcements (public transport, store/museum announcements, event notices)
     * Phone Messages (voicemails about appointments, invitations, updates)
     * Podcast Excerpts (language tips, cultural insights, lifestyle topics)
     * Instructions (how-to guides, recipe directions, assembly steps)
     * Interviews (brief Q&A about hobbies, work, experiences)
     * Advertisements (services, products, events in Finland/Sweden)
   - VARY THE CONTEXT: Don't repeat the same scenario type - keep content fresh and engaging

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
1. Generate two writing tasks with VARIED TOPICS AND CONTEXTS:
   - Task 1: An Informal Message - choose from diverse scenarios:
     * Email to friend about: weekend plans, travel, new hobby, restaurant recommendation
     * Text message: inviting someone, canceling plans, sharing news, asking advice
     * Social media post: event recap, photo description, personal achievement
     * Note: thank you message, birthday wishes, apology, congratulations
   - Task 2: A Formal Message or Opinion Piece - vary the purpose:
     * Official emails: complaint to service, job inquiry, course registration, appointment request
     * Letters: application letter, recommendation request, inquiry to authority
     * Opinion pieces: essay on education, environment, technology, work-life balance
     * Formal reports: incident report, feedback form, proposal summary
   - SELECT DIFFERENT THEMES: work, education, health, environment, culture, technology, community

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
1. Generate two speaking tasks with DIVERSE PROMPTS AND CONTEXTS:
   - Task 1: A Situational Response (~30 seconds) - vary scenarios:
     * Introduce yourself at: job interview, language course, social event, volunteer group
     * Give directions to: tourist, new neighbor, delivery person, visitor
     * Make a phone call: book appointment, order food, ask about service, cancel reservation
     * Respond to invitation: accept/decline party invite, suggest alternative, ask details
     * Handle situation: return item to store, ask for help, explain problem, make complaint
   - Task 2: A Monologue/Description (1-2 minutes) - varied themes:
     * Describe: favorite place, memorable trip, daily routine, hometown, dream home
     * Narrate: learning experience, funny story, childhood memory, achievement
     * Explain: hobby, tradition, recipe, job responsibilities, future plans
     * Compare: two cities, past vs present, seasons, education systems
     * Give opinion on: technology, environment, work culture, social media, education
   - USE FRESH TOPICS: Avoid repetition - select from work, family, travel, hobbies, culture, education, environment

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
      // Use the helper function to route to the correct generator
      const testType = testConfig?.test_name || 'YKI';
      
      const { data, error } = await getContentGenerationHelper({
        testType,
        section: section.id,
        level: difficulty,
        language
      });
      
      if (error || !data) {
        throw new Error(error?.message || 'Content generation failed');
      }
      
      return data;




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
      const language = currentUser.test_language;
      const difficulty = currentUser[`${section.id}_level`] || 'A1';
      let weakSpotsData = null;

      // Add loading timeout alert for speaking
      let timeoutAlert = null;
      if (section.id === 'speaking') {
        timeoutAlert = setTimeout(() => {
          console.log("Speaking practice is taking longer than expected, still generating...");
        }, 20000); // Show message after 20 seconds
      }

      // Fetch weak spots for writing section
      if (section.id === 'writing') {
        try {
          const { data } = await getWritingWeakSpots();
          if (data && data.weakSpots) {
            weakSpotsData = data;
          }
        } catch (error) {
          console.log('Could not fetch weak spots for writing, continuing without:', error);
        }
      }

      // Retry logic for AI generation (up to 3 attempts)
      let generatedContent = null;
      let lastError = null;
      const maxRetries = 3;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`AI generation attempt ${attempt}/${maxRetries}...`);
          generatedContent = await generateQuickPractice(section, language, difficulty);

          if (generatedContent && (generatedContent.questions || generatedContent.tasks)) {
            console.log('AI generation successful!');
            break; // Success - exit retry loop
          } else {
            throw new Error("Generated content is invalid or missing required fields");
          }
        } catch (error) {
          lastError = error;
          console.error(`AI generation attempt ${attempt} failed:`, error);
          
          if (attempt < maxRetries) {
            console.log(`Retrying in ${attempt} second(s)...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          }
        }
      }

      if (timeoutAlert) clearTimeout(timeoutAlert);

      if (!generatedContent) {
        // All retries failed
        console.error("All AI generation attempts failed:", lastError);
        toast({
          title: "Practice Generation Failed",
          description: "We couldn't generate your personalized practice. Please try again or choose a different section.",
          variant: "destructive",
          duration: 5000,
        });
        setActiveSection(null);
        setIsLoadingExam(false);
        return;
      }

        // For speaking, we don't need audio generation like listening
        if (section.id === 'listening' && generatedContent?.audio_script) {
          try {
            const { data: audioData } = await generateSpeech({
              text_to_speak: generatedContent.audio_script,
              language
            });
            if (audioData.status === 'success') {
              generatedContent.audio_base64 = audioData.audio_base64;
            } else {
              throw new Error(audioData.message || 'Failed to generate speech.');
            }
          } catch (audioError) {
            console.error("Failed to pre-generate audio:", audioError);
            toast({
              title: "Audio Generation Failed",
              description: `There was an issue generating the audio: ${audioError.message}. Please try again.`,
              variant: "destructive",
              duration: 5000,
            });
            setActiveSection(null);
            setIsLoadingExam(false);
            return;
          }
        }

      // Set the practice session with AI-generated content
      setActiveExam({
        section: section.id,
        language: language,
        difficulty: difficulty,
        content: JSON.stringify(generatedContent),
        is_practice: true,
        source: 'ai',
        practiceId: null,
        weak_spots: weakSpotsData || null,
        testType: testConfig?.test_name || 'YKI'
      });
      setPracticeReady(true);
    } catch (error) {
      console.error("Error starting practice:", error);
      toast({
        title: "Practice Preparation Error",
        description: "An error occurred while preparing your practice session. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
      setActiveSection(null);
      setIsLoadingExam(false);
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
              toast({
                title: "Level Advanced!",
                description: `You've been advanced to level ${newLevel} for ${sectionId}!`,
                duration: 5000,
              });
              currentUser = await User.me(); // Refresh user again
            } else {
              toast({
                title: "Staying at Current Level",
                description: "No problem, you can keep practicing at your current level.",
                duration: 5000,
              });
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
        toast({
          title: "Progress Update Issue",
          description: "Practice completed but there was an issue updating your progress. Your session was still saved.",
          variant: "destructive",
          duration: 5000,
        });
      }

      // FIXED: Add try-catch around achievements check
      try {
        await checkAndAwardAchievements(currentUser);
      } catch (achievementError) {
        console.error('Error checking achievements:', achievementError);
        // Don't throw here - not critical
      }

      // Calculate readiness score after practice completion
      try {
        await calculateReadinessScore({
          userId: currentUser.id,
          userEmail: currentUser.email
        });
      } catch (readinessError) {
        console.error('Error calculating readiness score:', readinessError);
        // Don't throw here - not critical
      }

      // Success message
      const scoreValue = typeof sessionData.score === 'number' ? sessionData.score : 0;
      let message = `Your score is ${scoreValue}%.`;
      const passedText = practiceId && shouldMarkAsPassed ? "This practice has been marked as completed and won't appear again." : "Keep practicing to improve your score!";
      message += ` ${passedText}`;

      const finalCurrentLevel = currentUser[`${sessionData.section}_level`] || 'A1';
      let bonusMessage = '';
      if (scoreValue >= 90) {
        const currentIndex = difficultyLevels.indexOf(finalCurrentLevel);
        if (currentIndex < difficultyLevels.length - 1) {
          bonusMessage = `Excellent! You're doing great at level ${finalCurrentLevel}. If you feel ready for a bigger challenge, you can change your level in the Settings page.`;
        } else {
          bonusMessage = `Perfect score! You're already at the highest level (${finalCurrentLevel}) for this section!`;
        }
      }

      setCompletionDialog({
        score: scoreValue,
        message: String(message),
        bonusMessage: String(bonusMessage)
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
      toast({
        title: "Save Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
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

          {practiceReady &&
            <div className="mt-8 flex justify-center">
              <Button size="lg" onClick={() => setIsLoadingExam(false)} className="bg-green-600 hover:bg-green-700">
                <Play className="w-5 h-5 mr-2" />
                Start Practice
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
      <ErrorBoundary
        title="Practice Session Error"
        description="There was a problem loading your practice session. Please try again."
        onReset={handlePracticeCancel}
      >
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8">
          <QuickPracticeSession
            section={activeSection}
            exam={activeExam}
            onComplete={(sessionData, markAsCompleted) => handlePracticeComplete(sessionData, activeExam.practiceId, markAsCompleted)}
            onCancel={handlePracticeCancel} />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <>
      <div className="mx-auto p-4 md:p-8 max-w-7xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quick Practice</h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Build your skills with focused, untimed practice sessions. Each practice has 4-6 questions tailored to your level.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Badge variant="secondary" className="text-sm">
              {testConfig?.display_name || 'Language Test'}
            </Badge>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-500" />
              <Badge variant="outline" className="text-sm">Untimed Practice</Badge>
            </div>
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
                      <CardTitle className="text-xl">{String(section.title)}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">Level {String(userLevel)}</Badge>
                        <Badge variant="outline" className="text-xs">{String(section.questions)}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Practice your {String(section.title).toLowerCase()} skills with targeted exercises designed for your current level.</p>
                  <Button
                    onClick={() => startPractice(section)}
                    className={`w-full bg-gradient-to-r ${section.color} hover:opacity-90 text-white shadow-lg group-hover:scale-105 transition-transform`}
                    disabled={isLoadingExam}
                    aria-label={`Start ${section.title} practice at level ${userLevel}`}>
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
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-6 h-6 text-green-600" />
              <DialogTitle className="text-2xl font-bold">Practice Completed!</DialogTitle>
            </div>
            <DialogDescription>
              Review your practice results below.
            </DialogDescription>
          </DialogHeader>
          {completionDialog && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  {typeof completionDialog.score === 'number' ? completionDialog.score : 0}%
                </div>
                <p className="text-gray-600">
                  {typeof completionDialog.message === 'string' ? completionDialog.message : 'Practice completed!'}
                </p>
              </div>
              {completionDialog.bonusMessage && typeof completionDialog.bonusMessage === 'string' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">{completionDialog.bonusMessage}</p>
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