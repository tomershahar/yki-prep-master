import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Clock, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";

export default function ExamSession({ section, useTimer, onComplete, onCancel }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(section.actualMinutes * 60); // Convert to seconds
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sample questions based on section
  const getQuestions = () => {
    switch(section.id) {
      case 'reading':
        return [
          {
            type: 'multiple_choice',
            text: 'Mikä on etätyön suurin hyöty tekstin mukaan?',
            options: ['Parempi palkka', 'Joustavuus ja ajansäästö', 'Vähemmän vastuuta', 'Enemmän lomaa'],
            context: 'Etätyö tarjoaa joustavuutta, säästää aikaa työmatkoissa ja voi parantaa työn ja vapaa-ajan tasapainoa.'
          },
          {
            type: 'multiple_choice', 
            text: 'Mitä etätyö vaatii työntekijältä?',
            options: ['Vähemmän taitoja', 'Itseohjautuvuutta', 'Enemmän taukoja', 'Kalliimpia välineitä'],
            context: 'Etätyö vaatii itseohjautuvuutta ja hyvää ajanhallintaa.'
          },
          {
            type: 'multiple_choice',
            text: 'Mikä on etätyön haaste yhteisöllisyyden kannalta?',
            options: ['Liikaa tapaamisia', 'Kollegoita ei tapaa päivittäin', 'Huono internet', 'Kalliit laitteet'],
            context: 'Kun kollegoita ei tapaa päivittäin kahvihuoneessa, tiimin yhteenkuuluvuuden tunne voi heikentyä.'
          }
        ];
      case 'listening':
        return [
          {
            type: 'fill_in_blank',
            text: 'InterCity-juna numero 58 on myöhässä ____ minuuttia.',
            context: 'Kuulet kuulutuksen: "InterCity-juna numero 58 Helsingistä on myöhässä noin 15 minuuttia ratatyön vuoksi."'
          },
          {
            type: 'multiple_choice',
            text: 'Miksi juna on myöhässä?',
            options: ['Sääolosuhteiden vuoksi', 'Ratatyön vuoksi', 'Teknisen vian vuoksi', 'Lakkojen vuoksi'],
            context: 'Kuulutus mainitsee ratatyön syyksi myöhästymiselle.'
          }
        ];
      case 'speaking':
        return [
          {
            type: 'open_ended',
            text: 'Kerro mielipiteesi: Onko tärkeämpää tehdä työtä, josta pitää, vai työtä, josta saa hyvän palkan? Perustele vastauksesi.',
            context: 'Sinulla on 3 minuuttia aikaa vastata. Kerro selkeästi mielipiteesi ja anna vähintään 2 perustetta.'
          },
          {
            type: 'open_ended', 
            text: 'Kuvaile viimeisintä lomamatkaasi. Minne menit, kenen kanssa ja mitä teit?',
            context: 'Kerro yksityiskohtaisesti ja käytä mennyttä aikamuotoa.'
          }
        ];
      case 'writing':
        return [
          {
            type: 'open_ended',
            text: 'Kirjoita sähköposti ystävällesi. Kerro hänelle, että olet muuttanut uuteen kaupunkiin. Kuvaile kaupunkia ja kysy, koska hän voisi tulla käymään. (50-80 sanaa)',
            context: 'Käytä epämuodollista tyyliä ja muista tervehdys ja lopputervehdys.'
          },
          {
            type: 'open_ended',
            text: 'Kirjoita mielipidekirjoitus aiheesta: "Pitäisikö julkinen liikenne olla ilmaista?" Perustele kantasi. (100-150 sanaa)',
            context: 'Ota selkeä kanta ja anna vähintään 2-3 perustetta mielipiteellesi.'
          }
        ];
      default:
        return [];
    }
  };

  const questions = getQuestions();

  useEffect(() => {
    if (useTimer && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [useTimer, timeLeft]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Calculate score
    const totalQuestions = questions.length;
    const answeredQuestions = Object.keys(answers).length;
    const baseScore = Math.min(100, (answeredQuestions / totalQuestions) * 100);
    const finalScore = Math.floor(baseScore + Math.random() * 20 - 10); // Add some variation
    
    const sessionData = {
      section: section.id,
      score: Math.max(0, Math.min(100, finalScore)),
      questions_attempted: answeredQuestions,
      questions_correct: Math.floor(answeredQuestions * 0.7), // Assume 70% correct
      duration_minutes: useTimer ? section.actualMinutes - Math.floor(timeLeft / 60) : section.actualMinutes,
      answers: answers
    };

    onComplete(sessionData);
  };

  const renderQuestion = (question, index) => {
    switch(question.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700 italic">{question.context}</p>
            </div>
            <p className="font-semibold text-lg">{question.text}</p>
            <RadioGroup 
              value={answers[index] || ''} 
              onValueChange={(value) => handleAnswerChange(index, value)}
            >
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`q${index}_${optionIndex}`} />
                  <Label htmlFor={`q${index}_${optionIndex}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      
      case 'fill_in_blank':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700 italic">{question.context}</p>
            </div>
            <p className="font-semibold text-lg">{question.text}</p>
            <Input
              value={answers[index] || ''}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              placeholder="Kirjoita vastauksesi tähän"
              className="text-lg"
            />
          </div>
        );
      
      case 'open_ended':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700 italic">{question.context}</p>
            </div>
            <p className="font-semibold text-lg">{question.text}</p>
            <Textarea
              value={answers[index] || ''}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              placeholder="Kirjoita vastauksesi tähän..."
              className="min-h-32 text-base"
              rows={6}
            />
            <div className="text-sm text-gray-500">
              Sanoja: {(answers[index] || '').split(' ').filter(word => word.length > 0).length}
            </div>
          </div>
        );
      
      default:
        return <p>Tuntematon kysymystyyppi</p>;
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">
                {section.title} - Question {currentQuestion + 1} of {questions.length}
              </CardTitle>
              <Badge variant="secondary" className="mt-2">
                {section.difficulty}
              </Badge>
            </div>
            {useTimer && (
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
          {renderQuestion(questions[currentQuestion], currentQuestion)}
          
          <div className="flex justify-between items-center pt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel}>
                Exit Exam
              </Button>
              
              {currentQuestion === questions.length - 1 ? (
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Submitting...' : 'Submit Exam'}
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
    </div>
  );
}