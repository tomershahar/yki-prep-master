import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Headphones, Mic, PenTool, CheckCircle, Target, TrendingUp, Award } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    // Set SEO meta tags
    document.title = "YKI Prep Master - Finnish & Swedish Exam Preparation App";
    
    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = "Ace your YKI Finnish or Swedish language exam with AI-powered practice. Get personalized exercises for reading, listening, speaking, and writing at all CEFR levels (A1-B2).";

    // Add keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.content = "YKI exam, Finnish exam, Swedish exam, TISUS, language test preparation, CEFR, Finnish language, Swedish language, exam practice, language learning";

    // Check if user is logged in and redirect to dashboard
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const user = await User.me();
      if (user) {
        navigate(createPageUrl("Dashboard"));
      }
    } catch (error) {
      // User not logged in, stay on landing page
    }
  };

  const features = [
    {
      icon: BookOpen,
      title: "Reading Practice",
      description: "Comprehension exercises with authentic Finnish/Swedish texts"
    },
    {
      icon: Headphones,
      title: "Listening Practice",
      description: "AI-generated audio with natural native speech"
    },
    {
      icon: Mic,
      title: "Speaking Practice",
      description: "Record and get AI feedback on pronunciation and fluency"
    },
    {
      icon: PenTool,
      title: "Writing Practice",
      description: "Structured writing tasks with detailed AI grading"
    }
  ];

  const benefits = [
    { icon: Target, text: "Personalized to your CEFR level (A1-B2)" },
    { icon: TrendingUp, text: "Track progress with detailed analytics" },
    { icon: Award, text: "Earn achievements and stay motivated" },
    { icon: CheckCircle, text: "Instant AI feedback on all exercises" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <Badge className="bg-blue-600 text-white px-4 py-2 text-sm">
            AI-Powered Language Exam Preparation
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
            Ace Your YKI Finnish or Swedish Exam
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Master the YKI (Finnish) or TISUS (Swedish) language proficiency exam with personalized AI practice. 
            Get instant feedback, track your progress, and achieve your language goals.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
              onClick={() => navigate(createPageUrl("Dashboard"))}
            >
              Start Practicing Free
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="px-8 py-6 text-lg"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
          Complete Exam Preparation
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="pt-6 text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            Why Choose YKI Prep Master?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-lg text-gray-700 pt-2">{benefit.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">
          <CardContent className="p-12 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Master Your Language Exam?
            </h2>
            <p className="text-xl text-blue-50 max-w-2xl mx-auto">
              Join thousands of students preparing for their YKI Finnish or Swedish language certification.
            </p>
            <Button 
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg"
              onClick={() => navigate(createPageUrl("Dashboard"))}
            >
              Get Started Now - It's Free
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2026 YKI Prep Master. All rights reserved.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Prepare for YKI (Yleinen kielitutkinto) Finnish exam and TISUS Swedish exam with confidence.
          </p>
        </div>
      </footer>
    </div>
  );
}