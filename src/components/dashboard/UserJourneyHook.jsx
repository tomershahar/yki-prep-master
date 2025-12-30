import { useState, useEffect } from 'react';
import { PracticeSession } from '@/entities/PracticeSession';
import { UserVisit } from '@/entities/UserVisit';

export function useUserJourney(user) {
  const [journeyData, setJourneyData] = useState({
    hasVisited: false,
    hasSession: false,
    hasFullExam: false,
    hasPractice: false,
    totalSessions: 0,
    lastSessionDate: null,
    preferredSection: null,
    isFirstTimeUser: true,
    isLoading: true
  });

  useEffect(() => {
    if (!user) {
      setJourneyData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const loadJourneyData = async () => {
      try {
        console.log('Loading journey data for user:', user.email);
        
        const [sessions, visits] = await Promise.all([
          PracticeSession.filter({ created_by: user.email }, '-created_date', 50).catch(() => []),
          UserVisit.filter({ user_id: user.id }, '-timestamp', 10).catch(() => [])
        ]);

        console.log('Sessions loaded:', sessions?.length || 0);
        console.log('Visits loaded:', visits?.length || 0);

        const safeSessions = Array.isArray(sessions) ? sessions : [];
        const safeVisits = Array.isArray(visits) ? visits : [];

        const fullExamSessions = safeSessions.filter(s => s && s.session_type === 'full_exam');
        const practiceSessions = safeSessions.filter(s => s && s.session_type === 'practice');
        
        // Find most practiced section
        const sectionCounts = {};
        safeSessions.forEach(session => {
          if (session && session.exam_section) {
            const section = session.exam_section;
            sectionCounts[section] = (sectionCounts[section] || 0) + 1;
          }
        });
        
        const preferredSection = Object.keys(sectionCounts).reduce((a, b) => 
          sectionCounts[a] > sectionCounts[b] ? a : b, null
        );

        const newJourneyData = {
          hasVisited: safeVisits.length > 0,
          hasSession: safeSessions.length > 0,
          hasFullExam: fullExamSessions.length > 0,
          hasPractice: practiceSessions.length > 0,
          totalSessions: safeSessions.length,
          lastSessionDate: safeSessions.length > 0 ? safeSessions[0].created_date : null,
          preferredSection,
          isFirstTimeUser: safeSessions.length === 0 && safeVisits.length <= 1,
          isLoading: false
        };

        console.log('Journey data calculated:', newJourneyData);
        setJourneyData(newJourneyData);
      } catch (error) {
        console.error('Error loading user journey:', error);
        setJourneyData({
          hasVisited: false,
          hasSession: false,
          hasFullExam: false,
          hasPractice: false,
          totalSessions: 0,
          lastSessionDate: null,
          preferredSection: null,
          isFirstTimeUser: true,
          isLoading: false
        });
      }
    };

    loadJourneyData();
  }, [user?.id, user?.email]); // Only depend on user ID and email

  return journeyData;
}