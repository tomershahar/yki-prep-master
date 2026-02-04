import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@/entities/User';
import { PracticeSession } from '@/entities/PracticeSession';
import { Achievement } from '@/entities/Achievement';
import { TestConfiguration } from '@/entities/TestConfiguration';
import { WordBankEntry } from '@/entities/WordBankEntry';
import { AgentRecommendation } from '@/entities/AgentRecommendation';

// Query Keys
export const QUERY_KEYS = {
  user: ['user'],
  sessions: (email) => ['sessions', email],
  achievements: ['achievements'],
  testConfig: (country, test) => ['testConfig', country, test],
  wordBank: ['wordBank'],
  recommendations: ['recommendations'],
};

/**
 * Hook for fetching current user data with caching
 * Refetches on window focus to keep user data fresh
 */
export function useUser() {
  return useQuery({
    queryKey: QUERY_KEYS.user,
    queryFn: async () => {
      try {
        return await User.me();
      } catch (error) {
        // Handle unauthenticated users gracefully
        if (error.message?.includes('not authenticated') || error.message?.includes('unauthorized')) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for fetching user's practice sessions
 * Cached with user email as dependency
 */
export function usePracticeSessions(userEmail, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.sessions(userEmail),
    queryFn: () => PracticeSession.filter({ created_by: userEmail }),
    enabled: enabled && !!userEmail,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching all achievements
 * Rarely changes, so can be cached longer
 */
export function useAchievements() {
  return useQuery({
    queryKey: QUERY_KEYS.achievements,
    queryFn: () => Achievement.list(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook for fetching test configuration
 * Cached by country and test type
 */
export function useTestConfiguration(country, testName, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.testConfig(country, testName),
    queryFn: async () => {
      const configs = await TestConfiguration.filter({
        country_code: country,
        test_name: testName,
        is_active: true,
      });
      return configs?.[0] || null;
    },
    enabled: enabled && !!country && !!testName,
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook for fetching word bank entries
 */
export function useWordBank(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.wordBank,
    queryFn: () => WordBankEntry.list('-created_date'),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching agent recommendations
 */
export function useRecommendations(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.recommendations,
    queryFn: () => AgentRecommendation.filter({ is_active: true }, '-priority', 10),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for updating user data with automatic cache invalidation
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => User.updateMyUserData(data),
    onSuccess: () => {
      // Invalidate user query to refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user });
    },
  });
}

/**
 * Hook for creating practice session with cache invalidation
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionData) => PracticeSession.create(sessionData),
    onSuccess: (_, variables) => {
      // Invalidate sessions for the user who created it
      const userEmail = variables.created_by || 'unknown';
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions(userEmail) });
    },
  });
}

/**
 * Hook for deleting word bank entry with cache update
 */
export function useDeleteWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (wordId) => WordBankEntry.delete(wordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wordBank });
    },
  });
}

/**
 * Hook for creating word bank entry with cache update
 */
export function useCreateWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (wordData) => WordBankEntry.create(wordData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wordBank });
    },
  });
}