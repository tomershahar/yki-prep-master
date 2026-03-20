import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

const LEVEL_COLORS = {
  A1: 'bg-blue-100 text-blue-800',
  A2: 'bg-green-100 text-green-800',
  B1: 'bg-yellow-100 text-yellow-800',
  B2: 'bg-purple-100 text-purple-800',
};

export default function AssessmentResultCard({ level, reasoning }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="w-6 h-6 text-green-600" />
        <div>
          <p className="font-semibold text-gray-800">Assessment Complete!</p>
          <p className="text-sm text-gray-500">Your recommended level:</p>
        </div>
        <Badge className={`ml-auto text-lg px-3 py-1 ${LEVEL_COLORS[level] || ''}`}>{level}</Badge>
      </div>
      {reasoning && (
        <p className="text-sm text-gray-600 leading-relaxed border-t border-green-200 pt-3">
          {reasoning}
        </p>
      )}
    </div>
  );
}