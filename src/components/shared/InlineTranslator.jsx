
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Loader2, Languages, Bookmark, CheckCircle } from 'lucide-react';
import { InvokeLLM } from "@/integrations/Core";
import { WordBankEntry } from "@/entities/WordBankEntry";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function InlineTranslator({ children, sourceLanguage, targetLanguage = 'english' }) {
  const [selectedText, setSelectedText] = useState('');
  const [translation, setTranslation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const [existingWords, setExistingWords] = useState(new Set());
  
  const containerRef = useRef(null);

  useEffect(() => {
    // Pre-fetch existing words to avoid duplicates
    const fetchExistingWords = async () => {
      try {
        const words = await WordBankEntry.list();
        setExistingWords(new Set(words.map(w => w.word.toLowerCase())));
      } catch (e) {
        console.error("Failed to fetch word bank", e);
        // Don't set error state here as it's not critical
      }
    };
    fetchExistingWords();
  }, []);

  const fetchTranslation = useCallback(async (text) => {
    try {
      const prompt = `Translate the following ${sourceLanguage} word to ${targetLanguage}. Respond with ONLY the translated text and nothing else.

Word: "${text}"`;

      const result = await InvokeLLM({ 
        prompt,
        model: "gpt-4o"
      });
      setTranslation(result);
    } catch (err) {
      console.error("Translation error:", err);
      setError('Translation failed.');
    } finally {
      setIsLoading(false);
    }
  }, [sourceLanguage, targetLanguage]);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim().toLowerCase();

    if (text.length > 0 && text.length < 50 && !/\s/.test(text)) { // Only trigger for single words
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      setSelectedText(text);
      setTranslation('');
      setError(null);
      setIsLoading(true);
      setIsSaved(existingWords.has(text));
      setPopoverPosition({
        top: rect.top - containerRect.top,
        left: rect.left - containerRect.left + rect.width / 2,
      });
      setPopoverOpen(true);
      
      fetchTranslation(text);
    } else {
      setPopoverOpen(false);
    }
  }, [existingWords, fetchTranslation]);

  const handleSaveWord = async () => {
    if (!translation) {
      setError('No translation available to save.');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      console.log('Saving word to Word Bank:', { word: selectedText, language: sourceLanguage, translation });
      
      // First, generate example sentence
      const sentencePrompt = `Create a simple, clear, and contextually relevant example sentence in ${sourceLanguage} using the word "${selectedText}". The sentence should be easy for a language learner to understand. Respond with ONLY the sentence.`;
      
      console.log('Generating example sentence...');
      const exampleSentence = await InvokeLLM({ 
        prompt: sentencePrompt,
        model: "gpt-4o"
      });
      
      console.log('Example sentence generated:', exampleSentence);

      // Then save the word
      const wordData = {
        word: selectedText,
        language: sourceLanguage,
        translation: translation,
        example_sentence: exampleSentence,
      };
      
      console.log('Creating WordBankEntry with data:', wordData);
      const savedWord = await WordBankEntry.create(wordData);
      console.log('Word saved successfully:', savedWord);

      // Update local state
      setExistingWords(prev => new Set(prev).add(selectedText));
      setIsSaved(true);
      
      // Success feedback
      console.log('Word bank entry created successfully with ID:', savedWord.id);
      
    } catch (err) {
      console.error("Detailed error saving word:", err);
      
      // Provide more specific error messages
      let errorMessage = "Couldn't save word.";
      if (err.message) {
        if (err.message.includes('permission') || err.message.includes('denied')) {
          errorMessage = "Permission denied. Unable to save word to your Word Bank.";
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (err.message.includes('duplicate') || err.message.includes('unique')) {
          errorMessage = "This word is already in your Word Bank.";
        } else {
          errorMessage = `Save failed: ${err.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div ref={containerRef} onMouseUp={handleMouseUp} className="relative select-text">
      {children}

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <div
            style={{
              position: 'absolute',
              top: `${popoverPosition.top}px`,
              left: `${popoverPosition.left}px`,
              width: 0,
              height: 0,
            }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto max-w-xs shadow-xl" side="top" align="center">
          <div className="p-2">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b">
              <Languages className="w-4 h-4 text-gray-500" />
              <p className="font-bold text-gray-800 capitalize">{selectedText}</p>
            </div>
            <div className="min-h-[2rem] flex items-center justify-center mb-3">
              {isLoading && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
              {error && !isLoading && <p className="text-sm text-red-600">{error}</p>}
              {translation && !isLoading && <p className="text-lg font-semibold text-blue-700">{translation}</p>}
            </div>
            {!isLoading && !error && translation && (
              <Button 
                onClick={handleSaveWord} 
                disabled={isSaving || isSaved} 
                className="w-full"
                size="sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : isSaved ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4 mr-2" />
                    Save to Word Bank
                  </>
                )}
              </Button>
            )}
            {error && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
