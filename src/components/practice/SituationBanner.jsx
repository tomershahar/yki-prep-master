import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

export default function SituationBanner({ situation }) {
  const [showVocabulary, setShowVocabulary] = useState(false);

  if (!situation) return null;

  return (
    <Alert className="mb-6 bg-blue-50 border-blue-200">
      <BookOpen className="h-5 w-5 text-blue-600" />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <AlertTitle className="text-lg font-bold text-gray-900 mb-0">
            {situation.title}
          </AlertTitle>
          <Badge variant="outline">{situation.difficulty}</Badge>
        </div>
        <AlertDescription className="text-gray-700">
          {situation.context}
        </AlertDescription>

        {/* Collapsible Vocabulary Section */}
        <div className="mt-3">
          <button
            onClick={() => setShowVocabulary(!showVocabulary)}
            className="flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors"
          >
            {showVocabulary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Key Vocabulary ({situation.key_phrases?.length || 0} phrases)
          </button>
          
          {showVocabulary && (
            <div className="mt-2 p-3 bg-white rounded-lg border border-blue-200">
              <ul className="space-y-1">
                {situation.key_phrases?.map((phrase, idx) => (
                  <li key={idx} className="text-sm text-gray-700">
                    • {phrase}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}