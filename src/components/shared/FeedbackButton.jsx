
import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, CheckCircle } from "lucide-react";
import { Feedback } from '@/entities/Feedback';
import { UploadFile } from '@/integrations/Core';
import { User } from '@/entities/User';
import { Achievement } from '@/entities/Achievement';

export default function FeedbackButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [feedbackText, setFeedbackText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [screenshotData, setScreenshotData] = useState(null);

    const handleOpen = async () => {
        setIsSuccess(false);
        setFeedbackText("");
        setScreenshotData(null);
        setIsOpen(true);
        
        // Take screenshot after a short delay to allow dialog to open
        setTimeout(async () => {
            try {
                const canvas = await html2canvas(document.body, {
                    useCORS: true,
                    allowTaint: true,
                    scrollX: -window.scrollX,
                    scrollY: -window.scrollY,
                    windowWidth: document.documentElement.offsetWidth,
                    windowHeight: document.documentElement.offsetHeight,
                });
                setScreenshotData(canvas.toDataURL('image/png'));
            } catch (error) {
                console.error("Error taking screenshot:", error);
            }
        }, 100);
    };

    const awardFeedbackAchievement = async () => {
        try {
            const [currentUser, feedbackAchievements] = await Promise.all([
                User.me(),
                Achievement.filter({ category: 'feedback' })
            ]);

            if (!feedbackAchievements || feedbackAchievements.length === 0) {
                console.log("No feedback achievement found to award.");
                return;
            }

            const feedbackAchId = feedbackAchievements[0].id;
            const userAchievements = new Set(currentUser.achievements || []);

            if (!userAchievements.has(feedbackAchId)) {
                userAchievements.add(feedbackAchId);
                await User.updateMyUserData({ achievements: Array.from(userAchievements) });
                setTimeout(() => {
                    alert("🎉 Achievement Unlocked: Feedback Contributor!\nThank you for helping us improve the app.");
                }, 500);
            }
        } catch (error) {
            console.error("Error awarding feedback achievement:", error);
        }
    };

    const handleSubmit = async () => {
        if (!feedbackText.trim()) {
            alert("Please enter your feedback before submitting.");
            return;
        }

        setIsSubmitting(true);
        let screenshotUrl = null;

        try {
            if (screenshotData) {
                const blob = await (await fetch(screenshotData)).blob();
                const file = new File([blob], "feedback-screenshot.png", { type: "image/png" });
                const { file_url } = await UploadFile({ file });
                screenshotUrl = file_url;
            }

            await Feedback.create({
                feedback_text: feedbackText,
                screenshot_url: screenshotUrl,
                page_context: window.location.pathname,
            });

            await awardFeedbackAchievement();

            setIsSuccess(true);
            setTimeout(() => {
                setIsOpen(false);
            }, 2000);

        } catch (error) {
            console.error("Error submitting feedback:", error);
            alert("Failed to submit feedback. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Button
                onClick={handleOpen}
                className="fixed bottom-5 right-5 rounded-full h-14 w-14 shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                aria-label="Send Feedback"
            >
                <MessageSquare className="w-6 h-6" />
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isSuccess ? "Feedback Sent!" : "Send Us Your Feedback"}</DialogTitle>
                    </DialogHeader>

                    {isSuccess ? (
                        <div className="flex flex-col items-center justify-center h-48">
                            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                            <p className="text-lg font-medium">Thank you for your help!</p>
                        </div>
                    ) : (
                        <>
                            <Textarea
                                placeholder="Tell us what you think or what we can improve..."
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                rows={5}
                            />
                            {screenshotData && (
                                <div className="text-sm text-gray-500">
                                    <p>A screenshot of the current page will be attached to help us understand your feedback.</p>
                                    <img src={screenshotData} alt="Screenshot preview" className="mt-2 border rounded-md max-h-24" />
                                </div>
                            )}
                            <DialogFooter>
                                <Button onClick={handleSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : "Submit Feedback"}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
