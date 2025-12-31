/**
 * YKI Official Scoring System (Levels 1-6)
 * 
 * Level 1: Below A2 (0-40%)
 * Level 2: A2 (41-55%)
 * Level 3: B1.1 (56-70%)
 * Level 4: B1.2 (71-82%)
 * Level 5: B2 (83-92%)
 * Level 6: Above B2/C1 (93-100%)
 */

export const scoreToYKILevel = (score) => {
    if (score <= 40) return 1;
    if (score <= 55) return 2;
    if (score <= 70) return 3;
    if (score <= 82) return 4;
    if (score <= 92) return 5;
    return 6;
};

export const ykiLevelToCEFR = (level) => {
    const mapping = {
        1: 'Below A2',
        2: 'A2',
        3: 'B1.1',
        4: 'B1.2',
        5: 'B2',
        6: 'C1'
    };
    return mapping[level] || 'Unknown';
};

export const getYKILevelColor = (level) => {
    const colors = {
        1: 'text-red-600 bg-red-50 border-red-200',
        2: 'text-orange-600 bg-orange-50 border-orange-200',
        3: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        4: 'text-blue-600 bg-blue-50 border-blue-200',
        5: 'text-green-600 bg-green-50 border-green-200',
        6: 'text-purple-600 bg-purple-50 border-purple-200'
    };
    return colors[level] || 'text-gray-600 bg-gray-50 border-gray-200';
};

export const getYKILevelDescription = (level) => {
    const descriptions = {
        1: 'Developing skills - Keep practicing basic communication',
        2: 'Basic proficiency - Can handle simple everyday situations',
        3: 'Independent user - Can deal with most situations',
        4: 'Proficient user - Can interact with fluency',
        5: 'Advanced user - Can use language flexibly and effectively',
        6: 'Mastery level - Can express ideas fluently and precisely'
    };
    return descriptions[level] || '';
};