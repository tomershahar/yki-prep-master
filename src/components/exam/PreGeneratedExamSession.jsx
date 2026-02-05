
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Added CardDescription import for consistency with outline
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Clock, CheckCircle, ArrowRight, ArrowLeft, Loader2, Sparkles, Mic, Square } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { InvokeLLM } from "@/integrations/Core";
import { KnowledgeBaseContent } from "@/entities/KnowledgeBaseContent";
import ExamSummary from './ExamSummary';
import AudioPlayer from './AudioPlayer';
import { transcribeAudio } from '@/functions/transcribeAudio';
import InlineTranslator from '../shared/InlineTranslator';
import { toast } from "@/components/ui/use-toast";

const gradeSpeakingWithAI = async (task, transcribedResponse, difficulty) => {
    const knowledgeFiles = await KnowledgeBaseContent.list();
    const fileUrls = knowledgeFiles.map(file => file.file_url);

    const prompt = `You are a certified YKI speaking examiner with extensive experience in assessing Finnish/Swedish language proficiency. Your task is to evaluate a learner's transcribed spoken response for the YKI exam at the ${difficulty} level using a detailed, official YKI-aligned speaking assessment rubric.

**ASSESSMENT CONTEXT:**
- **Speaking prompt:** "${task.prompt}"
- **Transcribed user response:** "${transcribedResponse}"
- **Target CEFR level:** ${difficulty}

**CRITICAL: Use this detailed YKI-aligned scoring rubric. Evaluate each dimension on a 0-2 point scale:**

**1. TASK FULFILLMENT & CONTENT (40% weight)**
   - **2 points (Excellent):** Fully and confidently addresses all parts of the prompt. Content is rich, relevant, and well-developed for the ${difficulty} level.
   - **1 point (Sufficient):** Addresses the main aspects of the prompt. Content is mostly relevant but may lack depth or detail.
   - **0 points (Insufficient):** Fails to address the prompt adequately. Content is minimal, irrelevant, or shows poor understanding.

**2. COHERENCE & FLUENCY (30% weight)**
   - **2 points (Excellent):** Speech is fluent and logically organized. Ideas are connected smoothly with appropriate transitions for the ${difficulty} level. Minimal hesitation.
   - **1 point (Sufficient):** Generally coherent with a logical flow. Some hesitation or awkward connections, but communication is maintained.
   - **0 points (Insufficient):** Disjointed and difficult to follow. Frequent hesitations and false starts severely impede communication.

**3. GRAMMAR & SENTENCE STRUCTURE (15% weight)**
   - **2 points (Excellent):** Consistently high grammatical accuracy. Uses a variety of sentence structures appropriate for the ${difficulty} level.
   - **1 point (Sufficient):** Shows reasonable control of grammar. Makes some errors, especially with more complex structures, but meaning is clear.
   - **0 points (Insufficient):** Frequent grammatical errors that obscure meaning. Relies on very simple structures.

**4. VOCABULARY & PRONUNCIATION (inferred from text) (15% weight)**
   - **2 points (Excellent):** Uses a good range of vocabulary accurately and appropriately for the ${difficulty} level. Word choice is precise.
   - **1 point (Sufficient):** Uses adequate vocabulary for the task. May have some repetition or imprecise word choices, but communication is effective.
   - **0 points (Insufficient):** Very limited vocabulary. Frequent errors in word choice that impede understanding.

**SCORING LOGIC:**
- First, assign 0-2 points for each of the 4 dimensions to create a score out of 8.
- Convert this to a 0-100 scale.
- Estimate the CEFR level based on the overall performance.

**Your output MUST be in the following JSON format:**
{
  "scores": { "communicative_ability": <0-2>, "coherence": <0-2>, "vocabulary": <0-2>, "grammar": <0-2> },
  "total_score": <sum of scores from 0–8>,
  "feedback": {
    "strengths": "<Specific, constructive feedback on what the user did well, referencing the rubric criteria.>",
    "weaknesses": "<Specific, constructive feedback on areas for improvement, referencing the rubric criteria.>"
  },
  "cefr_level": "<Estimated CEFR Level (e.g., A2, B1.1, B1.2)>"
}`;

    const response = await InvokeLLM({
      prompt: prompt,
      file_urls: fileUrls,
      response_json_schema: {
        type: "object",
        properties: {
          scores: {
            type: "object",
            properties: {
              communicative_ability: { type: "integer", minimum: 0, maximum: 2 },
              coherence: { type: "integer", minimum: 0, maximum: 2 },
              vocabulary: { type: "integer", minimum: 0, maximum: 2 }
              ,
              grammar: { type: "integer", minimum: 0, maximum: 2 }
            },
            required: ["communicative_ability", "coherence", "vocabulary", "grammar"]
          },
          total_score: { type: "integer", minimum: 0, maximum: 8 },
          feedback: {
            type: "object",
            properties: {
              strengths: { type: "string" },
              weaknesses: { type: "string" }
            },
            required: ["strengths", "weaknesses"]
          },
          cefr_level: { type: "string" }
        },
        required: ["scores", "total_score", "feedback", "cefr_level"]
      }
    });

    return response;
};

export default function PreGeneratedExamSession({ section, exam, useTimer, onComplete, onCancel }) {
  const [examContent, setExamContent] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentSubQuestionIndex, setCurrentSubQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [userChoice, setUserChoice] = useState({});
  const [timeLeft, setTimeLeft] = useState(section.actualMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [scoreData, setScoreData] = useState(null);

  // New state for recording
  const [isRecording, setIsRecording] = useState({}); // {taskIndex: boolean}
  const mediaRecorderRef = useRef(null);
  const [recordedAudioURL, setRecordedAudioURL] = useState({}); // {taskIndex: string}
  const [isTranscribing, setIsTranscribing] = useState({}); // {taskIndex: boolean}
  const [transcriptionError, setTranscriptionError] = useState({}); // {taskIndex: string}
  const [recordingTime, setRecordingTime] = useState({}); // {taskIndex: number}
  // Kept useRef for recordingIntervalRef as it's more appropriate for interval IDs than useState
  const recordingIntervalRef = useRef(null);

  // NEW useEffect: Check for iOS Chrome microphone issues for speaking sections
  useEffect(() => {
    if (section.id === 'speaking') {
      const isIOSChrome = /CriOS/.test(navigator.userAgent) && /iPhone|iPad/.test(navigator.userAgent);
      if (isIOSChrome) {
        toast({
          title: "⚠️ Microphone Issue Detected",
          description: "Recording doesn't work properly in Chrome on iPhone/iPad.\n\nFor the best speaking practice experience, please:\n1. Open this page in Safari instead\n2. Or switch to Safari for speaking practice\n\nYou can continue, but recording may not work correctly.",
          variant: "destructive",
          duration: 8000,
        });
      }
    }
  }, [section.id]); // Dependency on section.id to trigger check when section changes.

  useEffect(() => {
    if (exam && exam.content) {
      try {
        const parsedContent = JSON.parse(exam.content);
        
        // NORMALIZATION STEP: Align AI output with component expectations.
        // The full exam generator creates a `sections` key.
        // This component was built expecting `parts` (for reading) and `clips` (for listening).
        // Let's normalize the data here to make them compatible.
        if (parsedContent.sections) {
            if (section.id === 'reading') {
                // Map `text` property to `content` for each section
                parsedContent.parts = parsedContent.sections.map(s => ({...s, content: s.text }));
            } else if (section.id === 'listening') {
                // Ensure a `scenario_description` exists and map to `clips`
                parsedContent.clips = parsedContent.sections.map(s => ({
                    ...s, 
                    scenario_description: s.scenario_description || s.title || "Listening task"
                }));
            }
            delete parsedContent.sections; // Clean up the original key
        }
        
        setExamContent(parsedContent);
      } catch (error) {
        console.error("Failed to parse or normalize exam content:", error);
        setExamContent(null);
      }
    }
  }, [exam, section.id]);

  useEffect(() => {
    if (useTimer && timeLeft > 0 && examContent && !showSummary) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleFinishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [useTimer, timeLeft, examContent, showSummary]);

  // Cleanup for recorder
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionIdentifier, answer) => {
    if (!showSummary) {
      setAnswers(prev => ({
        ...prev,
        [questionIdentifier]: answer
      }));
    }
  };

  const handleNext = () => {
    const mainItems = examContent?.parts || examContent?.clips || examContent?.tasks || [];
    const currentMainItem = mainItems[currentQuestion];
    
    let subQuestionsTotal = 1;
    if (section.id === 'reading' || section.id === 'listening') {
      subQuestionsTotal = currentMainItem?.questions?.length || 1;
    }

    if (currentSubQuestionIndex < subQuestionsTotal - 1) {
        setCurrentSubQuestionIndex(prev => prev + 1);
    } else if (currentQuestion < mainItems.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setCurrentSubQuestionIndex(0);
    }
  };

  const handlePrevious = () => {
    const mainItems = examContent?.parts || examContent?.clips || examContent?.tasks || [];
    
    if (currentSubQuestionIndex > 0) {
        setCurrentSubQuestionIndex(prev => prev - 1);
    } else if (currentQuestion > 0) {
        setCurrentQuestion(prev => prev - 1);
        const prevMainItem = mainItems[currentQuestion - 1];
        if (section.id === 'reading' || section.id === 'listening') {
          setCurrentSubQuestionIndex((prevMainItem?.questions?.length || 1) - 1);
        } else {
          setCurrentSubQuestionIndex(0);
        }
    }
  };
  
  // Recording Functions
  const handleStartRecording = async (taskIndex) => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
              mediaRecorderRef.current = recorder;

              let audioChunks = [];
              recorder.ondataavailable = event => {
                  audioChunks.push(event.data);
              };

              recorder.onstop = () => {
                  const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                  setRecordedAudioURL(prev => ({...prev, [taskIndex]: URL.createObjectURL(audioBlob) }));
                  
                  const reader = new FileReader();
                  reader.readAsDataURL(audioBlob);
                  reader.onloadend = async () => {
                      const base64Audio = reader.result;
                      callTranscribeApi(base64Audio, taskIndex);
                  };
                  audioChunks = [];
                  stream.getTracks().forEach(track => track.stop()); // Stop mic access
              };

              recorder.start();
              setIsRecording(prev => ({...prev, [taskIndex]: true}));
              setRecordingTime(prev => ({...prev, [taskIndex]: 0}));
              setRecordedAudioURL(prev => ({...prev, [taskIndex]: ''}));
              setTranscriptionError(prev => ({...prev, [taskIndex]: null}));
              handleAnswerChange(taskIndex, ""); // Clear previous transcription
              
              if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
              recordingIntervalRef.current = setInterval(() => {
                  setRecordingTime(prevTime => {
                      const newTime = (prevTime[taskIndex] || 0) + 1;
                      if (newTime >= 120) { // Max 2 minutes
                          handleStopRecording(taskIndex);
                          return {...prevTime, [taskIndex]: 120};
                      }
                      return {...prevTime, [taskIndex]: newTime};
                  });
              }, 1000);

          } catch (err) {
              console.error("Error accessing microphone:", err);
              toast({
                  title: "Microphone Access Denied",
                  description: "Could not access microphone. Please check your browser permissions.",
                  variant: "destructive",
                  duration: 5000,
              });
              setIsRecording(prev => ({...prev, [taskIndex]: false}));
              setTranscriptionError(prev => ({...prev, [taskIndex]: "Microphone access denied or error."}));
          }
      }
  };

  const handleStopRecording = (taskIndex) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
          setIsRecording(prev => ({...prev, [taskIndex]: false}));
          if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
          }
      }
  };

  const callTranscribeApi = async (base64Audio, taskIndex) => {
      setIsTranscribing(prev => ({...prev, [taskIndex]: true}));
      setTranscriptionError(prev => ({...prev, [taskIndex]: null}));
      try {
          const { data, error } = await transcribeAudio({ 
            audio_base64: base64Audio,
            language: exam.language,
          });

          if (error || (data && data.error)) {
            throw new Error(error?.message || data?.error || "Transcription failed.");
          }

          if (data && data.transcription !== undefined) {
              handleAnswerChange(taskIndex, data.transcription);
          } else {
              throw new Error("Invalid response from transcription service.");
          }
      } catch (err) {
          console.error("Transcription error:", err);
          setTranscriptionError(prev => ({...prev, [taskIndex]: "Could not transcribe audio. Please try again."}));
      } finally {
          setIsTranscribing(prev => ({...prev, [taskIndex]: false}));
      }
  };

  const gradeWritingWithAI = async (task, answer, difficulty, chosenPrompt) => {
    const knowledgeFiles = await KnowledgeBaseContent.list();
    const fileUrls = knowledgeFiles.map(file => file.file_url);
    let prompt;

    if (difficulty === 'B2') {
      prompt = `You are an expert certified YKI writing examiner. Your task is to grade a user's writing task using a highly nuanced and specific YKI writing rubric for level B2.

Refer explicitly to the following core criteria, derived from the official YKI framework:
1.  **Task Fulfillment & Communicative Ability**: How well the response addresses all parts of the complex prompt.
2.  **Coherence and Cohesion**: How logically structured and connected the text is.
3.  **Vocabulary Precision, Range, and Idiomaticity**: How effectively and precisely vocabulary is used.
4.  **Grammar Accuracy and Sentence Structure**: The range and accuracy of grammatical structures.

You will receive:
- The writing prompt: "${chosenPrompt || task.prompt}"
- The user's written answer: "${answer}"
- Reference knowledge base documents (YKI official PDF)

**CRITICAL B2 SCORING RUBRIC (0–2 points for each dimension):**

**1. Task Fulfillment:**
   - **2 points (Excellent)**: Fully addresses all explicit and implicit parts of the complex prompt. Presents a well-structured, persuasive argument with clear main points supported by relevant details and examples. Demonstrates higher-order thinking (e.g., analysis, synthesis, evaluation).
   - **1 point (Sufficient)**: Addresses the main topic but may miss some nuances of the prompt. The argument is present but may be underdeveloped, or the structure could be clearer.
   - **0 points (Insufficient)**: Fails to address the prompt adequately. Ideas are simplistic for B2 level, off-topic, or incoherent.

**2. Coherence and Cohesion:**
   - **2 points (Excellent)**: Uses a wide range of sophisticated cohesive devices and discourse markers effectively. The text flows logically and smoothly. Paragraphing is effective and enhances readability.
   - **1 point (Sufficient)**: Uses common cohesive devices correctly, but the range is limited. The text is generally understandable but may feel disjointed or mechanical in places.
   - **0 points (Insufficient)**: Lacks logical structure. The use of cohesive devices is minimal or incorrect, making the text difficult to follow.

**3. Vocabulary:**
   - **2 points (Excellent)**: Demonstrates a broad and precise lexical repertoire, including idiomatic expressions, collocations, and less common vocabulary appropriate for the topic. Shows strong awareness of register and connotation.
   - **1 point (Sufficient)**: Uses a good range of vocabulary for the topic but may lack precision or rely on more common words. Few to no errors in word choice that impede communication.
   - **0 points (Insufficient)**: Limited vocabulary range. Frequent errors in word choice that obscure meaning or make the text sound unnatural.

**4. Grammar & Sentence Structure:**
   - **2 points (Excellent)**: Consistently high degree of grammatical accuracy. Uses a wide range of complex structures (e.e.g., various clause types, passive voice, conditionals) with confidence and flexibility.
   - **1 point (Sufficient)**: Shows good control of grammar but may make non-systematic errors when attempting more complex structures. Sentence structures show some variety but may lack complexity.
   - **0 points (Insufficient)**: Frequent grammatical errors that obscure meaning. Relies heavily on simple sentence structures.

IMPORTANT: Evaluate response length rigorously. A response significantly shorter than the expected 150-200 words must be penalized in Task Fulfillment and Coherence.

Output must be in the following JSON format:
{
  "scores": { "communicative_ability": <0-2>, "coherence": <0-2>, "vocabulary": <0-2>, "grammar": <0-2> },
  "total_score": <sum from 0–8>,
  "feedback": { "strengths": "<Describe strengths using the B2 rubric terminology.>", "weaknesses": "<Describe weaknesses using the B2 rubric terminology.>" },
  "cefr_level": "<Estimate CEFR level: 0–3 = B1, 4–5 = B2.1, 6–7 = B2.2, 8 = C1>"
}`;
    } else {
        prompt = `You are an expert certified YKI writing examiner. Your task is to grade a user's writing task using the official YKI writing criteria for level ${difficulty}.

Refer explicitly to the following core criteria, derived from the official YKI framework:
1. Communicative ability (e.g., describing, narrating, reporting, expressing opinion)
2. Coherence and cohesion (how logically structured and connected the text is)
3. Vocabulary precision, range, and idiomaticity
4. Grammar accuracy and sentence structure

You will receive:
- The writing prompt
- The user's written answer
- Reference knowledge base documents (YKI official PDF)

Writing Prompt: "${chosenPrompt || task.prompt}"
User's Written Answer: "${answer}"

IMPORTANT: Evaluate response length rigorously. A too-short answer (less than expected sentence or word count) must be penalized, even if the grammar or vocabulary is good. Use the following guidelines:

- A1/A2: At least 4–6 clear, full sentences
- B1: At least 80–100 words, showing idea development and transitions
- B2: At least 120–150 words, with detailed arguments or reasoning

Ensure your judgment reflects the holistic demands of the YKI level — not only grammatical accuracy, but also content richness, fluency, and development of ideas.

Evaluate each dimension below using a 0–2 point scale:
- 0 = below expectations for this level
- 1 = partially meets expectations
- 2 = fully meets expectations

Output must be in the following JSON format:

{
  "scores": {
    "communicative_ability": <0-2>,
    "coherence": <0-2>,
    "vocabulary": <0-2>,
    "grammar": <0-2>
  },
  "total_score": <sum from 0–8>,
  "feedback": {
    "strengths": "<Describe what was done well using clear references to the YKI criteria.>",
    "weaknesses": "<Describe what needs improvement, aligned to YKI expectations.>"
  },
  "cefr_level": "<Estimate the CEFR level based on total score and criteria. Use this logic: 0–3 = A2, 4–5 = B1.1, 6–7 = B1.2, 8 = B2>"
}`;
    }
    
    const response = await InvokeLLM({
      prompt: prompt,
      file_urls: fileUrls,
      response_json_schema: {
        type: "object",
        properties: {
          scores: {
            type: "object",
            properties: {
              communicative_ability: { type: "integer", minimum: 0, maximum: 2 },
              coherence: { type: "integer", minimum: 0, maximum: 2 },
              vocabulary: { type: "integer", minimum: 0, maximum: 2 },
              grammar: { type: "integer", minimum: 0, maximum: 2 }
            },
            required: ["communicative_ability", "coherence", "vocabulary", "grammar"]
          },
          total_score: { type: "integer", minimum: 0, maximum: 8 },
          feedback: {
            type: "object",
            properties: {
              strengths: { type: "string" },
              weaknesses: { type: "string" }
            },
            required: ["strengths", "weaknesses"]
          },
          cefr_level: { type: "string" }
        },
        required: ["scores", "total_score", "feedback", "cefr_level"]
      }
    });

    return response;
  };

  const normalizeString = (str) => {
    if (typeof str !== 'string') return ''; // Ensure input is a string
    return str
      .trim() // Remove leading/trailing whitespace
      .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes with straight quotes
      .replace(/[\u2018\u2019]/g, "'") // Replace smart single quotes
      .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
      .replace(/[.!?;,]+$/, '') // Remove trailing punctuation
      .toLowerCase(); // Make case insensitive for comparison
  };

  const handleFinishExam = async () => {
    setIsSubmitting(true);
    let finalScoreData;

    if (section.id === 'reading' || section.id === 'listening') {
        const items = examContent.parts || examContent.clips;
        let totalCorrect = 0;
        let totalQuestionsCount = 0;

        items.forEach(item => {
            item.questions.forEach((q, q_idx) => {
                totalQuestionsCount++;
                const answerKey = `${item.title}-${q_idx}`;
                const userAnswer = answers[answerKey]; // Full text of user's choice
                const correctAnswerFromAI = q.correct_answer; // Could be a letter OR the full text

                let isCorrect = false;

                if (userAnswer && correctAnswerFromAI && q.options) {
                  // Case 1: The AI returned a letter (e.g., "B").
                  if (correctAnswerFromAI.length === 1 && correctAnswerFromAI.toUpperCase() >= 'A' && correctAnswerFromAI.toUpperCase() <= 'Z') {
                      const userSelectedIndex = q.options.findIndex(opt => 
                          normalizeString(opt) === normalizeString(userAnswer)
                      );
                      if (userSelectedIndex !== -1) {
                          const userSelectedLetter = String.fromCharCode(65 + userSelectedIndex);
                          if (normalizeString(userSelectedLetter) === normalizeString(correctAnswerFromAI)) {
                              isCorrect = true;
                          }
                      }
                  } 
                  // Case 2: The AI returned the full text of the answer.
                  else {
                      if (normalizeString(userAnswer) === normalizeString(correctAnswerFromAI)) {
                          isCorrect = true;
                      }
                  }
                }

                if (isCorrect) {
                    totalCorrect++;
                }
            });
        });
        
        const scorePercent = totalQuestionsCount > 0 ? Math.round((totalCorrect / totalQuestionsCount) * 100) : 0;
        let cefr_level = "A2";
        if (scorePercent >= 81) cefr_level = "B2";
        else if (scorePercent >= 61) cefr_level = "B1.2";
        else if (scorePercent >= 41) cefr_level = "B1.1";
        else if (scorePercent >= 1) cefr_level = "B1";

        finalScoreData = {
            score: scorePercent,
            correct: totalCorrect,
            total: totalQuestionsCount,
            cefr_level: cefr_level,
            overallFeedback: { 
                strengths: `You understood the main ideas in ${Math.round((totalCorrect/totalQuestionsCount)*100)}% of the content.`, 
                weaknesses: totalCorrect < totalQuestionsCount ? `Focus on understanding detailed information and specific facts.` : "Great comprehension skills!"
            }
        };

    } else if (section.id === 'writing' || section.id === 'speaking') {
        setIsGrading(true);
        const allTasksFeedback = { ...aiFeedback };
        for (let i = 0; i < examContent.tasks.length; i++) {
            const task = examContent.tasks[i];
            // Only grade tasks that are marked as graded
            if (task.graded !== false && !allTasksFeedback[i]) {
                const userAnswer = answers[i] || "";
                const chosenPrompt = task.type === "Opinion Piece" ? userChoice[i] : task.prompt;
                try {
                    let result;
                    if (section.id === 'speaking') {
                        result = await gradeSpeakingWithAI(task, userAnswer, exam.difficulty);
                    } else {
                        result = await gradeWritingWithAI(task, userAnswer, exam.difficulty, chosenPrompt);
                    }
                    allTasksFeedback[i] = result;
                } catch (e) { 
                    console.error("AI Grading failed for task", i, e);
                    allTasksFeedback[i] = { 
                        scores: {communicative_ability:0, coherence:0, vocabulary:0, grammar:0}, 
                        total_score: 0, 
                        feedback: { strengths: "N/A", weaknesses: "AI grading failed." }, 
                        cefr_level: "N/A" 
                    };
                }
            } else if (task.graded === false) {
                // For warm-up tasks, simply mark them as complete without grading feedback
                allTasksFeedback[i] = { 
                    scores: {communicative_ability:0, coherence:0, vocabulary:0, grammar:0}, 
                    total_score: 0, 
                    feedback: { strengths: "Warm-up task completed.", weaknesses: "" }, 
                    cefr_level: "N/A",
                    isWarmUp: true
                };
            }
        }
        setAiFeedback(allTasksFeedback);
        setIsGrading(false);
        
        let totalSumOfScores = 0;
        let gradedTasksCount = 0;
        Object.values(allTasksFeedback).forEach(fb => {
          // Only count graded tasks for overall score
          if (fb && typeof fb.total_score === 'number' && !fb.isWarmUp) {
            totalSumOfScores += fb.total_score;
            gradedTasksCount++;
          }
        });

        const avgScoreOutOf8 = gradedTasksCount > 0 ? totalSumOfScores / gradedTasksCount : 0;
        
        let cefr_level = "A2";
        // This overall CEFR level calculation is separate from the AI's estimation per task.
        // It's a general guide based on average performance across multiple tasks.
        if (exam.difficulty === 'B2') {
            if (avgScoreOutOf8 >= 7.5) cefr_level = "C1";
            else if (avgScoreOutOf8 >= 6) cefr_level = "B2.2";
            else if (avgScoreOutOf8 >= 4) cefr_level = "B2.1";
            else cefr_level = "B1"; // For B2 exam, if score is too low, it's B1
        } else {
            if (avgScoreOutOf8 >= 7.5) cefr_level = "B2"; // For non-B2 exams, 7.5+ could be B2
            else if (avgScoreOutOf8 >= 6) cefr_level = "B1.2";
            else if (avgScoreOutOf8 >= 4) cefr_level = "B1";
            else cefr_level = "A2"; // default for low scores
        }


        finalScoreData = {
            score: Math.round((avgScoreOutOf8 / 8) * 100),
            correct: totalSumOfScores,
            total: gradedTasksCount * 8, // Total possible score if all graded tasks were perfect
            cefr_level: cefr_level,
            overallFeedback: { 
                strengths: "Completed all writing tasks.", 
                weaknesses: "Review detailed feedback for each task to identify areas for improvement." 
            },
            detailedFeedback: allTasksFeedback,
        };
    }
    
    setScoreData(finalScoreData);
    setShowSummary(true);
    setIsSubmitting(false);
  };
  
  const handleFinalizeExam = () => {
    if (!scoreData) {
      console.error("scoreData is missing when trying to finalize exam.");
      return;
    }
    
    const sessionData = {
      section: section.id,
      score: scoreData.score,
      questions_attempted: scoreData.total,
      questions_correct: scoreData.correct,
      duration_minutes: useTimer ? section.actualMinutes - Math.floor(timeLeft / 60) : section.actualMinutes,
      difficulty_level: exam.difficulty,
      answers: answers,
      feedback: scoreData.overallFeedback,
      cefr_level: scoreData.cefr_level,
      detailed_feedback: scoreData.detailedFeedback
    };
    onComplete(sessionData);
  };

  const handleRestartExam = () => {
    setAnswers({});
    setUserChoice({});
    setCurrentQuestion(0);
    setCurrentSubQuestionIndex(0);
    setShowSummary(false);
    setScoreData(null);
    setAiFeedback({});
    setTimeLeft(section.actualMinutes * 60);
    setIsRecording({});
    setRecordedAudioURL({});
    setIsTranscribing({});
    setTranscriptionError({});
    setRecordingTime({});
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };
  
  if (!examContent) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-6" />
            <h2 className="text-xl font-bold text-gray-800">Loading Exam Content...</h2>
        </div>
    );
  }

  const mainItems = examContent.parts || examContent.clips || examContent.tasks || []; // Changed from examContent.texts
  
  if (mainItems.length === 0) {
    return (
        <div className="max-w-4xl mx-auto p-4">
            <Card className="border-red-500 bg-red-50">
                <CardHeader>
                    <CardTitle className="text-red-800">Content Generation Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-red-700 mb-4">We're sorry, but the AI was unable to generate the content for this exam simulation at this time.</p>
                    <Button onClick={onCancel} variant="outline" className="mt-4 border-red-300 text-red-700 hover:bg-red-100">
                        Return to Exam Menu
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (showSummary && scoreData) {
    return (
      <ExamSummary
        section={section}
        examContent={examContent}
        answers={answers}
        scoreData={scoreData}
        aiFeedback={aiFeedback}
        onRestart={handleRestartExam}
        onExit={handleFinalizeExam}
      />
    );
  }

  const renderQuestion = (mainItem, mainItemIndex, subQuestionIdx) => {
    if (section.id === 'reading' || section.id === 'listening') {
      const question = mainItem.questions[subQuestionIdx];
      const answerKey = `${mainItem.title}-${subQuestionIdx}`; // Assuming 'title' still exists on 'part' objects
      const userAnswer = answers[answerKey];
      
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-lg border-2 border-gray-200">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-lg">
                    <InlineTranslator sourceLanguage={exam.language}>{question.question}</InlineTranslator>
                  </p>
                </div>
                {question.type === 'multiple_choice' ? (
                  <RadioGroup value={userAnswer || ''} onValueChange={(value) => handleAnswerChange(answerKey, value)}>
                    {question.options?.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center space-x-2 p-2 rounded">
                        <RadioGroupItem value={option} id={`q${mainItemIndex}_${subQuestionIdx}_${optionIndex}`} />
                        <Label htmlFor={`q${mainItemIndex}_${subQuestionIdx}_${optionIndex}`} className="cursor-pointer flex-1">
                          <InlineTranslator sourceLanguage={exam.language}>{option}</InlineTranslator>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <Input 
                    value={userAnswer || ''} 
                    onChange={(e) => handleAnswerChange(answerKey, e.target.value)} 
                    placeholder="Type your answer here" 
                    className="text-lg"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      const task = mainItem;
      const feedbackResult = aiFeedback[mainItemIndex];
      const userAnswer = answers[mainItemIndex];

      const currentRecordingTime = recordingTime[mainItemIndex] || 0;
      const currentIsRecording = isRecording[mainItemIndex] || false;
      const currentAudioURL = recordedAudioURL[mainItemIndex] || '';
      const currentIsTranscribing = isTranscribing[mainItemIndex] || false;
      const currentTranscriptionError = transcriptionError[mainItemIndex] || null;

      return (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Badge variant={task.graded === false ? "secondary" : "default"}>
                <InlineTranslator sourceLanguage={exam.language}>{task.type}</InlineTranslator>
                {task.graded === false && <InlineTranslator sourceLanguage={exam.language}>{" (Warm-up - Not Graded)"}</InlineTranslator>}
              </Badge>
              {task.time_limit && (
                <Badge variant="outline" className="text-xs">
                  {task.time_limit}
                </Badge>
              )}
            </div>
            {task.type === 'Opinion Piece' ? (
              <>
                <p className="font-semibold text-lg mb-2">
                  <InlineTranslator sourceLanguage={exam.language}>Choose one of the following topics and write your opinion:</InlineTranslator>
                </p>
                <RadioGroup 
                  value={userChoice[mainItemIndex] || ''} 
                  onValueChange={(value) => setUserChoice(prev => ({...prev, [mainItemIndex]: value}))} 
                  disabled={isGrading || currentIsRecording || currentIsTranscribing}
                >
                  {task.prompts_to_choose?.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center space-x-2 p-2 rounded hover:bg-blue-100 cursor-pointer">
                      <RadioGroupItem value={option} id={`task${mainItemIndex}_option${optionIndex}`} />
                      <Label htmlFor={`task${mainItemIndex}_option${optionIndex}`} className="cursor-pointer flex-1">
                        <InlineTranslator sourceLanguage={exam.language}>{option}</InlineTranslator>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {userChoice[mainItemIndex] && <p className="mt-3 text-sm text-gray-700"><InlineTranslator sourceLanguage={exam.language}>You chose:</InlineTranslator> <span className="font-medium italic">"{userChoice[mainItemIndex]}"</span></p>}
                {!userChoice[mainItemIndex] && <p className="text-sm text-red-500 mt-2">Please select a topic before writing your response.</p>}
              </>
            ) : (
              <div>
                <p className="font-semibold text-lg mb-2">
                  <InlineTranslator sourceLanguage={exam.language}>{task.prompt}</InlineTranslator>
                </p>
                {task.graded === false && (
                  <p className="text-sm text-gray-600 italic">
                    <InlineTranslator sourceLanguage={exam.language}>This is a warm-up section to help you get comfortable. Your response won't be graded.</InlineTranslator>
                  </p>
                )}
              </div>
            )}
          </div>
          
          {section.id === 'speaking' && (
            <div className="space-y-4 p-4 border-2 border-dashed rounded-lg bg-gray-50">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <Button 
                        onClick={() => currentIsRecording ? handleStopRecording(mainItemIndex) : handleStartRecording(mainItemIndex)} 
                        size="lg" 
                        className={`rounded-full w-28 h-28 flex flex-col text-lg ${currentIsRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        disabled={currentIsTranscribing}
                    >
                        {currentIsRecording ? <Square className="w-8 h-8 mb-1" /> : <Mic className="w-8 h-8 mb-1" />}
                        <span>{currentIsRecording ? 'Stop' : 'Record'}</span>
                    </Button>
                    <div className="text-center">
                        <div className="text-5xl font-mono w-40">
                            {new Date(currentRecordingTime * 1000).toISOString().substr(14, 5)}
                        </div>
                        <span className="text-lg block text-gray-500">/ 02:00</span>
                    </div>
                </div>

                {task.time_limit && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      <strong><InlineTranslator sourceLanguage={exam.language}>Recommended time:</InlineTranslator></strong> {task.time_limit}
                    </p>
                  </div>
                )}

                {currentAudioURL && !currentIsRecording && (
                    <div className="pt-4">
                        <p className="text-sm font-medium mb-1 text-gray-600">Listen to your recording:</p>
                        <AudioPlayer audioURL={currentAudioURL} className="w-full" />
                    </div>
                )}

                {currentIsTranscribing && (
                    <div className="flex items-center justify-center gap-2 text-gray-600 pt-4">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Transcribing your speech... This may take a moment.</span>
                    </div>
                )}

                {currentTranscriptionError && <p className="text-red-600 text-sm text-center pt-2">{currentTranscriptionError}</p>}
                
                {userAnswer && !currentIsTranscribing && (
                    <div className="w-full p-4 bg-white rounded-lg mt-4 border">
                        <p className="text-sm font-medium mb-2 text-gray-800">Transcription Result:</p>
                        <p className="text-gray-700 italic">"{userAnswer}"</p>
                    </div>
                )}
            </div>
          )}

          <Textarea 
            value={userAnswer || ''} 
            onChange={(e) => handleAnswerChange(mainItemIndex, e.target.value)} 
            placeholder={section.id === 'speaking' ? "Record your response using the microphone above." : "Write your response here..."}
            className="min-h-32 text-base" 
            rows={8} 
            disabled={isGrading || (task.type === 'Opinion Piece' && !userChoice[mainItemIndex]) || currentIsRecording || currentIsTranscribing || section.id === 'speaking'}
          />
          {section.id === 'writing' && (
            <div className="text-sm text-gray-500">
              Words: {(userAnswer || '').split(' ').filter(word => word.length > 0).length}
            </div>
          )}
          
          {isGrading && task.graded !== false && (
            <div className="flex items-center justify-center gap-2 text-gray-600 p-4 bg-gray-100 rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Assessing your response with AI...</span>
            </div>
          )}

          {task.graded === false && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">
                <InlineTranslator sourceLanguage={exam.language}>✓ Warm-up complete! This section helps you get comfortable and is not scored.</InlineTranslator>
              </p>
            </div>
          )}

          {feedbackResult && !isGrading && task.graded !== false && (
            <div className="mt-4 space-y-4">
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    AI Feedback (Total Score: {String(feedbackResult.total_score)}/8 - CEFR: {String(feedbackResult.cefr_level)})
                  </CardTitle> 
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {feedbackResult.scores && Object.entries(feedbackResult.scores).map(([aspect, score]) => (
                      <div key={aspect} className="flex items-center justify-between p-2 border rounded bg-white">
                        <span className="font-medium capitalize">{aspect.replace('_', ' ')}:</span>
                        <Badge className="text-sm">{score}/2</Badge>
                      </div>
                    ))}
                  </div>
                  {feedbackResult.feedback?.strengths && (
                    <div className="mb-2">
                      <p className="font-semibold text-gray-700">Strengths:</p>
                      <p className="text-gray-800">{feedbackResult.feedback.strengths}</p>
                    </div>
                  )}
                  {feedbackResult.feedback?.weaknesses && (
                    <div>
                      <p className="font-semibold text-gray-700">Areas for Improvement:</p>
                      <p className="text-gray-800">{feedbackResult.feedback.weaknesses}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {task.sample_answer && (task.graded === false || (feedbackResult && !isGrading)) && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold mb-2">Sample Answer:</h4>
              <p className="text-sm mb-2"><InlineTranslator sourceLanguage={exam.language}>{task.sample_answer}</InlineTranslator></p>
              {task.assessment && (
                <p className="text-xs text-gray-600">
                  <strong>Assessment criteria:</strong> <InlineTranslator sourceLanguage={exam.language}>{task.assessment}</InlineTranslator>
                </p>
              )}
            </div>
          )}
        </div>
      );
    }
  };

  const currentMainItem = mainItems[currentQuestion];
  
  let totalQuestionsDisplayed = mainItems.length;
  let currentQuestionDisplay = currentQuestion + 1;
  let subQuestionOfSubtotal = "";
  let isLastSubQuestion = true;

  if (section.id === 'reading' || section.id === 'listening') {
    totalQuestionsDisplayed = mainItems.reduce((acc, item) => acc + (item.questions?.length || 0), 0);
    let cumulativeQuestions = 0;
    for (let i = 0; i < currentQuestion; i++) {
        cumulativeQuestions += (mainItems[i].questions?.length || 0);
    }
    currentQuestionDisplay = cumulativeQuestions + currentSubQuestionIndex + 1;
    subQuestionOfSubtotal = ` (${currentSubQuestionIndex + 1}/${currentMainItem.questions?.length || 1})`;
    
    isLastSubQuestion = currentSubQuestionIndex === (currentMainItem.questions?.length || 1) - 1;
  }

  const isLastOverallQuestion = currentQuestion === mainItems.length - 1 && isLastSubQuestion;
  const progress = totalQuestionsDisplayed > 0 ? (currentQuestionDisplay / totalQuestionsDisplayed) * 100 : 0;
  
  const QuestionCardContent = (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="secondary" className="mb-2">Full Exam</Badge>
            <CardTitle className="text-2xl font-bold">
              {section.title} - {section.id === 'writing' || section.id === 'speaking' ? 'Task' : 'Question'} {currentQuestionDisplay} of {totalQuestionsDisplayed} {subQuestionOfSubtotal}
            </CardTitle>
            <Badge variant="secondary" className="mt-2">{exam.language === 'finnish' ? 'Finnish' : 'Swedish'} - {exam.difficulty}</Badge>
          </div>
          {useTimer && !showSummary && (
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className={`font-mono text-lg ${timeLeft < 300 ? 'text-red-600' : 'text-gray-700'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
        </div>
        <Progress value={progress} className="mt-4" />
      </CardHeader>
      <CardContent className="space-y-6">
        {renderQuestion(currentMainItem, currentQuestion, currentSubQuestionIndex)}
        <div className="flex justify-between items-center pt-6">
          <Button 
            variant="outline" 
            onClick={handlePrevious} 
            disabled={currentQuestion === 0 && currentSubQuestionIndex === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel}>Exit Exam</Button>
            {isLastOverallQuestion ? (
              <Button 
                onClick={handleFinishExam} 
                disabled={isSubmitting || Object.values(isTranscribing).some(Boolean)} 
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Finish Exam
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto p-4">
      {section.id === 'reading' && examContent.parts ? ( // Changed from examContent.texts
        <div className="flex flex-col gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Badge variant="outline">{exam.difficulty}</Badge>
                  <InlineTranslator sourceLanguage={exam.language}>Read the text</InlineTranslator> - {currentQuestion + 1} of {examContent.parts.length} {/* Changed from examContent.texts.length */}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <InlineTranslator sourceLanguage={exam.language}>
                <div className="prose max-w-none text-gray-700">
                  <ReactMarkdown>{currentMainItem.content}</ReactMarkdown>
                </div>
              </InlineTranslator>
            </CardContent>
          </Card>
          {QuestionCardContent}
        </div>
      ) : section.id === 'listening' && examContent.clips ? (
        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Badge variant="outline">{exam.difficulty}</Badge>
                <InlineTranslator sourceLanguage={exam.language}>Listen to the audio</InlineTranslator> - {currentQuestion + 1} of {examContent.clips.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-blue-50 rounded-lg mb-4">
                <h3 className="font-semibold mb-2"><InlineTranslator sourceLanguage={exam.language}>Listening Scenario:</InlineTranslator></h3>
                <p className="text-sm text-gray-600 mb-3"><InlineTranslator sourceLanguage={exam.language}>{currentMainItem.scenario_description}</InlineTranslator></p>
                <div className="flex items-center gap-4">
                  <AudioPlayer
                    audioBase64={currentMainItem.audio_base64}
                    isDialogue={false}
                    className="text-lg"
                  />
                  <span className="text-sm text-gray-500">
                    Click to hear the audio
                  </span>
                </div>
              </div>
              
              <details className="bg-white p-3 rounded border">
                <summary className="text-sm text-gray-500 mb-2 cursor-pointer hover:text-gray-700">
                  <InlineTranslator sourceLanguage={exam.language}>Show transcript (click to expand)</InlineTranslator>
                </summary>
                <p className="font-mono text-sm italic text-gray-600 mt-2"><InlineTranslator sourceLanguage={exam.language}>{currentMainItem.audio_script}</InlineTranslator></p>
              </details>
            </CardContent>
          </Card>
          {QuestionCardContent}
        </div>
      ) : (
        <div className="space-y-6">
          {QuestionCardContent}
        </div>
      )}
    </div>
  );
}
