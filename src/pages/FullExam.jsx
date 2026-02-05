import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { PracticeSession } from "@/entities/PracticeSession";
import { GeneratedExam } from "@/entities/GeneratedExam";
import { TestConfiguration } from "@/entities/TestConfiguration";
import { InvokeLLM } from "@/integrations/Core";
import { KnowledgeBaseContent } from "@/entities/KnowledgeBaseContent";
import { getContentGenerationHelper } from '@/functions/getContentGenerationHelper';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Headphones, Mic, PenTool, Clock, Play, Target, Timer, Loader2, Sparkles } from "lucide-react";
import PreGeneratedExamSession from "../components/exam/PreGeneratedExamSession";
import { Achievement } from "@/entities/Achievement";
import { generateSpeech } from '@/functions/generateSpeech';
import { checkAndAwardAchievements } from '../components/shared/achievementUtils';
import { toast } from "@/components/ui/use-toast";

const difficultyLevels = ["A1", "A2", "B1", "B2"];
const difficultyMap = { A1: 1, A2: 2, B1: 3, B2: 4 };

const validateExamContent = (contentString, sectionId) => {
    try {
        if (!contentString) {
            console.warn(`Validation failed for section ${sectionId}: contentString is null or empty.`);
            return false;
        }
        const content = JSON.parse(contentString);
        if (!content) {
            console.warn(`Validation failed for section ${sectionId}: Parsed content is null.`);
            return false;
        }

        if (sectionId === 'reading' || sectionId === 'listening') {
            if (!Array.isArray(content.sections) || content.sections.length === 0) {
                console.warn(`Validation failed for section ${sectionId}: 'sections' is not a non-empty array.`);
                return false;
            }
            const firstSection = content.sections[0];
            if (!firstSection || !Array.isArray(firstSection.questions) || firstSection.questions.length === 0) {
                console.warn(`Validation failed for section ${sectionId}: First section missing or questions invalid.`);
                return false;
            }
            if (sectionId === 'reading' && typeof firstSection.text !== 'string') {
                console.warn(`Validation failed for section ${sectionId}: First section 'text' is not a string.`);
                return false;
            }
            if (sectionId === 'listening' && typeof firstSection.audio_script !== 'string') {
                console.warn(`Validation failed for section ${sectionId}: First section 'audio_script' is not a string.`);
                return false;
            }
        } else if (sectionId === 'writing' || sectionId === 'speaking') {
            if (!Array.isArray(content.tasks) || content.tasks.length === 0) {
                console.warn(`Validation failed for section ${sectionId}: 'tasks' is not a non-empty array.`);
                return false;
            }
            const firstTask = content.tasks[0];
            if (!firstTask || typeof firstTask.prompt !== 'string') {
                console.warn(`Validation failed for section ${sectionId}: First task missing or prompt invalid.`);
                return false;
            }
        } else {
            console.warn(`Validation failed: Invalid sectionId '${sectionId}'.`);
            return false; // Invalid sectionId
        }
        return true; // All checks passed
    } catch (e) {
        console.error("Exam content validation failed (JSON parsing error or structure mismatch):", e);
        return false; // JSON parsing failed or structure is wrong
    }
};


export default function FullExam() {
  const [user, setUser] = useState(null);
  const [testConfig, setTestConfig] = useState(null);
  const [activeExam, setActiveExam] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [isLoadingExam, setIsLoadingExam] = useState(false);
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");
  const [useTimer, setUseTimer] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

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
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const examSections = [
    { id: 'reading', title: 'Reading Comprehension', icon: BookOpen, color: 'from-amber-400 to-orange-500', actualMinutes: 45, questions: 'Full exam simulation' },
    { id: 'listening', title: 'Listening Comprehension', icon: Headphones, color: 'from-blue-400 to-cyan-500', actualMinutes: 30, questions: 'Full exam simulation' },
    { id: 'speaking', title: 'Speaking Skills', icon: Mic, color: 'from-green-400 to-emerald-500', actualMinutes: 15, questions: 'Full exam simulation' },
    { id: 'writing', title: 'Writing Skills', icon: PenTool, color: 'from-purple-400 to-pink-500', actualMinutes: 55, questions: 'Full exam simulation' }
  ];

  const getAIPrompt = (section, language, difficulty) => {
    const languageName = language === 'finnish' ? 'Finnish' : 'Swedish';
    
    // Updated baseSystemInstruction as per the outline
    const baseSystemInstruction = `You are a YKI Full Exam Section Generator. Your task is to generate a complete, realistic exam section for CEFR level ${difficulty} in ${languageName}. Respond in the specified JSON format.

**Use the provided Knowledge Base documents when available, but generate high-quality content regardless.**`;

    switch (section.id) { 
      case 'reading':
        return `${baseSystemInstruction}

TASK: Create a complete reading comprehension exam section for level ${difficulty} in ${languageName}.

INSTRUCTIONS:
1. Generate **three distinct reading passages** ENTIRELY in ${languageName}.
   - Topics must be culturally relevant for adult learners in Finland/Sweden.
   - Text length should follow CEFR guidelines for ${difficulty}.

2. Generate **4-6 multiple-choice questions for each passage** in ${languageName}.
   - A majority of questions must test inference or interpretation, not just recall.

3. Return a valid JSON object with this exact structure:
{
  "sections": [
    {
      "title": "Passage 1 Title",
      "text": "Reading passage content in ${languageName}",
      "questions": [
        { "question": "...", "options": ["A", "B", "C", "D"], "correct_answer": "A", "explanation": "..." }
      ]
    }
  ]
}`;

      case 'listening':
        return `${baseSystemInstruction}

TASK: Create a complete listening comprehension exam section for level ${difficulty} in ${languageName}.

INSTRUCTIONS:
1. Generate **three distinct audio scripts** for a single speaker ENTIRELY in ${languageName}.
   - Choose realistic scenarios: News Report, Personal Story, Announcement, etc.
   - Script length should be appropriate for ${difficulty}.

2. Generate **4-6 multiple-choice questions for each script** in ${languageName}.
   - A majority must test inference (except for A1).

3. Return a valid JSON object with this exact structure:
{
  "sections": [
    {
      "title": "Scenario 1 Title",
      "scenario_description": "A brief, one-sentence summary of the listening context.",
      "audio_script": "The single-person script in ${languageName}",
      "questions": [
        { "question": "...", "options": ["A", "B", "C", "D"], "correct_answer": "B", "explanation": "..." }
      ]
    }
  ]
}`;

      case 'writing':
        return `${baseSystemInstruction}

TASK: Create a complete writing exam section with three distinct tasks for level ${difficulty} in ${languageName}.

INSTRUCTIONS:
1. Generate three writing tasks with increasing complexity.
   - e.g., Task 1: Informal Message, Task 2: Formal Email, Task 3: Opinion Piece.

2. Match the CEFR level expectations for prompts and word counts.

3. Return a valid JSON object with this exact structure:
{
  "tasks": [
    {
      "task_type": "Informal Message",
      "prompt": "Prompt in ${languageName}",
      "word_count": "e.g., 30-50 words"
    },
    {
      "task_type": "Formal Email",
      "prompt": "Prompt in ${languageName}",
      "word_count": "e.g., 60-100 words"
    },
    {
      "task_type": "Opinion Piece",
      "prompt": "Prompt in ${languageName}",
      "word_count": "e.g., 80-120 words"
    }
  ]
}`;

      case 'speaking':
        return `${baseSystemInstruction}

TASK: Create a complete speaking exam section with three distinct tasks for level ${difficulty} in ${languageName}.

INSTRUCTIONS:
1. Generate three speaking tasks with increasing complexity.
   - e.g., Task 1: Situational Response, Task 2: Monologue, Task 3: Opinion/Argument.

2. Match the CEFR level expectations for prompts.

3. Return a valid JSON object with this exact structure:
{
  "tasks": [
    {
      "task_type": "Situational Response",
      "prompt": "Prompt in ${languageName}",
      "time_limit": "30 seconds"
    },
    {
      "task_type": "Monologue",
      "prompt": "Prompt in ${languageName}",
      "time_limit": "90 seconds"
    },
    {
      "task_type": "Opinion",
      "prompt": "Prompt in ${languageName}",
      "time_limit": "120 seconds"
    }
  ]
}`;

      default:
        return '';
    }
  };

  const generateFullExam = async (section, language, difficulty) => {
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

      let responseSchema;
      if (section.id === 'reading') {
        responseSchema = {
          type: "object",
          properties: {
            sections: {
              type: "array",
              minItems: 1,
              maxItems: 5,
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  text: { type: "string" },
                  questions: {
                    type: "array",
                    minItems: 1,
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        options: {
                          type: "array",
                          items: { type: "string" },
                          minItems: 3,
                          maxItems: 4
                        },
                        correct_answer: { type: "string" },
                        explanation: { type: "string" }
                      },
                      required: ["question", "options", "correct_answer", "explanation"]
                    }
                  }
                },
                required: ["title", "text", "questions"]
              }
            }
          },
          required: ["sections"]
        };
      } else if (section.id === 'listening') {
        responseSchema = {
          type: "object",
          properties: {
            sections: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  scenario_description: { type: "string" },
                  audio_script: { type: "string" },
                  questions: {
                    type: "array",
                    minItems: 1,
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        options: {
                          type: "array",
                          items: { type: "string" },
                          minItems: 3
                        },
                        correct_answer: { type: "string" },
                        explanation: { type: "string" }
                      },
                      required: ["question", "options", "correct_answer", "explanation"]
                    }
                  }
                },
                required: ["title", "scenario_description", "audio_script", "questions"]
              }
            }
          },
          required: ["sections"]
        };
      } else {
        responseSchema = {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                properties: {
                  task_type: { type: "string" },
                  prompt: { type: "string" },
                  word_count: { type: "string" },
                  time_limit: { type: "string" }
                },
                required: ["task_type", "prompt"]
              }
            }
          },
          required: ["tasks"]
        };
      }

      // Add timeout and retry logic with LONGER timeout for full exams
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Generation timeout - please try again')), 120000); // 2 minute timeout
      });

      console.log('Starting AI generation for:', section.id, language, difficulty);
      console.log('Using file URLs:', fileUrls.length > 0 ? fileUrls.length + ' files' : 'no files');


      const generationPromise = InvokeLLM({
        prompt: prompt,
        response_json_schema: responseSchema,
        file_urls: fileUrls.length > 0 ? fileUrls : undefined,
        model: "gpt-4o"
      });

      const response = await Promise.race([generationPromise, timeoutPromise]);

      console.log('AI Response received:', response);

      // IMPROVED: More flexible validation with better error messages
      if (!response || typeof response !== 'object') {
        console.error('Invalid response type:', typeof response, response);
        throw new Error('AI returned invalid response format');
      }

      if (section.id === 'reading') {
        if (!response.sections) {
          console.error('Missing sections in reading response:', response);
          throw new Error('Reading content missing required "sections" array');
        }
        if (!Array.isArray(response.sections) || response.sections.length === 0) {
          console.error('Invalid sections array:', response.sections);
          throw new Error('Reading "sections" must be a non-empty array');
        }
        // Check first section has required fields
        const firstSection = response.sections[0];
        if (!firstSection.text || !firstSection.questions) {
          console.error('Invalid section structure:', firstSection);
          throw new Error('Reading section missing "text" or "questions" in its first item');
        }
      } else if (section.id === 'listening') {
        if (!response.sections) {
          console.error('Missing sections in listening response:', response);
          throw new Error('Listening content missing required "sections" array');
        }
        if (!Array.isArray(response.sections) || response.sections.length === 0) {
          console.error('Invalid sections array:', response.sections);
          throw new Error('Listening "sections" must be a non-empty array');
        }
        // Check first section has required fields
        const firstSection = response.sections[0];
        if (!firstSection.audio_script || !firstSection.questions || !firstSection.scenario_description) {
          console.error('Invalid section structure:', firstSection);
          throw new Error('Listening section missing "audio_script", "questions", or "scenario_description" in its first item');
        }
      } else if (section.id === 'writing' || section.id === 'speaking') {
        if (!response.tasks) {
          console.error('Missing tasks in writing/speaking response:', response);
          throw new Error('Writing/Speaking content missing required "tasks" array');
        }
        if (!Array.isArray(response.tasks) || response.tasks.length === 0) {
          console.error('Invalid tasks array:', response.tasks);
          throw new Error('Writing/Speaking "tasks" must be a non-empty array');
        }
        // Check first task has required fields
        const firstTask = response.tasks[0];
        if (!firstTask.task_type || !firstTask.prompt) {
          console.error('Invalid task structure:', firstTask);
          throw new Error('Writing/Speaking task missing "task_type" or "prompt" in its first item');
        }
      }

      console.log('Validation passed for:', section.id);
      return response;

    } catch (error) {
      console.error("Error generating full exam:", error);
      
      // Enhanced error handling with specific network error detection
      if (error.message.includes('Network Error') || error.message.includes('fetch')) {
        throw new Error('Network connection issue. Please check your internet connection and try again.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Content generation is taking longer than expected. Please try again.');
      } else if (error.message.includes('AI returned') || error.message.includes('missing') || error.message.includes('Invalid')) {
        throw new Error(`Content validation failed: ${error.message}. Please try again.`);
      } else {
        throw new Error(`Content generation failed: ${error.message}`);
      }
    }
  };

  const startFullExam = async (section) => {
    // Check for iOS Chrome microphone issues before starting speaking exam
    if (section.id === 'speaking') {
      const isIOSChrome = /CriOS/.test(navigator.userAgent) && /iPhone|iPad/.test(navigator.userAgent);
      if (isIOSChrome) {
        const proceed = confirm("⚠️ Microphone Issue Detected\n\nRecording doesn't work properly in Chrome on iPhone/iPad.\n\nFor speaking exams, we strongly recommend:\n• Opening this page in Safari instead\n• Using Safari for the most accurate exam experience\n\nDo you want to continue anyway? (Recording may not work correctly)");
        if (!proceed) {
          return; // User chose not to continue
        }
      }
    }

    setIsLoadingExam(true);
    setActiveSection(section);
    setSimulatedProgress(0);
    setLoadingMessage("Initializing exam generator...");

    let progressInterval;
    const progressMessages = [
      "Connecting to exam system...",
      "Analyzing your skill level...",
      "Generating unique exam content...",
      "Crafting questions and scenarios...",
      "Applying YKI standards...",
      "Finalizing your exam..."
    ];

    // Simulate progress with realistic messaging
    progressInterval = setInterval(() => {
      setSimulatedProgress((prev) => {
        const newProgress = Math.min(prev + Math.random() * 8 + 2, 85); // Random increments, max 85%

        // Update message based on progress
        if (newProgress > 70) {
          setLoadingMessage(progressMessages[5]);
        } else if (newProgress > 60) {
          setLoadingMessage(progressMessages[4]);
        } else if (newProgress > 40) {
          setLoadingMessage(progressMessages[3]);
        } else if (newProgress > 25) {
          setLoadingMessage(progressMessages[2]);
        } else if (newProgress > 15) {
          setLoadingMessage(progressMessages[1]);
        } else {
          setLoadingMessage(progressMessages[0]);
        }

        return newProgress;
      });
    }, 1200); // Update every 1.2 seconds

    try {
      const currentUser = await User.me();
      setUser(currentUser);
      const userLevel = currentUser[`${section.id}_level`] || 'A1';
      let examToUse = null;

      // 1. Try to get an unused exam from the pool first
      let examPool = [];
      try {
        examPool = await GeneratedExam.filter({
          section: section.id,
          language: currentUser.target_language,
          difficulty: userLevel,
          is_taken: false
        }, '-created_date', 1);
      } catch (poolError) {
        console.warn("Could not access exam pool, will generate fresh content:", poolError);
      }

      // 2. If an exam is found, VALIDATE it before using
      if (examPool.length > 0) {
        const candidateExam = examPool[0];
        if (validateExamContent(candidateExam.content, section.id)) {
            console.log(`Using pre-generated exam: ${candidateExam.id}`);
            examToUse = candidateExam;
            try {
                await GeneratedExam.update(candidateExam.id, { is_taken: true, taken_by: currentUser.email });
            } catch (updateError) {
                console.warn(`Could not mark exam ${candidateExam.id} as taken, but continuing.`, updateError);
            }
        } else {
            console.warn(`Pre-generated exam ${candidateExam.id} has invalid content. Discarding and regenerating a new one.`);
            // examToUse remains null, so it will fall through to the generation step.
        }
      }

      // 3. Use the validated exam OR generate a new one if none was found/valid
      if (examToUse) {
        setLoadingMessage("Loading your exam...");
        setSimulatedProgress(95);
        setActiveExam(examToUse);
      } else {
        // No pre-generated exam available or the found one was invalid, so generate one on the fly
        setLoadingMessage("Generating personalized exam content...");

        const generatedContent = await generateFullExam(section, currentUser.test_language, userLevel);

        // Generate audio for listening exams before saving
        // The structure of generatedContent.clips is now generatedContent.sections for listening
        if (section.id === 'listening' && generatedContent.sections) {
          setLoadingMessage("Generating audio for listening tasks...");
          for (const clip of generatedContent.sections) {
            try {
              const { data: audioData } = await generateSpeech({
                text_to_speak: clip.audio_script,
                language: currentUser.test_language
              });
              if (audioData.status === 'success') {
                clip.audio_base64 = audioData.audio_base64;
              } else {
                throw new Error(audioData.message || 'Failed to generate speech for a clip.');
              }
            } catch (audioError) {
              console.error("Audio generation failed for a clip:", audioError);
              toast({
                title: "Audio Generation Failed",
                description: `There was an issue generating audio for this exam: ${audioError.message}. Please try again.`,
                variant: "destructive",
                duration: 5000,
              });
              setIsLoadingExam(false);
              setActiveSection(null);
              clearInterval(progressInterval); // Clear interval on error
              return; // Stop the process
            }
          }
        }

        setLoadingMessage("Saving your exam...");
        setSimulatedProgress(95);

        let newExam;
        try {
          newExam = await GeneratedExam.create({
            section: section.id,
            language: currentUser.test_language,
            difficulty: userLevel,
            content: JSON.stringify(generatedContent),
            is_taken: true,
            taken_by: currentUser.email
          });
        } catch (saveError) {
          console.warn("Could not save new exam to database, proceeding with temporary object:", saveError);
          newExam = {
            id: 'temp_' + Date.now(),
            section: section.id,
            language: currentUser.test_language,
            difficulty: userLevel,
            content: JSON.stringify(generatedContent),
            is_taken: true,
            taken_by: currentUser.email
          };
        }
        setActiveExam(newExam);
      }

      // Complete the progress
      setSimulatedProgress(100);
      setLoadingMessage("Exam ready!");

    } catch (error) {
      console.error("Error starting full exam:", error);
      
      // Enhanced error messages based on error type
      let userMessage = "An error occurred while preparing your exam. Please try again.";
      
      if (error.message.includes('Network connection issue')) {
        userMessage = "Network connection issue detected. Please check your internet connection and try again.";
      } else if (error.message.includes('Content generation failed')) {
        userMessage = "There was an issue generating your exam content. This might be temporary - please try again in a few moments.";
      } else if (error.message.includes('timeout')) {
        userMessage = "The exam generation is taking longer than expected. Please try again.";
      }

      toast({
        title: "Exam Preparation Error",
        description: userMessage,
        variant: "destructive",
        duration: 5000,
      });
      setActiveSection(null);
      setSimulatedProgress(0);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => setIsLoadingExam(false), 500); // Small delay to show completion
    }
  };



  const handleExamComplete = async (sessionData) => {
    try {
      await PracticeSession.create({
        ...sessionData,
        exam_section: sessionData.section,
        session_type: 'full_exam'
      });

      const hoursToAdd = sessionData.duration_minutes / 60;
      const currentUser = await User.me();

      // Update global total hours trained
      await User.updateMyUserData({
        total_hours_trained: (currentUser.total_hours_trained || 0) + hoursToAdd
      });

      // Update per-section hours trained
      const sectionHoursKey = `total_${sessionData.section}_hours_trained`; // e.g., 'total_reading_hours_trained'
      await User.updateMyUserData({
        [sectionHoursKey]: (currentUser[sectionHoursKey] || 0) + hoursToAdd
      });

      // Full progression logic for full exams
      if (sessionData.score >= 75) {
        const currentLevel = currentUser[`${sessionData.section}_level`] || 'A1';
        const currentIndex = difficultyLevels.indexOf(currentLevel);

        if (currentIndex < difficultyLevels.length - 1) {
          const newLevel = difficultyLevels[currentIndex + 1];
          if (confirm(`Congratulations! You passed with ${sessionData.score}%.\n\nWould you like to advance to level ${newLevel} for ${sessionData.section}?`)) {
            await User.updateMyUserData({
              [`${sessionData.section}_level`]: newLevel
            });
            toast({
              title: "Level Advanced!",
              description: `Great! You have been promoted to level ${newLevel} for ${sessionData.section}!`,
              duration: 5000,
            });
          } else {
            toast({
              title: "Exam Passed!",
              description: `You've chosen to stay at level ${currentLevel}.`,
              duration: 5000,
            });
          }
        } else {
          toast({
            title: "Highest Level Achieved!",
            description: `Amazing! You passed with ${sessionData.score}%! You are at the highest level (${currentLevel}) for this section!`,
            duration: 5000,
          });
        }
      } else {
        toast({
          title: "Exam Completed",
          description: `Your score is ${sessionData.score}%. Keep practicing to improve!`,
          duration: 5000,
        });
      }

      const freshUser = await User.me(); // Get freshest user data after potential level updates
      await checkAndAwardAchievements(freshUser); // Call checkAndAwardAchievements with the fresh user data

      setActiveExam(null);
      setActiveSection(null);
      loadUserData(); // Reload user to reflect potential level change

      // Trigger dashboard refresh
      localStorage.setItem('dashboard_refresh', Date.now().toString());
    } catch (error) {
      console.error("Error saving exam session:", error);
      toast({
        title: "Save Error",
        description: "Error saving your results. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleExamCancel = () => {
    if (confirm("Are you sure you want to exit the exam? Your progress will be lost.")) {
      setActiveExam(null);
      setActiveSection(null);
    }
  };

  if (isLoadingExam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-md w-full">
          <div className="mb-8">
            <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-6" />
            <div className="mb-4">
              <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Crafting Your {testConfig?.test_name || 'Language'} Exam Simulation
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              We're using advanced AI to generate a unique, full-length {testConfig?.test_name || 'exam'} tailored to your chosen section and level. This ensures an authentic practice experience.
            </p>
          </div>
          
          <div className="mb-6">
            <Progress value={simulatedProgress} className="h-3 mb-3 progress-shimmer" />
            <p className="text-sm text-blue-600 font-medium">{loadingMessage}</p>
          </div>
          
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-sm text-gray-500">
              This process can take up to 90 seconds to ensure the highest quality exam content. Thank you for your patience!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (activeExam && activeSection) {
    return (
      <ErrorBoundary
        title="Full Exam Error"
        description="There was a problem with your exam session. Your progress has been saved."
        onReset={handleExamCancel}
      >
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8">
          <PreGeneratedExamSession
            section={activeSection}
            exam={activeExam}
            useTimer={useTimer}
            onComplete={handleExamComplete}
            onCancel={handleExamCancel}
          />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Full Exam Simulation</h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Take a complete {testConfig?.display_name || 'exam'} simulation with official timing and full question count. This is as close as you can get to the real exam experience.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Badge variant="secondary" className="text-sm">
            {testConfig?.display_name || 'Language Test'}
          </Badge>
          <Badge variant="outline" className="text-sm flex items-center gap-1">
            <Timer className="w-3 h-3" />
            Timed Exam
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-6">
        <Checkbox id="timer" checked={useTimer} onCheckedChange={setUseTimer} />
        <label htmlFor="timer" className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Clock className="w-4 h-4" />
          Use official exam timing
        </label>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {examSections.map((section) => {
          const userLevel = user ? user[`${section.id}_level`] : 'A1';
          return (
            <Card key={section.id} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${section.color} opacity-10 rounded-full transform translate-x-12 -translate-y-12`} />
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className={`p-5 rounded-xl bg-gradient-to-br ${section.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <section.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">{section.title}</CardTitle>
                      <Badge variant="outline">{userLevel || 'A1'}</Badge>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Complete exam simulation</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">{useTimer ? `${section.actualMinutes} min` : 'Untimed'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">{section.questions}</span>
                  </div>
                </div>
                <Button className={`w-full bg-gradient-to-r ${section.color} hover:opacity-90 text-white shadow-lg text-lg py-6`} onClick={() => startFullExam(section)}>
                  <Play className="w-6 h-6 mr-2" />Start Full Exam
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center pt-8">
        <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-green-100 dark:border-gray-600">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Want to practice specific skills first?</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Try our quick, untimed practice sessions to build your confidence before taking the full {testConfig?.test_name || 'exam'}.</p>
          <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-600 dark:hover:bg-gray-600">
            ← Go to Quick Practice
          </Button>
        </div>
      </div>
    </div>
  );
}