import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function EmptyState({ type = "general", user }) {
  const emptyStates = {
    general: {
      icon: BookOpen,
      title: "Start Your Learning Journey",
      description: "No practice sessions yet. Begin with a quick practice to get started!",
      primaryAction: { text: "Start Practice", url: "Practice" },
      secondaryAction: { text: "Learn About YKI", url: "ExamContent" }
    },
    achievements: {
      icon: Play,
      title: "Complete Your First Practice",
      description: "Achievements will appear here as you progress through your learning journey.",
      primaryAction: { text: "Start Practice", url: "Practice" },
      secondaryAction: null
    }
  };

  const state = emptyStates[type] || emptyStates.general;
  const Icon = state.icon;

  return (
    <Card className="border-2 border-dashed border-gray-300">
      <CardContent className="p-8 text-center">
        <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{state.title}</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{state.description}</p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={createPageUrl(state.primaryAction.url)}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Play className="w-4 h-4 mr-2" />
              {state.primaryAction.text}
            </Button>
          </Link>
          
          {state.secondaryAction && (
            <Link to={createPageUrl(state.secondaryAction.url)}>
              <Button variant="outline">
                {state.secondaryAction.text}
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}