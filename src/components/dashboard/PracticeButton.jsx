import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, BookOpen, Headphones, Mic, PenTool } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const sectionIcons = {
  reading: BookOpen,
  listening: Headphones,
  speaking: Mic,
  writing: PenTool
};

const sectionColors = {
  reading: "from-amber-400 to-orange-500",
  listening: "from-blue-400 to-cyan-500",
  speaking: "from-green-400 to-emerald-500",
  writing: "from-purple-400 to-pink-500"
};

export default function PracticeButton({ 
  section, 
  user, 
  journeyData, 
  isPrimary = false 
}) {
  const { preferredSection, hasSession } = journeyData;
  const Icon = sectionIcons[section];
  const isPreferred = preferredSection === section;
  const userLevel = user?.[`${section}_level`] || 'A1';

  return (
    <Card className={`hover:shadow-lg transition-all duration-300 ${isPrimary ? 'ring-2 ring-blue-500' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${sectionColors[section]}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg capitalize">{section}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Level {userLevel}</Badge>
                {isPreferred && hasSession && (
                  <Badge variant="outline" className="text-xs">Most Practiced</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <Link to={createPageUrl(`Practice?start=${section}`)}>
          <Button className={`w-full ${isPrimary ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}`}>
            <Play className="w-4 h-4 mr-2" />
            Start Practice
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}