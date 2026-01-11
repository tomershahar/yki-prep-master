import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, TrendingUp } from 'lucide-react';
import { scoreToYKILevel, ykiLevelToCEFR, getYKILevelColor, getYKILevelDescription } from '../shared/ykiScoring';

export default function YKIScoreBadge({ score, showDetails = false, size = 'default', practiceDifficulty = 'A1' }) {
    const ykiLevel = scoreToYKILevel(score, practiceDifficulty);
    const cefrLevel = ykiLevelToCEFR(ykiLevel);
    const colorClass = getYKILevelColor(ykiLevel);
    const description = getYKILevelDescription(ykiLevel);

    if (!showDetails) {
        return (
            <Badge className={`${colorClass} border font-semibold ${size === 'large' ? 'text-lg px-4 py-2' : ''}`}>
                {ykiLevel}
            </Badge>
        );
    }

    return (
        <Card className={`${colorClass} border-2`}>
            <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                    <Trophy className="w-8 h-8" />
                    <div>
                        <div className="text-2xl font-bold">{ykiLevel}</div>
                        <div className="text-sm opacity-80">at {practiceDifficulty} level</div>
                    </div>
                </div>
                <p className="text-sm mb-2">{description}</p>
                <div className="flex items-center gap-2 text-xs opacity-70">
                    <TrendingUp className="w-3 h-3" />
                    <span>Raw score: {score}%</span>
                </div>
            </CardContent>
        </Card>
    );
}