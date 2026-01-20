import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { FileText, Upload, CheckCircle, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
            const response = await fetch('http://localhost:8000/summarize', {
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
        <div className="min-h-screen flex flex-col bg-[#050505] text-white selection:bg-purple-500/30">
            <Header />
            
            {/* Background Ambient */}
             <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-purple-900/10 to-transparent opacity-50" />
            </div>

            <div className="container mx-auto px-4 pt-32 pb-24 flex-1 relative z-10 max-w-5xl">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center mb-12 text-center"
                >
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-gray-400 mb-4">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span>AI Document Intelligence</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                        Legal Document Summarizer
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl">
                        Upload complex judgments, petitions, or contracts and get concise, actionable summaries in seconds.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Upload Section */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/5 border border-white/10 rounded-3xl p-1 overflow-hidden"
                    >   
                        <div className="bg-black/50 backdrop-blur-xl rounded-[20px] p-6 h-full">
                            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                <Upload className="w-5 h-5 text-purple-400" />
                                Upload Document
                            </h3>
                            
                            <div className="border-2 border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors relative group">
                                <input 
                                    type="file" 
                                    accept=".pdf,.docx,.txt" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    onChange={handleFileChange}
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <FileText className="w-8 h-8 text-gray-400 group-hover:text-purple-400 transition-colors" />
                                </div>
                                <p className="font-medium text-gray-200">Drag & Drop or Click to Upload</p>
                                <p className="text-sm text-gray-500 mt-2">PDF, DOCX, TXT (Max 10MB)</p>
                            </div>

                            <AnimatePresence>
                                {file && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-6"
                                    >
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                                                    <FileText className="w-5 h-5 text-purple-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">{file.name}</p>
                                                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                            <Button 
                                                size="sm" 
                                                onClick={handleUpload} 
                                                disabled={isUploading}
                                                className="bg-white text-black hover:bg-gray-200 rounded-full px-6 transition-transform active:scale-95"
                                            >
                                                {isUploading ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : "Summarize"}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Result Section */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="h-full min-h-[500px] bg-white/5 border border-white/10 rounded-3xl p-1 overflow-hidden flex flex-col"
                    >
                         <div className="bg-black/50 backdrop-blur-xl rounded-[20px] p-6 h-full flex flex-col relative overflow-hidden">
                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-yellow-400" />
                                    AI Summary
                                </h3>
                                {summary && (
                                    <span className="text-xs font-medium text-green-400 flex items-center gap-1.5 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                                        <CheckCircle className="w-3 h-3" /> Copied
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 rounded-2xl bg-black/40 border border-white/5 p-6 overflow-y-auto relative custom-scrollbar">
                                {summary ? (
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <ReactMarkdown>{summary}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 opacity-60">
                                        <FileText className="w-16 h-16 mb-4 opacity-20" />
                                        <p>Summary will appear here...</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Decorative Glow */}
                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none" />
                        </div>
                    </motion.div>
                </div>
            </div>
            
        </div>
    );
};
export default SummarizePage;
