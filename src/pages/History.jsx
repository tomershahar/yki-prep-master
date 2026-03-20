import React, { useState, useEffect, useRef, useCallback } from "react";
import { User } from "@/entities/User";
import { PracticeSession } from "@/entities/PracticeSession";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History as HistoryIcon, BookOpen, Headphones, Mic, PenTool, Clock, MessageSquare, Calendar, Trash2 } from "lucide-react";
import { Loader2 } from "lucide-react";
import YKIScoreBadge from "../components/exam/YKIScoreBadge";

const sectionIcons = {
  reading: BookOpen,
  listening: Headphones,
  speaking: Mic,
  writing: PenTool
};

const sectionColors = {
  reading: "text-amber-600 bg-amber-50",
  listening: "text-blue-600 bg-blue-50", 
  speaking: "text-green-600 bg-green-50",
  writing: "text-purple-600 bg-purple-50"
};

function SwipeableCard({ session, onDelete, children }) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const startX = useRef(null);
  const longPressTimer = useRef(null);
  const DELETE_THRESHOLD = -80;

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    longPressTimer.current = setTimeout(() => {
      setIsDeleting(true);
    }, 600);
  };

  const handleTouchMove = (e) => {
    if (startX.current === null) return;
    clearTimeout(longPressTimer.current);
    const diff = e.touches[0].clientX - startX.current;
    if (diff < 0) {
      setIsDragging(true);
      setOffsetX(Math.max(diff, -120));
    }
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
    if (offsetX < DELETE_THRESHOLD) {
      setIsDeleting(true);
    } else {
      setOffsetX(0);
    }
    setIsDragging(false);
    startX.current = null;
  };

  const confirmDelete = async () => {
    await onDelete(session.id);
  };

  const cancelDelete = () => {
    setIsDeleting(false);
    setOffsetX(0);
  };

  if (isDeleting) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-red-200 bg-red-50">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trash2 className="w-5 h-5 text-red-500" />
            <span className="text-red-700 font-medium">Delete this session?</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={cancelDelete}>Cancel</Button>
            <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white" onClick={confirmDelete}>Delete</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete background */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-end px-6 bg-red-500 rounded-xl">
        <Trash2 className="w-6 h-6 text-white" />
      </div>
      {/* Card */}
      <div
        style={{ transform: `translateX(${offsetX}px)`, transition: isDragging ? 'none' : 'transform 0.3s ease' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistoryData();
  }, []);

  const loadHistoryData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Get sessions from last 2 months
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

      const allSessions = await PracticeSession.filter(
        { created_by: currentUser.email },
        '-created_date',
        500 // Limit to recent 500 sessions for performance
      );

      // Filter to last 2 months
      const recentSessions = allSessions.filter(session => {
        const sessionDate = new Date(session.created_date);
        return sessionDate >= twoMonthsAgo;
      });

      setSessions(recentSessions);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async (sessionId) => {
    await PracticeSession.delete(sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const getPassingStatus = (score) => {
    return score >= 75;
  };

  const FeedbackDialog = ({ session }) => {
    const parseFeedback = (feedback) => {
      if (!feedback) return null;
      
      // Handle both object and string feedback
      if (typeof feedback === 'string') {
        try {
          return JSON.parse(feedback);
        } catch {
          return { general: feedback };
        }
      }
      return feedback;
    };

    const feedbackData = parseFeedback(session.feedback);
    const detailedFeedbackData = parseFeedback(session.detailed_feedback);

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            View Feedback
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {React.createElement(sectionIcons[session.exam_section], { className: "w-5 h-5" })}
              {session.exam_section.charAt(0).toUpperCase() + session.exam_section.slice(1)} - Session Feedback
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Session Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Session Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="col-span-2 mb-2">
                    <span className="text-gray-600">Score:</span>
                    <div className="mt-2">
                      <YKIScoreBadge score={session.score} />
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Level:</span>
                    <span className="ml-2 font-medium">{session.difficulty_level}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <span className="ml-2 font-medium">{session.duration_minutes} min</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Questions:</span>
                    <span className="ml-2 font-medium">{session.questions_correct}/{session.questions_attempted}</span>
                  </div>
                </div>
              </div>

              {/* General Feedback */}
              {feedbackData && (
                <div>
                  <h3 className="font-semibold mb-3">AI Feedback</h3>
                  <div className="space-y-3">
                    {feedbackData.strengths && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-1">Strengths</h4>
                        <p className="text-green-700 text-sm">{String(feedbackData.strengths)}</p>
                      </div>
                    )}
                    {feedbackData.weaknesses && (
                      <div className="bg-red-50 p-3 rounded-lg">
                        <h4 className="font-medium text-red-800 mb-1">Areas for Improvement</h4>
                        <p className="text-red-700 text-sm">{String(feedbackData.weaknesses)}</p>
                      </div>
                    )}
                    {feedbackData.general && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-1">General Feedback</h4>
                        <p className="text-blue-700 text-sm">{String(feedbackData.general)}</p>
                      </div>
                    )}
                    {feedbackData.recommendations && (
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <h4 className="font-medium text-yellow-800 mb-1">Recommendations</h4>
                        <p className="text-yellow-700 text-sm">{String(feedbackData.recommendations)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Detailed Feedback (for Writing/Speaking) */}
              {detailedFeedbackData && (
                <div>
                  <h3 className="font-semibold mb-3">Detailed Task Feedback</h3>
                  <div className="space-y-3">
                    {Object.entries(detailedFeedbackData).map(([key, value], index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="font-medium mb-2 capitalize">{key.replace('_', ' ')}</h4>
                        <div className="text-sm text-gray-700">
                          {typeof value === 'object' && value !== null ? (
                            <div className="space-y-1">
                              {Object.entries(value).map(([subKey, subValue]) => (
                                <div key={subKey}>
                                  <span className="font-medium">{subKey.replace('_', ' ')}:</span> {String(subValue)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            String(value || '')
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User Answers (if available) */}
              {session.answers && Object.keys(session.answers).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Your Responses</h3>
                  <div className="space-y-2">
                    {Object.entries(session.answers).map(([question, answer], index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg text-sm">
                        <div className="font-medium mb-1">Question {index + 1}:</div>
                        <div className="text-gray-700">{String(answer || '')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Feedback Available */}
              {!feedbackData && !detailedFeedbackData && (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No detailed feedback available for this session.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading your practice history...</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
          <HistoryIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Practice History</h1>
          <p className="text-gray-600">Review your past practice sessions and AI feedback from the last 2 months</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{sessions.length}</div>
            <div className="text-sm text-gray-600">Total Sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {sessions.filter(s => getPassingStatus(s.score)).length}
            </div>
            <div className="text-sm text-gray-600">Passed (≥75%)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">
              {sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length) : 0}%
            </div>
            <div className="text-sm text-gray-600">Average Score</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(sessions.reduce((sum, s) => sum + s.duration_minutes, 0) / 60)}h
            </div>
            <div className="text-sm text-gray-600">Total Practice Time</div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <HistoryIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Practice History Yet</h3>
            <p className="text-gray-500">Complete some practice sessions to see your history here!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const SectionIcon = sectionIcons[session.exam_section];
            const isPassing = getPassingStatus(session.score);
            
            return (
              <Card key={session.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${sectionColors[session.exam_section]}`}>
                        <SectionIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold capitalize">
                          {session.exam_section} {session.session_type === 'practice' ? 'Practice' : 'Full Exam'}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(session.created_date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {session.duration_minutes} min
                          </div>
                          <Badge variant="outline">{session.difficulty_level}</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <YKIScoreBadge score={session.score} />
                        <div className="text-xs text-gray-500 mt-2">
                          {session.questions_correct}/{session.questions_attempted} correct
                        </div>
                      </div>
                      
                      <FeedbackDialog session={session} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}