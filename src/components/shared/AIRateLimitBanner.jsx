import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Zap } from 'lucide-react';

export default function AIRateLimitBanner({ error }) {
    if (!error || error.error !== 'Rate limit exceeded') return null;

    const minutesText = error.minutesUntilReset === 1 
        ? '1 minute' 
        : `${error.minutesUntilReset} minutes`;

    return (
        <Alert className="mb-4 border-amber-300 bg-amber-50">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
                <div className="flex items-start gap-2">
                    <Zap className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-medium mb-1">AI Call Limit Reached</p>
                        <p className="text-sm">
                            You've used all 10 AI-powered grading calls for this hour. 
                            This helps us manage costs and ensure fair access for everyone.
                        </p>
                        <p className="text-sm mt-2 font-medium">
                            ⏰ You can continue practicing in <span className="text-amber-900">{minutesText}</span>
                        </p>
                    </div>
                </div>
            </AlertDescription>
        </Alert>
    );
}