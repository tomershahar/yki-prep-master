
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { EvaluationReport } from "@/entities/EvaluationReport";
import { evaluateReadingModel } from "@/functions/evaluateReadingModel";
import { evaluateWritingModel } from "@/functions/evaluateWritingModel";
import { evaluateListeningModel } from "@/functions/evaluateListeningModel";
import { evaluateSpeakingModel } from "@/functions/evaluateSpeakingModel"; // Import new function
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Wand2, BookOpen, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReactMarkdown from 'react-markdown';

const ScoreCard = ({ title, score, children }) => (
    <Card>
        <CardHeader className="pb-2">
            <CardTitle className="text-lg">{title}</CardTitle>
            <div className="flex items-center gap-2 pt-2">
                <Progress value={score} className="w-full h-3" />
                <span className="font-bold text-lg">{score}%</span>
            </div>
        </CardHeader>
        <CardContent>
            <div className="prose prose-sm text-gray-600">
                <ReactMarkdown>{children}</ReactMarkdown>
            </div>
        </CardContent>
    </Card>
);

export default function ModelEvaluation() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isAccessLoading, setIsAccessLoading] = useState(true);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [evaluationParams, setEvaluationParams] = useState({
        language: 'finnish',
        difficulty: 'B1',
        model_type: 'reading' // Default value
    });
    const [recentReport, setRecentReport] = useState(null);
    const [pastReports, setPastReports] = useState([]);

    useEffect(() => {
        const checkAccess = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
                if (currentUser.role !== 'admin') {
                    navigate(createPageUrl("Dashboard"));
                    return;
                }
                loadPastReports();
            } catch (error) {
                navigate(createPageUrl("Dashboard"));
            } finally {
                setIsAccessLoading(false);
            }
        };
        checkAccess();
    }, [navigate]);

    const loadPastReports = async () => {
        const reports = await EvaluationReport.list('-created_date', 10);
        setPastReports(reports || []);
    };

    const handleRunEvaluation = async () => {
        setIsEvaluating(true);
        setRecentReport(null);
        try {
            let reportData;
            if (evaluationParams.model_type === 'reading') {
                const { data } = await evaluateReadingModel(evaluationParams);
                reportData = data;
            } else if (evaluationParams.model_type === 'writing') {
                const { data } = await evaluateWritingModel(evaluationParams);
                reportData = data;
            } else if (evaluationParams.model_type === 'listening') { // Add new case
                const { data } = await evaluateListeningModel(evaluationParams);
                reportData = data;
            } else if (evaluationParams.model_type === 'speaking') { // Add new case
                const { data } = await evaluateSpeakingModel(evaluationParams);
                reportData = data;
            }
            setRecentReport(reportData);
            loadPastReports(); // Refresh the list of past reports
        } catch (error) {
            console.error("Evaluation failed:", error);
            alert(`Evaluation failed: ${error.message}`);
        } finally {
            setIsEvaluating(false);
        }
    };

    if (isAccessLoading) {
        return <div className="p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
                    <Wand2 className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Model Evaluation</h1>
                    <p className="text-gray-600 dark:text-gray-400">Test and evaluate AI content generation quality across different sections and levels</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BookOpen /> AI Model Evaluation</CardTitle>
                    <CardDescription>Run a live evaluation to assess AI model performance on specific levels and content types.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4 items-center">
                    <Select value={evaluationParams.model_type} onValueChange={(v) => setEvaluationParams(p => ({...p, model_type: v}))}>
                        <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Model Type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="reading">Reading Model</SelectItem>
                            <SelectItem value="writing">Writing Model</SelectItem>
                            <SelectItem value="listening">Listening Model</SelectItem>
                            <SelectItem value="speaking">Speaking Model</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={evaluationParams.language} onValueChange={(v) => setEvaluationParams(p => ({...p, language: v}))}>
                        <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Language" /></SelectTrigger>
                        <SelectContent><SelectItem value="finnish">Finnish</SelectItem><SelectItem value="swedish">Swedish</SelectItem></SelectContent>
                    </Select>
                    <Select value={evaluationParams.difficulty} onValueChange={(v) => setEvaluationParams(p => ({...p, difficulty: v}))}>
                        <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Difficulty" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="A1">A1</SelectItem><SelectItem value="A2">A2</SelectItem>
                            <SelectItem value="B1">B1</SelectItem><SelectItem value="B2">B2</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleRunEvaluation} disabled={isEvaluating} className="w-full md:w-auto">
                        {isEvaluating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Evaluating...</> : "Run Evaluation"}
                    </Button>
                </CardContent>
            </Card>

            {isEvaluating && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Evaluation in Progress</AlertTitle>
                    <AlertDescription>
                        {evaluationParams.model_type === 'reading' 
                            ? "The AI is generating and then evaluating a new reading practice test. This may take up to a minute."
                            : evaluationParams.model_type === 'writing'
                            ? "The AI is generating writing tasks, grading sample responses, and evaluating the grading accuracy. This may take up to 2 minutes."
                            : evaluationParams.model_type === 'listening'
                            ? "The AI is generating a listening script and questions, then evaluating the exercise quality. This may take up to 90 seconds."
                            : "The AI is generating a speaking prompt, simulating a response, and then evaluating that response. This may take up to 90 seconds."
                        } Please wait.
                    </AlertDescription>
                </Alert>
            )}

            {recentReport && (
                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-gray-50 to-blue-50">
                        <CardHeader>
                            <CardTitle>Evaluation Complete: {recentReport.model_type.charAt(0).toUpperCase() + recentReport.model_type.slice(1)} Model - {recentReport.language.charAt(0).toUpperCase() + recentReport.language.slice(1)} {recentReport.difficulty_level}</CardTitle>
                            <CardDescription>Generated on {new Date(recentReport.created_date).toLocaleString()}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-gray-600">Overall Score</p>
                            <p className="text-7xl font-bold text-indigo-600">{recentReport.score}%</p>
                            <p className="font-medium text-gray-700 mt-2">{recentReport.report_summary.final_verdict}</p>
                        </CardContent>
                    </Card>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(recentReport.detailed_breakdown).map(([key, value]) => (
                            <ScoreCard key={key} title={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} score={value.score}>
                                {value.assessment}
                            </ScoreCard>
                        ))}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Card><CardHeader><CardTitle>Strengths</CardTitle></CardHeader><CardContent className="prose prose-sm"><ReactMarkdown>{recentReport.report_summary.strengths}</ReactMarkdown></CardContent></Card>
                        <Card><CardHeader><CardTitle>Weaknesses</CardTitle></CardHeader><CardContent className="prose prose-sm"><ReactMarkdown>{recentReport.report_summary.weaknesses}</ReactMarkdown></CardContent></Card>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card><CardHeader><CardTitle>Recommendations</CardTitle></CardHeader><CardContent className="prose prose-sm"><ReactMarkdown>{recentReport.recommendations}</ReactMarkdown></CardContent></Card>
                        {recentReport.improved_prompt && (
                            <Card><CardHeader><CardTitle>🔧 Improved Prompt (Ready to Use)</CardTitle></CardHeader><CardContent className="bg-gray-50 p-4 rounded-lg"><pre className="whitespace-pre-wrap text-sm overflow-x-auto">{recentReport.improved_prompt}</pre><Button className="mt-3" onClick={() => navigator.clipboard.writeText(recentReport.improved_prompt)}>Copy Improved Prompt</Button></CardContent></Card>
                        )}
                    </div>
                    
                    <Card><CardHeader><CardTitle>Generated Content Sample</CardTitle></CardHeader><CardContent className="prose prose-sm bg-gray-50 p-4 rounded-lg"><pre className="whitespace-pre-wrap">{JSON.stringify(recentReport.generated_content, null, 2)}</pre></CardContent></Card>
                </div>
            )}
            
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText /> Past Evaluation Reports</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pastReports.length > 0 ? pastReports.map(report => (
                    <div key={report.id} className="flex justify-between items-center p-2 border rounded-md">
                      <div>
                        <span className="font-semibold">{report.model_type.toUpperCase()}</span> - <span>{report.language} {report.difficulty_level}</span>
                        <p className="text-xs text-gray-500">{new Date(report.created_date).toLocaleString()}</p>
                      </div>
                      <Badge variant={report.score > 80 ? "default" : "secondary"}>Score: {report.score}%</Badge>
                    </div>
                  )) : <p className="text-gray-500 text-sm">No past reports found.</p>}
                </div>
              </CardContent>
            </Card>
        </div>
    );
}
