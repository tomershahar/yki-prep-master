
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Construction, Zap } from "lucide-react"; // Added Zap
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "@/components/ui/use-toast";

export default function ExamPoolManager() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      if (currentUser.role !== 'admin') {
        toast({
          title: "Access Denied",
          description: "This page is only available to administrators.",
          variant: "destructive",
          duration: 5000,
        });
        navigate(createPageUrl("Dashboard"));
        return;
      }
    } catch (error) {
      console.error("Error checking access:", error);
      navigate(createPageUrl("Dashboard"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. This page is only available to administrators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Exam Pool Manager</h1>
          <p className="text-gray-600 dark:text-gray-400">Pre-generate and manage exam content for faster user experience</p>
        </div>
      </div>

      <Alert>
        <Construction className="h-4 w-4" />
        <AlertDescription>
          <strong>System Setup in Progress</strong><br/>
          The GeneratedExam entity is being initialized. This page will be fully functional once the database schema is ready. 
          In the meantime, practice exams are being generated on-demand.
        </AlertDescription>
      </Alert>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Practice System Active</h3>
              <p className="text-blue-700 text-sm">
                Users can currently access practice exams through on-demand generation. 
                The system generates fresh content for each practice session.
              </p>
            </div>
            
            <div className="p-4 bg-amber-50 rounded-lg">
              <h3 className="font-semibold text-amber-900 mb-2">Pool System Coming Soon</h3>
              <p className="text-amber-700 text-sm">
                The automated exam pool system will be available once the GeneratedExam entity is fully initialized. 
                This will provide instant access to pre-generated exams.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <Button 
              onClick={() => navigate(createPageUrl("Practice"))}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
            >
              Go to Practice Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
