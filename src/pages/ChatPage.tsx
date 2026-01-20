import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Scale, Zap, Shield, BookOpen, Mic, MicOff, Download, FileText } from "lucide-react";
import Header from "@/components/Header";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Judgment {
    title: string;
    summary: string;
}

interface Arguments {
    for: string[];
    against: string[];
}

interface NeutralAnalysis {
    factors: string[];
    interpretations: string[];
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    judgments?: Judgment[];
    arguments?: Arguments;
    neutral_analysis?: NeutralAnalysis;
    citations?: any[];
}

const QUICK_PROMPTS = [
    { text: "Punishment for Murder 🔪", query: "Punishment for murder under BNS" },
    { text: "File Consumer Complaint 🛒", query: "How to file a consumer complaint" },
    { text: "Check Cheating Laws 🤥", query: "Punishment for cheating" },
    { text: "Draft Rent Agreement 🏠", query: "Essentials of a rent agreement" }
];

const LOADING_TEXTS = [
    "🔍 Scanning BNS Section 103...",
    "⚖️ Cross-referencing Judgments...",
    "📖 Analyzing IPC vs BNS...",
    "🛡️ Verifying Legal Precedents...",
    "🧠 Synthesizing Neutral Analysis..."
];

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [domain, setDomain] = useState("all");
  const [argumentsMode, setArgumentsMode] = useState(false);
  const [analysisMode, setAnalysisMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [loadingText, setLoadingText] = useState(LOADING_TEXTS[0]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
        let i = 0;
        interval = setInterval(() => {
            i = (i + 1) % LOADING_TEXTS.length;
            setLoadingText(LOADING_TEXTS[i]);
        }, 800);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };
      
      recognition.start();
    } else {
      alert("Voice input is not supported in this browser.");
    }
  };

  const exportPDF = (msg: Message, query: string) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Legal Compass AI - Research Report", 15, 20);
    
    // Metadata
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${new Date().toLocaleDateString()} | Domain: ${domain}`, 15, 28);
    
    // Query
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Query: ${query}`, 15, 40);
    
    // Content
    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(msg.content, 180);
    doc.text(splitText, 15, 50);
    
    let yPos = 50 + (splitText.length * 7);

    // Citations
    if (msg.citations && msg.citations.length > 0) {
        yPos += 10;
        doc.setFontSize(14);
        doc.text("Legal Citations", 15, yPos);
        yPos += 5;
        
        const citationData = msg.citations.map(c => [c.source, c.section, c.text]);
        autoTable(doc, {
            startY: yPos,
            head: [['Source', 'Section', 'Text']],
            body: citationData,
            theme: 'grid'
        });
        interface JsPDFWithAutoTable extends jsPDF {
            lastAutoTable: { finalY: number };
        }
        yPos = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 10;
    }

    // Disclaimer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Disclaimer: Provide for informational purposes only. Not legal advice.", 15, 280);
    
    doc.save("legal-research-report.pdf");
  };

  const handleSend = async (text = input) => {
    if (!text.trim()) return;
    
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
        const response = await fetch('http://localhost:3001/api/v1/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                query: text, 
                language, 
                domain, 
                arguments_mode: argumentsMode,
                analysis_mode: analysisMode 
            })
        });
        
        const data = await response.json();
        
        if (data.answer) {
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: data.answer,
                judgments: data.related_judgments,
                arguments: data.arguments,
                neutral_analysis: data.neutral_analysis,
                citations: data.citations
            }]);
        } else {
             setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't process that request." }]);
        }
    } catch (error) {
        console.error("Chat Error:", error);
        setMessages(prev => [...prev, { role: 'assistant', content: "Error connecting to the server. Please ensure the backend is running." }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background">
      <Header />
      <div className="flex-1 container mx-auto p-4 flex flex-col overflow-hidden max-w-5xl">
        
        {/* Top Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 bg-card p-4 rounded-xl border shadow-sm">
            <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                    <Scale className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-xl font-bold hidden sm:block">Legal Assistant</h1>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium flex items-center gap-1">
                    <Shield className="h-3 w-3" /> Secure
                </span>
            </div>

            <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                <div className="flex items-center space-x-2 bg-muted/50 p-1.5 rounded-lg border">
                    <Switch id="args-mode" checked={argumentsMode} onCheckedChange={setArgumentsMode} />
                    <Label htmlFor="args-mode" className="text-sm font-medium cursor-pointer flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5 text-yellow-500" />
                        Arguments
                    </Label>
                </div>

                <div className="flex items-center space-x-2 bg-blue-50/50 p-1.5 rounded-lg border border-blue-100">
                    <Switch id="analysis-mode" checked={analysisMode} onCheckedChange={setAnalysisMode} />
                    <Label htmlFor="analysis-mode" className="text-sm font-medium cursor-pointer flex items-center gap-1">
                        <Scale className="h-3.5 w-3.5 text-blue-500" />
                        Neutral Analysis
                    </Label>
                </div>
                
                <Select value={domain} onValueChange={setDomain}>
                    <SelectTrigger className="w-[130px] h-9">
                        <SelectValue placeholder="Domain" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Domains</SelectItem>
                        <SelectItem value="criminal">Criminal Law</SelectItem>
                        <SelectItem value="corporate">Corporate Law</SelectItem>
                    </SelectContent>
                </Select>

                <Button variant={language === 'en' ? "default" : "outline"} size="sm" onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')} className="w-9 h-9 p-0">
                    {language === 'en' ? 'EN' : 'HI'}
                </Button>
            </div>
        </div>
        
        {/* Chat Area */}
        <Card className="flex-1 mb-4 overflow-hidden flex flex-col shadow-md border-muted">
            <ScrollArea className="flex-1 p-4 md:p-6">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-4">
                        <BookOpen className="h-16 w-16" />
                        <p className="text-lg font-medium">Ask a legal question to get started</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`mb-6 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[95%] md:max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card border rounded-bl-none'}`}>
                            {msg.role === 'assistant' ? (
                                <div className="prose dark:prose-invert text-sm max-w-none w-full">
                                    <div className="whitespace-pre-wrap font-sans leading-relaxed">{msg.content}</div>
                                    
                                    {/* Neutral Analysis Section */}
                                    {msg.neutral_analysis && (
                                        <div className="mt-4 bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900">
                                            <div className="flex items-center gap-2 mb-3 border-b border-blue-200 dark:border-blue-800 pb-2">
                                                <Scale className="h-4 w-4 text-blue-600" />
                                                <h4 className="font-semibold text-blue-700 dark:text-blue-400 text-sm">Neutral Legal Analysis</h4>
                                            </div>
                                            
                                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <p className="text-xs font-semibold text-blue-600 uppercase mb-2">Key Factors</p>
                                                    <ul className="list-disc list-inside text-xs space-y-1 text-muted-foreground">
                                                        {msg.neutral_analysis.factors.map((f, i) => (
                                                            <li key={i} dangerouslySetInnerHTML={{__html: f.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}} />
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-blue-600 uppercase mb-2">Possible Interpretations</p>
                                                    <ul className="list-disc list-inside text-xs space-y-1 text-muted-foreground">
                                                        {msg.neutral_analysis.interpretations.map((f, i) => (
                                                            <li key={i} dangerouslySetInnerHTML={{__html: f.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}} />
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-blue-500/80 italic text-center">
                                                * This analysis is informational. Final interpretation rests with the judiciary.
                                            </p>
                                        </div>
                                    )}

                                    {/* Arguments Section */}
                                    {msg.arguments && (
                                        <div className="mt-4 grid md:grid-cols-2 gap-3">
                                            <div className="bg-green-50/50 dark:bg-green-950/20 p-3 rounded-lg border border-green-100 dark:border-green-900">
                                                <h4 className="font-semibold text-green-700 dark:text-green-400 text-xs uppercase mb-2 flex items-center gap-1">
                                                    <span className="text-lg">🔥</span> Arguments For
                                                </h4>
                                                <ul className="space-y-1.5 list-disc list-inside text-xs text-muted-foreground">
                                                    {msg.arguments.for.map((arg, i) => <li key={i}>{arg}</li>)}
                                                </ul>
                                            </div>
                                            <div className="bg-red-50/50 dark:bg-red-950/20 p-3 rounded-lg border border-red-100 dark:border-red-900">
                                                <h4 className="font-semibold text-red-700 dark:text-red-400 text-xs uppercase mb-2 flex items-center gap-1">
                                                    <span className="text-lg">🧊</span> Arguments Against
                                                </h4>
                                                <ul className="space-y-1.5 list-disc list-inside text-xs text-muted-foreground">
                                                    {msg.arguments.against.map((arg, i) => <li key={i}>{arg}</li>)}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {/* Judgments Section */}
                                    {msg.judgments && msg.judgments.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-border/50">
                                            <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                                                <Scale className="h-3 w-3" /> Related Judgments
                                            </p>
                                            <div className="grid gap-2">
                                                {msg.judgments.map((j, i) => (
                                                    <div key={i} className="text-xs bg-muted/30 hover:bg-muted/50 transition-colors p-2.5 rounded-lg border border-border/50">
                                                        <span className="font-semibold text-primary block mb-0.5">{j.title}</span>
                                                        <span className="text-muted-foreground">{j.summary}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="mt-4 flex gap-2 justify-end">
                                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => exportPDF(msg, "Legal Query")}>
                                            <Download className="h-3 w-3 mr-1" /> PDF Report
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm font-medium">{msg.content}</div>
                            )}
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex justify-start mb-6">
                        <div className="bg-card border rounded-2xl p-4 shadow-sm rounded-bl-none flex items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <span className="text-sm font-medium text-muted-foreground animate-pulse">{loadingText}</span>
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </ScrollArea>
        </Card>

        {/* Quick Prompts - Only show when no messages */}
        {messages.length === 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide shrink-0">
                {QUICK_PROMPTS.map((prompt, idx) => (
                    <button 
                        key={idx}
                        onClick={() => handleSend(prompt.query)}
                        className="flex-shrink-0 text-xs font-medium bg-secondary/50 hover:bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full border border-border transition-colors whitespace-nowrap"
                    >
                        {prompt.text}
                    </button>
                ))}
            </div>
        )}

        {/* Input Area - Fixed at bottom of flex container */}
        <div className="flex gap-2 shrink-0 bg-background pt-2">
            <Button 
                variant={isListening ? "destructive" : "outline"}
                className="h-12 w-12 shrink-0 p-0"
                onClick={startListening}
            >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder={isListening ? "Listening..." : "Ask a legal question... (e.g. 'Punishment for murder')"} 
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="h-12 text-base shadow-sm"
            />
            <Button onClick={() => handleSend()} size="lg" className="h-12 px-6 shadow-sm">
                Send
            </Button>
        </div>
        
        <div className="mt-3 text-[10px] text-center text-muted-foreground opacity-60">
            Legal Compass AI is an assistive tool. Always consult a professional lawyer for legal advice.
        </div>
      </div>

    </div>
  );
};

export default ChatPage;
