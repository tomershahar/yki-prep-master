/**
 * YKI Practice Level Assessment
 * Returns the CEFR level demonstrated by the score within the practice difficulty
 * 
 * This assesses mastery WITHIN the current level:
 * - 0-49%: Below current level
 * - 50-74%: At current level (basic)
 * - 75-89%: At current level (proficient)
 * - 90-100%: At current level (mastery)
 */

export const scoreToYKILevel = (score, practiceDifficulty = 'A1') => {
    // Map practice difficulty to base CEFR levels
    const difficultyMap = {
        'A1': 'A1',
        'A2': 'A2', 
        'B1': 'B1',
        'B2': 'B2'
    };
    
    const currentLevel = difficultyMap[practiceDifficulty] || 'A1';
    
    // Return the current level they're practicing at - 
    // high scores mean mastery of THAT level, not promotion to next level
    if (score < 50) return `Below ${currentLevel}`;
    if (score < 75) return `${currentLevel} (Basic)`;
    if (score < 90) return `${currentLevel} (Proficient)`;
    return `${currentLevel} (Mastery)`;
};

export const ykiLevelToCEFR = (level) => {
    // Level is now a string like "A2 (Mastery)" so just return it
    return level;
};

export const getYKILevelColor = (level) => {
    // Extract base level from string like "A2 (Mastery)"
    if (level.includes('Below')) return 'text-red-600 bg-red-50 border-red-200';
    if (level.includes('Basic')) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (level.includes('Proficient')) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (level.includes('Mastery')) return 'text-green-600 bg-green-50 border-green-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
};

export const getYKILevelDescription = (level) => {
    if (level.includes('Below')) return 'Keep practicing - Review fundamentals at this level';
    if (level.includes('Basic')) return 'Good start - Developing proficiency at this level';
    if (level.includes('Proficient')) return 'Well done - Solid understanding at this level';
    if (level.includes('Mastery')) return 'Excellent - Strong mastery at this level';
    return '';
};