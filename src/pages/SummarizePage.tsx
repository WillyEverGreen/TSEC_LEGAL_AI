
import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, CheckCircle } from "lucide-react";
import ReactMarkdown from 'react-markdown';

const SummarizePage = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setSummary(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:3001/api/v1/summarize', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            setSummary(data.summary || "No summary generated.");
        } catch (error) {
            console.error("Upload Error:", error);
            setSummary("Error uploading file. Please ensure the backend is running.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <div className="container mx-auto p-6 flex-1">
                <div className="flex flex-col items-center mb-8">
                    <h1 className="text-4xl font-serif font-bold mb-4">Legal Document Summarizer</h1>
                    <p className="text-muted-foreground text-center max-w-2xl">
                        Upload complex legal documents and get concise, accurate summaries with citation references.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Upload Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Document</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border-2 border-dashed border-input rounded-lg p-10 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors relative">
                                <input 
                                    type="file" 
                                    accept=".pdf,.docx,.txt" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                />
                                <Upload className="w-10 h-10 text-muted-foreground mb-4" />
                                <p className="font-medium">Drag & Drop or Click to Upload</p>
                                <p className="text-sm text-muted-foreground mt-2">Support PDF, DOCX, TXT</p>
                            </div>

                            {file && (
                                <div className="mt-4 flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-primary" />
                                        <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                                    </div>
                                    <Button size="sm" onClick={handleUpload} disabled={isUploading}>
                                        {isUploading ? "Summarizing..." : "Summarize"}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Result Section */}
                    <Card className="h-full min-h-[400px]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Result
                                {summary && <CheckCircle className="w-5 h-5 text-green-500" />}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {summary ? (
                                <div className="prose dark:prose-invert max-w-none text-sm">
                                    <ReactMarkdown>{summary}</ReactMarkdown>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                    <FileText className="w-16 h-16 mb-4" />
                                    <p>Summary will appear here</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            
        </div>
    );
};
export default SummarizePage;
