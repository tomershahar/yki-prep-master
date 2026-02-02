import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Languages, Flag, BookOpen, Headphones, Mic, PenTool, ArrowRight, CheckCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';

const steps = [
  { id: 1, title: 'Welcome' },
  { id: 2, title: 'Test Selection' },
  { id: 3, title: 'Skill Levels' },
  { id: 4, title: 'Goals' },
  { id: 5, title: 'Complete' },
];

const sectionOptions = [
  { id: 'reading', label: 'Reading', icon: BookOpen },
  { id: 'listening', label: 'Listening', icon: Headphones },
  { id: 'speaking', label: 'Speaking', icon: Mic },
  { id: 'writing', label: 'Writing', icon: PenTool },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    target_country: 'FI',
    target_test: 'YKI',
    test_language: 'finnish',
    target_level: 'A1',
    reading_level: 'A1',
    listening_level: 'A1',
    speaking_level: 'A1',
    writing_level: 'A1',
    test_date: '',
    daily_practice_goal: 15,
    interface_language: 'en'
  });
  const [isSaving, setIsSaving] = useState(false);

  // Check beta agreement on component mount
  useEffect(() => {
    const checkBetaAgreement = async () => {
      try {
        const currentUser = await User.me();
        if (!currentUser.has_agreed_to_beta_terms) {
          navigate(createPageUrl("BetaDisclaimer"));
          return;
        }
      } catch (error) {
        console.error("Error checking beta agreement:", error);
      }
    };

    checkBetaAgreement();
  }, [navigate]);

  const handleNext = () => setStep(prev => Math.min(prev + 1, steps.length));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const handleUpdate = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      await User.updateMyUserData({
        ...formData,
        onboarding_completed: true,
      });
      navigate(createPageUrl('Dashboard'));
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      setIsSaving(false);
    }
  };

  const progressValue = (step / steps.length) * 100;

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="text-center">
            <Languages className="w-16 h-16 mx-auto text-amber-500 mb-6" />
            <h1 className="text-3xl font-bold mb-2">Welcome to Nordic Test Prep!</h1>
            <p className="text-gray-600 mb-8">Let's quickly personalize your learning journey.</p>
            <Button onClick={handleNext} size="lg" className="w-full">Get Started <ArrowRight className="ml-2 w-5 h-5" /></Button>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold text-center mb-2">Which test are you preparing for?</h2>
            <p className="text-center text-gray-600 mb-6">Select your target language proficiency test</p>
            <div className="grid grid-cols-1 gap-4">
              <Card
                className={`p-6 cursor-pointer border-2 transition-all ${formData.target_country === 'FI' ? 'border-amber-500 bg-amber-50 shadow-lg' : 'hover:border-gray-300'}`}
                onClick={() => {
                  handleUpdate('target_country', 'FI');
                  handleUpdate('target_test', 'YKI');
                  handleUpdate('test_language', formData.test_language === 'danish' ? 'finnish' : formData.test_language);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🇫🇮</span>
                      <h3 className="font-bold text-lg">YKI - Finnish Citizenship Test</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Finnish or Swedish language proficiency for residence/citizenship</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={formData.target_country === 'FI' && formData.test_language === 'finnish' ? 'default' : 'outline'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdate('target_country', 'FI');
                          handleUpdate('target_test', 'YKI');
                          handleUpdate('test_language', 'finnish');
                        }}
                      >
                        Finnish
                      </Button>
                      <Button
                        size="sm"
                        variant={formData.target_country === 'FI' && formData.test_language === 'swedish' ? 'default' : 'outline'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdate('target_country', 'FI');
                          handleUpdate('target_test', 'YKI');
                          handleUpdate('test_language', 'swedish');
                        }}
                      >
                        Swedish
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card
                className={`p-6 cursor-pointer border-2 transition-all ${formData.target_country === 'SE' ? 'border-blue-500 bg-blue-50 shadow-lg' : 'hover:border-gray-300 opacity-60'}`}
                onClick={() => {
                  handleUpdate('target_country', 'SE');
                  handleUpdate('target_test', 'Swedex');
                  handleUpdate('test_language', 'swedish');
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🇸🇪</span>
                      <h3 className="font-bold text-lg">Swedex / SFI - Swedish Test</h3>

                    </div>
                    <p className="text-sm text-gray-600">Swedish language proficiency for residence/citizenship</p>
                  </div>
                </div>
              </Card>

              <Card
                className={`p-6 cursor-pointer border-2 transition-all ${formData.target_country === 'DK' ? 'border-red-500 bg-red-50 shadow-lg' : 'hover:border-gray-300 opacity-60'}`}
                onClick={() => {
                  handleUpdate('target_country', 'DK');
                  handleUpdate('target_test', 'PD3');
                  handleUpdate('test_language', 'danish');
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🇩🇰</span>
                      <h3 className="font-bold text-lg">Prøve i Dansk (PD3) - Danish Test</h3>
                      <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
                    </div>
                    <p className="text-sm text-gray-600">Danish language proficiency for residence/citizenship</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h2 className="text-2xl font-bold text-center mb-2">Assess Your Current Skill Levels</h2>
            <p className="text-center text-gray-500 mb-6">You'll start at level A1 by default. If you feel more advanced, you can adjust your starting level for each skill below.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sectionOptions.map(section => (
                <div key={section.id} className="space-y-2">
                  <Label htmlFor={`${section.id}_level`} className="flex items-center gap-2 font-semibold">
                    <section.icon className="w-5 h-5" />
                    {section.label}
                  </Label>
                  <Select value={formData[`${section.id}_level`]} onValueChange={(value) => handleUpdate(`${section.id}_level`, value)}>
                    <SelectTrigger id={`${section.id}_level`}>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A1">A1 (Beginner)</SelectItem>
                      <SelectItem value="A2">A2 (Elementary)</SelectItem>
                      <SelectItem value="B1">B1 (Intermediate)</SelectItem>
                      <SelectItem value="B2">B2 (Upper Intermediate)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <h2 className="text-2xl font-bold text-center mb-6">Set Your Learning Goals</h2>
            <div className="space-y-6">
              <div>
                <Label htmlFor="test_date">When is your test? (optional)</Label>
                <Input
                  id="test_date"
                  type="date"
                  value={formData.test_date}
                  onChange={(e) => handleUpdate('test_date', e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="daily_goal">Daily practice goal (minutes)</Label>
                <Select value={formData.daily_practice_goal.toString()} onValueChange={(value) => handleUpdate('daily_practice_goal', parseInt(value))}>
                  <SelectTrigger id="daily_goal" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-6" />
            <h1 className="text-3xl font-bold mb-2">You're all set!</h1>
            <p className="text-gray-600 mb-8">Your personalized learning path is ready. Let's start preparing for your success.</p>
            <Button onClick={handleFinish} size="lg" className="w-full" disabled={isSaving}>{isSaving ? 'Saving...' : 'Go to Dashboard'}</Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Progress value={progressValue} className="mb-4 h-2 progress-shimmer" />
        <Card className="p-8 md:p-12 shadow-2xl bg-white/80 backdrop-blur-lg">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </Card>
        {step > 1 && step < steps.length && (
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handleBack}>Back</Button>
            <Button onClick={handleNext}>Next <ArrowRight className="ml-2 w-4 h-4" /></Button>
          </div>
        )}
      </div>
    </div>
  );
}