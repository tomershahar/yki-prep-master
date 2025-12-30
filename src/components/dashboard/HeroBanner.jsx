import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Target, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function HeroBanner({ 
  user, 
  journeyData, 
  isTryExamBannerVisible,
  onDismissBanner 
}) {
  const { isFirstTimeUser, hasSession, preferredSection } = journeyData;

  if (isFirstTimeUser) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <BookOpen className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to YKI Prep Master!
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Start your {user?.target_language === 'finnish' ? 'Finnish' : 'Swedish'} YKI exam preparation journey. 
              Begin with quick practice sessions to build your confidence.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl("Practice")}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Play className="w-5 h-5 mr-2" />
                Start Your First Practice
              </Button>
            </Link>
            <Link to={createPageUrl("ExamContent")}>
              <Button variant="outline" size="lg">
                <Target className="w-5 h-5 mr-2" />
                Learn About YKI
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isTryExamBannerVisible && hasSession) {
    return (
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Ready for Next Step
                </Badge>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Try a Full Exam Simulation
              </h3>
              <p className="text-gray-600">
                You've completed some practice sessions. Ready to test your skills with a full exam?
              </p>
            </div>
            <div className="flex items-center gap-3 ml-6">
              <Button variant="ghost" size="sm" onClick={onDismissBanner}>
                Maybe Later
              </Button>
              <Link to={createPageUrl("FullExam")}>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Target className="w-4 h-4 mr-2" />
                  Try Full Exam
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}