
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { KnowledgeBaseContent } from "@/entities/KnowledgeBaseContent";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, Upload, FileText, Trash2, AlertCircle, Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "@/components/ui/use-toast";

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [knowledgeFiles, setKnowledgeFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null,
    fileName: '',
    description: ''
  });

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
      
      await loadKnowledgeFiles();
    } catch (error) {
      console.error("Error checking access:", error);
      navigate(createPageUrl("Dashboard"));
    } finally {
      setIsLoading(false);
    }
  };

  const loadKnowledgeFiles = async () => {
    try {
      const files = await KnowledgeBaseContent.list('-created_date');
      setKnowledgeFiles(files);
    } catch (error) {
      console.error("Error loading knowledge files:", error);
      // Set empty array on error to prevent crash
      setKnowledgeFiles([]);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm({
        ...uploadForm,
        file: file,
        fileName: file.name
      });
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.fileName) {
      toast({
        title: "Missing Information",
        description: "Please select a file and provide a name.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    setIsUploading(true);
    try {
      // Upload the file
      const { file_url } = await UploadFile({ file: uploadForm.file });
      
      // Save to knowledge base
      await KnowledgeBaseContent.create({
        file_name: uploadForm.fileName,
        file_url: file_url,
        description: uploadForm.description || ''
      });

      // Reset form
      setUploadForm({
        file: null,
        fileName: '',
        description: ''
      });
      
      // Clear file input
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';

      // Reload files
      await loadKnowledgeFiles();

      toast({
        title: "Upload Successful",
        description: "File uploaded successfully!",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload Failed",
        description: "Error uploading file. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (confirm("Are you sure you want to delete this file from the knowledge base?")) {
      try {
        await KnowledgeBaseContent.delete(fileId);
        await loadKnowledgeFiles();
        toast({
          title: "Delete Successful",
          description: "File deleted successfully!",
          duration: 3000,
        });
      } catch (error) {
        console.error("Error deleting file:", error);
        toast({
          title: "Delete Failed",
          description: "Error deleting file. Please try again.",
          variant: "destructive",
          duration: 5000,
        });
      }
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
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl">
          <Database className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Knowledge Base</h1>
          <p className="text-gray-600 dark:text-gray-400">Upload and manage reference materials for AI content generation</p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Files uploaded here will be used by the Language Master AI to provide personalized learning tips to users based on their exam performance.
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload New Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Select File (PDF, TXT, DOCX)</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.txt,.docx,.doc"
                onChange={handleFileSelect}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-name">File Name</Label>
              <Input
                id="file-name"
                value={uploadForm.fileName}
                onChange={(e) => setUploadForm({...uploadForm, fileName: e.target.value})}
                placeholder="Enter a descriptive name for this file"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                placeholder="Brief description of what this document contains..."
                rows={3}
              />
            </div>

            <Button 
              onClick={handleUpload}
              disabled={isUploading || !uploadForm.file || !uploadForm.fileName}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload to Knowledge Base
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Current Files */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Current Knowledge Base ({knowledgeFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {knowledgeFiles.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No files uploaded yet</p>
                <p className="text-sm text-gray-400">Upload your first document to get started</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {knowledgeFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{file.file_name}</h3>
                      {file.description && (
                        <p className="text-sm text-gray-600 truncate">{file.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {new Date(file.created_date).toLocaleDateString()}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <Check className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(file.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-blue-50">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            How the Language Master Works
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div className="space-y-2">
              <p>• After each practice exam, the AI analyzes user performance</p>
              <p>• It references your uploaded documents for expert knowledge</p>
              <p>• Generates personalized, actionable learning tips</p>
            </div>
            <div className="space-y-2">
              <p>• Tips are based on actual exam mistakes and patterns</p>
              <p>• Content is tailored to Finnish/Swedish YKI requirements</p>
              <p>• Users receive contextual advice for improvement</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
