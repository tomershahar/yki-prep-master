
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Users, ArrowRight, X } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function BetaDisclaimer() {
  const navigate = useNavigate();
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAgree = async () => {
    if (!hasAgreed) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Starting beta agreement process...');
      
      // First, let's get the current user data.
      // Any failure here will be caught by the outer try-catch.
      const currentUser = await User.me();
      console.log('Current user found:', {
        email: currentUser.email,
        id: currentUser.id,
        full_name: currentUser.full_name,
        role: currentUser.role,
        target_language: currentUser.target_language
      });
      
      const updateData = {
        has_agreed_to_beta_terms: true,
        beta_agreement_date: new Date().toISOString(),
      };

      // The only required field in the User schema is 'target_language'.
      // A new user record will be invalid without it. We set a default
      // here to ensure the record becomes valid upon this update.
      // All other fields have defaults in the schema and will be handled
      // by the backend or the onboarding process.
      if (!currentUser.target_language) {
        console.log('Target language is missing, setting default "finnish" to ensure user record validity.');
        updateData.target_language = 'finnish';
      }
      
      console.log('Sending minimal update to validate user:', updateData);
      await User.updateMyUserData(updateData);
      console.log('Beta terms agreement saved successfully');

      // Refresh user data to check onboarding status
      let updatedUser;
      try {
        updatedUser = await User.me();
        console.log('Updated user data retrieved successfully');
      } catch (refreshError) {
        console.error('Failed to refresh user data after update:', refreshError);
        // Fallback to existing user data + update if refresh fails
        updatedUser = { ...currentUser, ...updateData };
      }
      
      if (updatedUser.has_completed_onboarding) {
        console.log('User has completed onboarding, navigating to Dashboard');
        navigate(createPageUrl('Dashboard'));
      } else {
        console.log('User has not completed onboarding, navigating to Onboarding');
        navigate(createPageUrl('Onboarding'));
      }
    } catch (error) {
      console.error('Beta agreement process failed:', error);
      
      let errorMessage = 'An error occurred while saving your agreement.';
      if (error.message?.includes('422') || error.status === 422) {
        errorMessage = `Account Validation Error (422)\n\nWe couldn't set up your user profile. This can sometimes happen on first login.\n\nPlease try the following:\n\n1. Log out and log back in.\n2. If you used Microsoft, try a different login method (e.g., Google) for a new account.\n3. Contact support if the issue persists.`;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisagree = async () => {
    try {
      await User.logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2 bg-amber-100 text-amber-800">
                BETA VERSION
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Welcome to YKI Prep Master Beta
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Please read and accept our beta terms to continue
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-red-800 mb-1">Error</h4>
                    <p className="text-red-700 text-sm whitespace-pre-line">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-800 mb-2">Beta Software Notice</h3>
                  <p className="text-amber-700 text-sm leading-relaxed">
                    This is a beta version of the app. Some features are still under development, and the content is generated using AI, which may sometimes produce errors or inaccuracies. Please use your own judgment when using the app, especially for exam preparation.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-800 mb-2">Privacy & Data Collection</h3>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    We only store minimal user data — specifically your name, email, selected language, and proficiency level — to personalize your experience. We do not collect or store any other personal information.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Users className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-800 mb-2">Your Feedback Matters</h3>
                  <p className="text-green-700 text-sm leading-relaxed">
                    Your feedback is welcome and valuable as we continue to improve the app. Use the feedback button in the app to share your thoughts and suggestions.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-4">
              <Checkbox 
                id="agree" 
                checked={hasAgreed} 
                onCheckedChange={setHasAgreed}
              />
              <label 
                htmlFor="agree" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I have read and agree to the beta terms and conditions
              </label>
            </div>

            <div className="flex gap-4 pt-6">
              <Button 
                variant="outline" 
                onClick={handleDisagree}
                className="flex-1"
                disabled={isLoading}
              >
                <X className="w-4 h-4 mr-2" />
                Disagree & Exit
              </Button>
              <Button 
                onClick={handleAgree}
                disabled={!hasAgreed || isLoading}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                {isLoading ? (
                  "Processing..."
                ) : (
                  <>
                    Agree & Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
