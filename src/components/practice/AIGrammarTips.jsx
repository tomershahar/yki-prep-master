import React, { useState, useEffect } from 'react';
import { InvokeLLM } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, BrainCircuit, Loader2 } from "lucide-react";

const AIGrammarTips = ({ language, level, section }) => {
  const [tips, setTips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    generateTips();
  }, [language, level, section]);

  const generateTips = async () => {
    setIsLoading(true);
    setError(null);

    const languageName = language === 'finnish' ? 'Finnish' : language === 'swedish' ? 'Swedish' : 'Danish';

    // Add randomization and section-specific context
    const sectionContext = {
      reading: "since you're about to practice reading comprehension",
      listening: "since you're about to practice listening comprehension",
      speaking: "since you're about to practice speaking",
      writing: "since you're about to practice writing"
    };

    const randomSeed = Math.floor(Math.random() * 1000);
    const currentTime = new Date().toISOString();

    const prompt = `
      You are an expert ${languageName} language teacher preparing personalized grammar tips for a student about to start ${section} practice at the ${level} CEFR level.

      CONTEXT: The student is preparing for the YKI (Finnish) or TISUS (Swedish) exam, ${sectionContext[section] || ''}.

      RANDOMIZATION SEED: ${randomSeed}
      GENERATION TIME: ${currentTime}

      CRITICAL INSTRUCTIONS:
      1. Generate 2 DIFFERENT grammar tips that are specifically relevant to ${section} skills at ${level} level
      2. Each tip must be UNIQUE and not repeat common grammar points
      3. Focus on practical, actionable advice that helps with ${section} performance
      4. Make the tips specific to ${level} level complexity
      5. Include varied grammar aspects (don't repeat the same concept)

      LEVEL-SPECIFIC REQUIREMENTS:
      ${level === 'A1' ? `
      - Focus on basic sentence structure, present tense, common verbs
      - Use simple vocabulary and clear explanations
      - Emphasize fundamental building blocks
      ` : level === 'A2' ? `
      - Include past/future tenses, compound sentences, basic connectors
      - Add some descriptive language and common phrasal expressions
      - Build on A1 foundations with slightly more complexity
      ` : level === 'B1' ? `
      - Cover complex sentences, subjunctive mood, advanced connectors
      - Include opinion expression, reasoning, and argumentation structures
      - Focus on fluency and natural expression
      ` : `
      - Address sophisticated grammar: passive voice, complex conditionals, abstract concepts
      - Include formal/academic language, nuanced expressions
      - Emphasize precision and advanced language use
      `}

      SECTION-SPECIFIC FOCUS for ${section}:
      ${section === 'reading' ? 'Grammar that helps understand complex texts, recognize sentence structures, and interpret meaning' :
        section === 'listening' ? 'Grammar patterns commonly heard in speech, informal vs formal language, and time expressions' :
        section === 'speaking' ? 'Grammar for natural conversation, question formation, and expressing opinions fluently' :
        'Grammar for written expression, formal structures, and coherent text organization'}

      Generate exactly 2 tips that are different from typical textbook examples. Make them practical and memorable.

      Respond in the following strict JSON format:
      {
        "tips": [
          {
            "title": "Specific grammar concept title",
            "explanation": "Clear, practical explanation with context for ${section}",
            "example": "Natural ${languageName} sentence demonstrating the concept",
            "example_translation": "English translation",
            "insight": "Actionable tip or common mistake to avoid"
          },
          {
            "title": "Different grammar concept title",
            "explanation": "Clear, practical explanation with context for ${section}",
            "example": "Natural ${languageName} sentence demonstrating the concept",
            "example_translation": "English translation",
            "insight": "Actionable tip or common mistake to avoid"
          }
        ]
      }
    `;

    const responseSchema = {
      type: "object",
      properties: {
        tips: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Clear, short grammar concept name." },
              explanation: { type: "string", description: "1-2 sentence summary of what the rule is and when to use it." },
              example: { type: "string", description: "A native sentence showing the rule." },
              example_translation: { type: "string", description: "The English translation of the example sentence." },
              insight: { type: "string", description: "An optional mini-task or a 'watch out' tip to avoid common mistakes." }
            },
            required: ["title", "explanation", "example", "example_translation", "insight"]
          }
        }
      },
      required: ["tips"]
    };

    try {
      const response = await InvokeLLM({
        prompt,
        response_json_schema: responseSchema,
        model: "gpt-4o" // UPGRADED: Use GPT-4o instead of mini
      });
      setTips(response.tips || []);
    } catch (err) {
      console.error("Failed to generate AI grammar tips:", err);
      setError("Could not load grammar tips at this time.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-3 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Generating personalized grammar tips...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
       <Card className="border-0 shadow-lg bg-gradient-to-r from-red-50 to-orange-50">
        <CardContent className="pt-6 text-center text-red-700">{error}</CardContent>
      </Card>
    );
  }

  if (tips.length === 0) return null;

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrainCircuit className="w-6 h-6 text-blue-600" />
            <CardTitle className="text-xl font-bold text-gray-900">
              AI Grammar Insights
            </CardTitle>
          </div>
          <Badge variant="secondary">{level}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {tips.map((tip, index) => (
          <div key={index} className="p-4 bg-white/70 rounded-lg border border-blue-100 space-y-3">
            <h4 className="font-bold text-blue-900 text-md">{tip.title}</h4>
            <p className="text-gray-700 text-sm leading-relaxed">{tip.explanation}</p>
            <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
              <p className="font-mono text-sm text-gray-800">{tip.example}</p>
              <p className="text-xs text-gray-500 italic">"{tip.example_translation}"</p>
            </div>
            <div className="flex items-start gap-2 pt-2">
              <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-800">{tip.insight}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AIGrammarTips;