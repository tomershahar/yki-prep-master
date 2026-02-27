
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { EvaluationReport } from "@/entities/EvaluationReport";
import { ContentPool } from "@/entities/ContentPool";
import { evaluateReadingModel } from "@/functions/evaluateReadingModel";
import { evaluateWritingModel } from "@/functions/evaluateWritingModel";
import { evaluateListeningModel } from "@/functions/evaluateListeningModel";
import { evaluateSpeakingModel } from "@/functions/evaluateSpeakingModel";
import { seedContentPool } from "@/functions/seedContentPool";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Wand2, BookOpen, FileText, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReactMarkdown from 'react-markdown';
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        model_type: 'reading'
    });
    const [recentReport, setRecentReport] = useState(null);
    const [pastReports, setPastReports] = useState([]);

    // Content Pool state
    const [poolStats, setPoolStats] = useState([]);
    const [isLoadingPoolStats, setIsLoadingPoolStats] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [seedResult, setSeedResult] = useState(null);
    const [seedParams, setSeedParams] = useState({
        language: 'all',
        section: 'all',
        level: 'all',
        count: 15,
    });

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
                loadPoolStats();
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

    const loadPoolStats = async () => {
        setIsLoadingPoolStats(true);
        try {
            const items = await ContentPool.filter({ is_active: true });
            if (!items || items.length === 0) {
                setPoolStats([]);
                return;
            }
            // Group by language+section+level
            const grouped = {};
            items.forEach((item) => {
                const key = `${item.language}/${item.section}/${item.level}`;
                if (!grouped[key]) {
                    grouped[key] = { language: item.language, section: item.section, level: item.level, count: 0, totalUsed: 0 };
                }
                grouped[key].count++;
                grouped[key].totalUsed += item.used_count || 0;
            });
            const stats = Object.values(grouped).map((g) => ({
                ...g,
                avgUsed: g.count > 0 ? (g.totalUsed / g.count).toFixed(1) : '0'
            }));
            stats.sort((a, b) => `${a.language}${a.section}${a.level}`.localeCompare(`${b.language}${b.section}${b.level}`));
            setPoolStats(stats);
        } catch (error) {
            console.error('Error loading pool stats:', error);
            toast({ title: 'Error loading pool stats', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoadingPoolStats(false);
        }
    };

    const handleSeedPool = async () => {
        setIsSeeding(true);
        setSeedResult(null);
        try {
            const params = {
                count: Number(seedParams.count) || 15,
                ...(seedParams.language !== 'all' && { language: seedParams.language }),
                ...(seedParams.section !== 'all' && { section: seedParams.section }),
                ...(seedParams.level !== 'all' && { level: seedParams.level }),
            };
            const { data, error } = await seedContentPool(params);
            if (error) throw new Error(error.message || String(error));
            setSeedResult(data);
            toast({ title: 'Pool seeded!', description: `${data.seeded} items added across ${data.combinations} combinations.` });
            loadPoolStats();
        } catch (error) {
            console.error('Seeding failed:', error);
            toast({ title: 'Seeding Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsSeeding(false);
        }
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
            toast({
                title: "Evaluation Failed",
                description: `Evaluation failed: ${error.message}`,
                variant: "destructive",
                duration: 5000,
            });
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

            <Tabs defaultValue="evaluation">
                <TabsList className="mb-6">
                    <TabsTrigger value="evaluation" className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Model Evaluation</TabsTrigger>
                    <TabsTrigger value="content-pool" className="flex items-center gap-2"><Database className="w-4 h-4" /> Content Pool</TabsTrigger>
                </TabsList>

                {/* ── MODEL EVALUATION TAB ── */}
                <TabsContent value="evaluation" className="space-y-8">
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
                </TabsContent>

                {/* ── CONTENT POOL TAB ── */}
                <TabsContent value="content-pool" className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Database /> Seed Content Pool</CardTitle>
                            <CardDescription>Pre-generate practice content and store it in the pool to reduce live AI calls during user sessions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="space-y-1 w-full md:w-48">
                                    <label className="text-sm font-medium text-gray-700">Language</label>
                                    <Select value={seedParams.language} onValueChange={(v) => setSeedParams(p => ({...p, language: v}))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Languages</SelectItem>
                                            <SelectItem value="swedish">Swedish</SelectItem>
                                            <SelectItem value="danish">Danish</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1 w-full md:w-48">
                                    <label className="text-sm font-medium text-gray-700">Section</label>
                                    <Select value={seedParams.section} onValueChange={(v) => setSeedParams(p => ({...p, section: v}))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Sections</SelectItem>
                                            <SelectItem value="reading">Reading</SelectItem>
                                            <SelectItem value="listening">Listening</SelectItem>
                                            <SelectItem value="speaking">Speaking</SelectItem>
                                            <SelectItem value="writing">Writing</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1 w-full md:w-48">
                                    <label className="text-sm font-medium text-gray-700">Level</label>
                                    <Select value={seedParams.level} onValueChange={(v) => setSeedParams(p => ({...p, level: v}))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Levels</SelectItem>
                                            <SelectItem value="A1">A1</SelectItem>
                                            <SelectItem value="A2">A2</SelectItem>
                                            <SelectItem value="B1">B1</SelectItem>
                                            <SelectItem value="B2">B2</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1 w-full md:w-32">
                                    <label className="text-sm font-medium text-gray-700">Count / combo</label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={seedParams.count}
                                        onChange={(e) => setSeedParams(p => ({...p, count: e.target.value}))}
                                    />
                                </div>
                                <Button
                                    onClick={handleSeedPool}
                                    disabled={isSeeding}
                                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {isSeeding ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Seeding...</> : "Seed Pool"}
                                </Button>
                            </div>

                            {isSeeding && (
                                <Alert>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <AlertTitle>Seeding in Progress</AlertTitle>
                                    <AlertDescription>
                                        Generating content items and saving to the pool. This may take several minutes for large batches. Please keep this tab open.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {seedResult && !isSeeding && (
                                <Alert className="border-green-200 bg-green-50">
                                    <AlertCircle className="h-4 w-4 text-green-600" />
                                    <AlertTitle className="text-green-800">Seeding Complete</AlertTitle>
                                    <AlertDescription className="text-green-700">
                                        {seedResult.message}
                                        {seedResult.errors && seedResult.errors.length > 0 && (
                                            <span className="ml-2 text-amber-700">({seedResult.errors.length} errors — check function logs)</span>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2"><Database /> Pool Stats</CardTitle>
                            <Button variant="outline" size="sm" onClick={loadPoolStats} disabled={isLoadingPoolStats}>
                                {isLoadingPoolStats ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {isLoadingPoolStats ? (
                                <div className="flex items-center gap-2 text-gray-500 py-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading stats...</div>
                            ) : poolStats.length === 0 ? (
                                <p className="text-gray-500 text-sm py-4">No pool items found. Seed the pool to get started.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Language</TableHead>
                                            <TableHead>Section</TableHead>
                                            <TableHead>Level</TableHead>
                                            <TableHead className="text-right">Items</TableHead>
                                            <TableHead className="text-right">Avg Uses</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {poolStats.map((row) => (
                                            <TableRow key={`${row.language}-${row.section}-${row.level}`}>
                                                <TableCell className="capitalize">{row.language}</TableCell>
                                                <TableCell className="capitalize">{row.section}</TableCell>
                                                <TableCell><Badge variant="secondary">{row.level}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant={row.count < 5 ? "destructive" : row.count < 10 ? "outline" : "default"}>
                                                        {row.count}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-gray-600">{row.avgUsed}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
