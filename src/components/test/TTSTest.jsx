import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { generateSpeech } from "@/functions/generateSpeech";

export default function TTSTest() {
  const [testText, setTestText] = useState("Hei, tämä on testi.");
  const [language, setLanguage] = useState("finnish");
  const [gender, setGender] = useState("woman");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTest = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await generateSpeech({
        text_to_speak: testText,
        language: language,
        gender: gender
      });

      if (response.data.status === "success") {
        setResult("✅ API is working! Audio generated successfully.");
        
        // Play the audio
        const audioBlob = new Blob([
          new Uint8Array(atob(response.data.audio_base64).split('').map(char => char.charCodeAt(0)))
        ], { type: 'audio/mpeg' });
        
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      } else {
        setError(`❌ API Error: ${response.data.message}`);
      }
    } catch (err) {
      setError(`❌ Request failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="w-5 h-5" />
          Test ElevenLabs API
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Test Text:</label>
          <Input 
            value={testText} 
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Enter text to test..."
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm font-medium">Language:</label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="finnish">Finnish</SelectItem>
                <SelectItem value="swedish">Swedish</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Voice:</label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="woman">Woman</SelectItem>
                <SelectItem value="man">Man</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleTest} 
          disabled={isLoading || !testText.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing API...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Test Speech Generation
            </>
          )}
        </Button>

        {result && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{result}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}