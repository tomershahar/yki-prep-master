import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { resetBetaStatus } from '@/functions/resetBetaStatus';
import { User } from '@/entities/User';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TestBetaReset() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [user, setUser] = useState(null);

    React.useEffect(() => {
        const checkUser = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
                if (currentUser.role !== 'admin') {
                    navigate(createPageUrl('Dashboard'));
                }
            } catch (error) {
                navigate(createPageUrl('Dashboard'));
            }
        };
        checkUser();
    }, [navigate]);

    const handleReset = async () => {
        setIsLoading(true);
        setMessage('');
        
        try {
            const { data } = await resetBetaStatus();
            setMessage(data.message);
            
            // After 3 seconds, redirect to dashboard to trigger beta disclaimer
            setTimeout(() => {
                window.location.href = createPageUrl('Dashboard');
            }, 3000);
            
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user || user.role !== 'admin') {
        return <div>Loading...</div>;
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Beta Disclaimer Testing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-600">
                        This will reset your beta agreement status so you can test the beta disclaimer page.
                    </p>
                    
                    {message && (
                        <Alert>
                            <AlertDescription>{message}</AlertDescription>
                        </Alert>
                    )}
                    
                    <Button 
                        onClick={handleReset} 
                        disabled={isLoading}
                        className="w-full"
                    >
                        {isLoading ? 'Resetting...' : 'Reset My Beta Status (For Testing)'}
                    </Button>
                    
                    <p className="text-sm text-gray-500">
                        After clicking, you'll be redirected to the dashboard where you should see the beta disclaimer.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}