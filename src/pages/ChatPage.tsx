import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Scale, Zap, BookOpen, Mic, MicOff, Download, Sparkles, Send } from "lucide-react";
import Header from "@/components/Header";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
    "Scanning BNS Section 103...",
    "Cross-referencing Judgments...",
    "Analyzing IPC vs BNS...",
    "Verifying Legal Precedents...",
    "Synthesizing Neutral Analysis..."
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
        const response = await fetch('http://localhost:8000/query', { // Pointing directly to backend for stability
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
    <div className="h-screen flex flex-col bg-[#050505] text-white overflow-hidden selection:bg-purple-500/30">
      <Header />
      
      <main className="flex-1 flex flex-col relative pt-32">
         {/* Background Ambient */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none opacity-20">
             <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[100px]" />
             <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-[100px]" />
         </div>

         <div className="container mx-auto max-w-5xl h-full flex flex-col px-4 relative z-10">
            {/* Controls Bar */}
            <motion.div 
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex flex-wrap items-center justify-between gap-3 p-3 mb-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
            >
                <div className="flex items-center gap-2">
                   <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/5">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setArgumentsMode(!argumentsMode)}
                        className={cn("h-8 px-3 text-xs rounded-md transition-all", argumentsMode ? "bg-yellow-500/20 text-yellow-400" : "text-gray-400 hover:text-white")}
                      >
                         <Zap className="w-3 h-3 mr-1.5" /> Arguments
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setAnalysisMode(!analysisMode)}
                        className={cn("h-8 px-3 text-xs rounded-md transition-all", analysisMode ? "bg-blue-500/20 text-blue-400" : "text-gray-400 hover:text-white")}
                      >
                         <Scale className="w-3 h-3 mr-1.5" /> Analysis
                      </Button>
                   </div>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={domain} onValueChange={setDomain}>
                        <SelectTrigger className="w-[140px] h-9 bg-black/40 border-white/10 text-xs text-gray-300">
                            <SelectValue placeholder="Domain" />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/10 text-gray-300">
                            <SelectItem value="all">All Domains</SelectItem>
                            <SelectItem value="criminal">Criminal Law</SelectItem>
                            <SelectItem value="corporate">Corporate Law</SelectItem>
                        </SelectContent>
                    </Select>
                     <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                        className="h-9 w-9 p-0 bg-black/40 border-white/10 hover:bg-white/10 text-gray-300"
                    >
                        {language === 'en' ? 'EN' : 'HI'}
                    </Button>
                </div>
            </motion.div>

            {/* Chat Area */}
            <ScrollArea className="flex-1 pr-4">
                <div className="space-y-6 pb-4">
                    <AnimatePresence>
                        {messages.length === 0 && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center min-h-[400px] text-center"
                            >
                                <div className="w-20 h-20 bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 rounded-3xl flex items-center justify-center mb-6 border border-white/10">
                                    <Sparkles className="w-10 h-10 text-purple-400" />
                                </div>
                                <h2 className="text-2xl font-semibold text-white mb-2">How can I help you today?</h2>
                                <p className="text-gray-400 max-w-md mb-8">
                                    Ask about Indian Penal Code, BNS comparisons, or get legal arguments for specific cases.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                                    {QUICK_PROMPTS.map((prompt, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => handleSend(prompt.query)}
                                            className="text-left p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-purple-500/30 transition-all group"
                                        >
                                            <span className="text-sm font-medium text-gray-300 group-hover:text-purple-300 transition-colors">
                                                {prompt.text}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {messages.map((msg, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}
                            >
                                <div className={cn(
                                    "max-w-[85%] rounded-2xl p-5 shadow-lg relative overflow-hidden",
                                    msg.role === 'user' 
                                        ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-br-none" 
                                        : "bg-white/5 border border-white/10 rounded-bl-none backdrop-blur-md"
                                )}>
                                    {/* Noise Texture Overlay */}
                                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                                    
                                    <div className="relative z-10">
                                        {msg.role === 'assistant' ? (
                                            <div className="prose prose-invert prose-sm max-w-none">
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                
                                                {/* Analysis Cards */}
                                                {(msg.neutral_analysis || msg.arguments || (msg.judgments && msg.judgments.length > 0)) && (
                                                   <div className="mt-6 flex flex-col gap-4">
                                                      {msg.neutral_analysis && (
                                                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                                                              <h4 className="flex items-center gap-2 text-blue-300 font-semibold mb-3 text-xs uppercase tracking-wider">
                                                                  <Scale className="w-4 h-4" /> Neutral Analysis
                                                              </h4>
                                                              <div className="grid md:grid-cols-2 gap-4">
                                                                 <ul className="text-xs text-blue-100/70 list-disc list-inside space-y-1">
                                                                     {msg.neutral_analysis.factors.map((f, i) => <li key={i}>{f}</li>)}
                                                                 </ul>
                                                                 <ul className="text-xs text-blue-100/70 list-disc list-inside space-y-1">
                                                                     {msg.neutral_analysis.interpretations.map((f, i) => <li key={i}>{f}</li>)}
                                                                 </ul>
                                                              </div>
                                                          </div>
                                                      )}
                                                      
                                                      {msg.arguments && (
                                                          <div className="grid md:grid-cols-2 gap-3">
                                                              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                                                  <h4 className="text-green-300 font-semibold mb-2 text-xs uppercase">Arguments For</h4>
                                                                  <ul className="text-xs text-green-100/70 list-disc list-inside space-y-1">
                                                                      {msg.arguments.for.map((f, i) => <li key={i}>{f}</li>)}
                                                                  </ul>
                                                              </div>
                                                              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                                                  <h4 className="text-red-300 font-semibold mb-2 text-xs uppercase">Arguments Against</h4>
                                                                  <ul className="text-xs text-red-100/70 list-disc list-inside space-y-1">
                                                                      {msg.arguments.against.map((f, i) => <li key={i}>{f}</li>)}
                                                                  </ul>
                                                              </div>
                                                          </div>
                                                      )}
                                                   </div>
                                                )}
                                                
                                                 <div className="mt-4 flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" className="h-6 text-[10px] text-gray-400 hover:text-white" onClick={() => exportPDF(msg, "Legal Query")}>
                                                        <Download className="h-3 w-3 mr-1" /> Save PDF
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="font-medium text-sm">{msg.content}</p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        
                        {isLoading && (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-3 text-gray-400 pl-4"
                            >
                                <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                                <span className="text-xs font-mono animate-pulse">{loadingText}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="pb-6 pt-2">
                <div className="relative flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1.5 backdrop-blur-xl shadow-2xl">
                    <Button 
                        variant={isListening ? "destructive" : "ghost"} 
                        size="icon" 
                        onClick={startListening}
                        className={cn("rounded-full h-10 w-10 shrink-0", isListening ? "" : "text-gray-400 hover:text-white hover:bg-white/10")}
                    >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    
                    <Input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isListening ? "Listening..." : "Ask your legal question..."}
                        className="border-0 bg-transparent focus-visible:ring-0 text-white placeholder:text-gray-500 h-10"
                    />
                    
                    <Button 
                        size="icon" 
                        onClick={() => handleSend()}
                        className="rounded-full bg-purple-600 hover:bg-purple-500 text-white h-10 w-10 shrink-0 shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
                <div className="mt-3 text-[10px] text-center text-gray-600">
                    AI can make mistakes. Please verify important information.
                </div>
            </div>

         </div>
      </main>
    </div>
  );
};

export default ChatPage;
