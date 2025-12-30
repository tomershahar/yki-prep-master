
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { ExamContent } from "@/entities/ExamContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Headphones, Mic, PenTool, Lightbulb, BarChart, Link as LinkIcon } from "lucide-react";
import ReactMarkdown from 'react-markdown';

const sectionDetails = {
  reading: { icon: BookOpen, color: 'text-amber-600', name: 'Reading' },
  listening: { icon: Headphones, color: 'text-blue-600', name: 'Listening' },
  speaking: { icon: Mic, color: 'text-green-600', name: 'Speaking' },
  writing: { icon: PenTool, color: 'text-purple-600', name: 'Writing' }
};

const contentTypeDetails = {
    exam: { icon: BookOpen, name: 'Sample Exam' },
    tips: { icon: Lightbulb, name: 'Tips & Strategies' },
    scoring: { icon: BarChart, name: 'Scoring Guide' },
    resources: { icon: LinkIcon, name: 'Helpful Resources' }
};

export default function ExamContentPage() {
  const [user, setUser] = useState(null);
  const [content, setContent] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      const examContent = await ExamContent.filter({ language: currentUser.target_language || 'finnish' });
      
      const groupedContent = examContent.reduce((acc, item) => {
        const section = item.section;
        if (!acc[section]) {
          acc[section] = [];
        }
        acc[section].push(item);
        return acc;
      }, {});

      setContent(groupedContent);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContentItem = (item) => (
    <Card key={item.id} className="mb-4 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            {React.createElement(contentTypeDetails[item.content_type].icon, { className: "w-5 h-5" })}
            <span>{item.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose max-w-none">
          <ReactMarkdown
            components={{
                a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" />
            }}
          >
            {item.body_markdown}
          </ReactMarkdown>
        </div>
        {item.image_url && <img src={item.image_url} alt="Practice prompt" className="mt-4 rounded-lg shadow-lg" />}
        {item.audio_url && (
            <div className="mt-4">
                <audio controls src={item.audio_url} className="w-full">Your browser does not support the audio element.</audio>
                <p className="text-xs text-gray-500 mt-1">Audio from YLE. <a href={item.audio_url} target="_blank" rel="noopener noreferrer" className="underline">Open in new tab</a>.</p>
            </div>
        )}
        {item.questions && (
            <div className="mt-6 space-y-4">
                <h3 className="font-bold">Questions:</h3>
                {item.questions.map((q, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                        <p className="font-semibold mb-2">{index + 1}. {q.text}</p>
                        <p className="text-sm text-green-700 bg-green-50 p-2 rounded">Correct Answer: {q.correct_answer}</p>
                    </div>
                ))}
            </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <div className="p-8 text-center">Loading study materials...</div>;
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Study Materials</h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Comprehensive study materials and official resources to help you prepare for the YKI exam
        </p>
        <div className="flex items-center justify-center gap-4">
          <Badge variant="secondary" className="text-sm">Language: {user?.target_language === 'finnish' ? 'Finnish' : 'Swedish'}</Badge>
          <Badge variant="outline" className="text-sm">Official YKI Resources</Badge>
        </div>
      </div>

      <Tabs defaultValue="reading" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          {Object.keys(sectionDetails).map(section => (
            <TabsTrigger key={section} value={section} className="flex items-center gap-2">
              {React.createElement(sectionDetails[section].icon, { className: `w-4 h-4 ${sectionDetails[section].color}` })}
              {sectionDetails[section].name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {Object.keys(sectionDetails).map(section => (
          <TabsContent key={section} value={section} className="mt-6">
            <Accordion type="single" collapsible className="w-full" defaultValue="item-exam">
                {content[section]?.sort((a,b) => a.content_type.localeCompare(b.content_type)).map(item => (
                    <AccordionItem key={item.id} value={`item-${item.content_type}`}>
                        <AccordionTrigger className="text-lg font-semibold flex items-center gap-3">
                           {React.createElement(contentTypeDetails[item.content_type].icon, { className: "w-5 h-5" })}
                           {contentTypeDetails[item.content_type].name}
                        </AccordionTrigger>
                        <AccordionContent>
                           {renderContentItem(item)}
                        </AccordionContent>
                    </AccordionItem>
                ))}
                 <AccordionItem value="item-resources">
                    <AccordionTrigger className="text-lg font-semibold flex items-center gap-3">
                        <LinkIcon className="w-5 h-5" />
                        Official Resources
                    </AccordionTrigger>
                    <AccordionContent>
                        {content.resources ? renderContentItem(content.resources[0]) : <p>No resources found.</p>}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
