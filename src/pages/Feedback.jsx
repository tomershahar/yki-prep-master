import React, { useState, useEffect } from "react";
import { Feedback } from "@/entities/Feedback";
import { User } from "@/entities/User";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Image as ImageIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Status mapping for colors and user-friendly names
const statusConfig = {
    new: { label: "Received", color: "bg-blue-100 text-blue-800", adminOrder: 1 },
    seen: { label: "Under Review", color: "bg-yellow-100 text-yellow-800", adminOrder: 2 },
    'in-progress': { label: "Working on It", color: "bg-orange-100 text-orange-800", adminOrder: 3 },
    resolved: { label: "Fixed & Deployed", color: "bg-green-100 text-green-800", adminOrder: 4 },
};

export default function FeedbackPage() {
    const [user, setUser] = useState(null);
    const [feedbackItems, setFeedbackItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadPageData();
    }, []);

    const loadPageData = async () => {
        setIsLoading(true);
        try {
            const currentUser = await User.me();
            setUser(currentUser);

            let items;
            if (currentUser.role === 'admin') {
                items = await Feedback.list('-created_date');
            } else {
                items = await Feedback.filter({ created_by: currentUser.email }, '-created_date');
            }
            // Sort for admins to see 'new' items first
            if (currentUser.role === 'admin') {
                items.sort((a, b) => (statusConfig[a.status]?.adminOrder || 99) - (statusConfig[b.status]?.adminOrder || 99));
            }
            setFeedbackItems(items);
        } catch (error) {
            console.error("Error loading feedback:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleStatusChange = async (feedbackId, newStatus) => {
        try {
            await Feedback.update(feedbackId, { status: newStatus });
            // Refresh the list to show the change and re-sort
            loadPageData();
        } catch (error) {
            console.error("Error updating feedback status:", error);
            alert("Failed to update status. Please try again.");
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                    <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Feedback Center</h1>
                    <p className="text-gray-600">
                        {user?.role === 'admin' ? "Review and manage user feedback." : "View your submitted feedback and its status."}
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                {feedbackItems.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                        <p className="text-gray-500">
                            {user?.role === 'admin' ? "No feedback has been submitted yet." : "You haven't submitted any feedback yet."}
                        </p>
                    </div>
                ) : (
                    feedbackItems.map(item => (
                        <Card key={item.id} className="overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                    <div className="flex-1">
                                        <blockquote className="text-gray-700 italic border-l-2 border-gray-200 pl-4">
                                            "{item.feedback_text}"
                                        </blockquote>
                                        {item.screenshot_url && (
                                            <a href={item.screenshot_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
                                                <ImageIcon className="w-4 h-4" />
                                                View Screenshot
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex-shrink-0 w-full md:w-48 space-y-2">
                                        <Badge className={`w-full text-center justify-center ${statusConfig[item.status]?.color || 'bg-gray-200'}`}>
                                            {statusConfig[item.status]?.label || 'Unknown'}
                                        </Badge>
                                        {user?.role === 'admin' && (
                                            <Select value={item.status} onValueChange={(newStatus) => handleStatusChange(item.id, newStatus)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Change status..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(statusConfig).map(([key, {label}]) => (
                                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                            <div className="bg-gray-50 px-6 py-3 text-xs text-gray-500 flex justify-between">
                                <span>Submitted on {new Date(item.created_date).toLocaleString()}</span>
                                <span>From: {item.page_context}</span>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {user?.role !== 'admin' && (
              <div className="text-center mt-8">
                <p className="text-gray-600">Want to see what's been fixed based on community feedback?</p>
                <Link to={createPageUrl("Changelog")}>
                  <Button variant="link" className="text-blue-600">Check out the Changelog</Button>
                </Link>
              </div>
            )}
        </div>
    );
}