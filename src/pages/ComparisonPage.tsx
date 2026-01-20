import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, Sparkles, Loader2, Scale, AlertTriangle, BookOpen, Gavel } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Smart Presets (Quick Chips)
const PRESETS = [
  {
    label: "Murder 🔪",
    title: "Murder (IPC 302 ↔ BNS 103)",
    text1: "Section 302 IPC: Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine.",
    text2: "Section 103 BNS: (1) Whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine.",
  },
  {
    label: "Theft 🏃",
    title: "Theft (IPC 378 ↔ BNS 303)",
    text1: "Section 378 IPC: Whoever, intending to take dishonestly any movable property out of the possession of any person without that person's consent, moves that property in order to such taking, is said to commit theft.",
    text2: "Section 303 BNS: (1) Whoever, intending to take dishonestly any movable property out of the possession of any person without that person's consent, moves that property in order to such taking, is said to commit theft.",
  },
  {
    label: "Cheating 🤥",
    title: "Cheating (IPC 415 ↔ BNS 318)",
    text1: "Section 415 IPC: Whoever, by deceiving any person, fraudulently or dishonestly induces the person so deceived to deliver any property to any person...",
    text2: "Section 318 BNS: (1) Whoever, by deceiving any person, fraudulently or dishonestly induces the person so deceived to deliver any property to any person...",
  },
  {
    label: "Sedition (Removed) 🇮🇳",
    title: "Sedition (IPC 124A ↔ BNS 150)",
    text1: "Section 124A IPC: Whoever, by words... brings or attempts to bring into hatred or contempt... towards the Government established by law in India...",
    text2: "Section 150 BNS: (Replaced by Treason) Acts endangering sovereignty, unity and integrity of India.",
  }
];

interface ComparisonResult {
    change_type: string;
    legal_impact: string;
    penalty_difference: string;
    key_changes: string[];
    verdict: string;
}

const ComparisonPage = () => {
    const [text1, setText1] = useState("");
    const [text2, setText2] = useState("");
    const [result, setResult] = useState<ComparisonResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleCompare = async () => {
        if (!text1.trim() || !text2.trim()) return;
        setIsLoading(true);
        setError("");
        setResult(null);

        try {
            const response = await fetch('http://localhost:8000/compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text1, text2 })
            });
            const data = await response.json();
            
            if (data.comparison) {
                // Handle both structured JSON and legacy string (fallback)
                if (typeof data.comparison === 'string') {
                     setResult({
                         change_type: "Analysis",
                         legal_impact: data.comparison,
                         penalty_difference: "N/A",
                         key_changes: ["Legacy text format received"],
                         verdict: "Please re-run for structured data"
                     });
                } else {
                    setResult(data.comparison);
                }
            } else {
                setError("Could not generate comparison.");
            }
        } catch (err) {
            console.error("Comparison Error:", err);
            setError("Error connecting to server.");
        } finally {
            setIsLoading(false);
        }
    };

    const loadPreset = (preset: typeof PRESETS[0]) => {
        setText1(preset.text1);
        setText2(preset.text2);
        setResult(null);
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#09090B] text-white selection:bg-purple-500/30">
            <Header />
            
             {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-4 pt-32 pb-12 flex-1 max-w-6xl relative z-10">
                
                {/* Hero Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10 space-y-4"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-gray-400 mb-2">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        <span>AI Legal Diff Engine</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-white">
                        From <span className="text-purple-500">IPC</span> to <span className="text-blue-500">BNS</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Paste any two text blocks to instantly identify legal shifts, penalty updates, and semantic chances.
                    </p>
                </motion.div>

                {/* Quick Chips */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap justify-center gap-3 mb-10"
                >
                    {PRESETS.map((preset, i) => (
                         <button
                            key={i} 
                            onClick={() => loadPreset(preset)}
                            className="px-4 py-2 text-sm rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/50 transition-all text-gray-300 hover:text-white"
                        >
                            {preset.label}
                        </button>
                    ))}
                </motion.div>

                {/* Inputs */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 relative"
                >
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden lg:flex items-center justify-center w-10 h-10 rounded-full bg-[#09090B] border border-white/10 shadow-xl">
                        <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                    </div>

                    <div className="group rounded-3xl p-[1px] bg-gradient-to-br from-purple-500/50 to-transparent">
                        <div className="bg-black/80 backdrop-blur-xl h-full rounded-[23px] p-6 border border-white/5">
                            <div className="flex items-center gap-2 mb-4 text-purple-500 font-semibold uppercase tracking-wider text-xs">
                                <BookOpen className="w-4 h-4" /> Old Law (IPC)
                            </div>
                            <Textarea 
                                value={text1} 
                                onChange={(e) => setText1(e.target.value)}
                                placeholder="Paste IPC section here..."
                                className="min-h-[250px] bg-transparent border-none resize-none text-gray-300 placeholder:text-gray-600 focus-visible:ring-0 text-base font-serif leading-relaxed p-0"
                            />
                        </div>
                    </div>

                    <div className="group rounded-3xl p-[1px] bg-gradient-to-bl from-blue-500/50 to-transparent">
                        <div className="bg-black/80 backdrop-blur-xl h-full rounded-[23px] p-6 border border-white/5">
                             <div className="flex items-center gap-2 mb-4 text-blue-500 font-semibold uppercase tracking-wider text-xs">
                                <Scale className="w-4 h-4" /> New Law (BNS)
                            </div>
                            <Textarea 
                                value={text2} 
                                onChange={(e) => setText2(e.target.value)}
                                placeholder="Paste BNS section here..."
                                className="min-h-[250px] bg-transparent border-none resize-none text-gray-300 placeholder:text-gray-600 focus-visible:ring-0 text-base font-serif leading-relaxed p-0"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Action Button */}
                <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ delay: 0.4 }}
                   className="flex justify-center mb-12"
                >
                    <Button 
                        size="lg" 
                        onClick={handleCompare} 
                        disabled={isLoading || !text1 || !text2} 
                        className="h-14 px-10 rounded-full bg-white text-black hover:bg-gray-200 shadow-[0_0_30px_rgba(255,255,255,0.2)] text-base font-medium transition-all hover:scale-105"
                    >
                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5 text-purple-600" />}
                        {isLoading ? "Analyzing Differences..." : "Analyze Impact"}
                    </Button>
                </motion.div>

                {/* Results Area */}
                <AnimatePresence>
                    {result && (
                        <motion.div 
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Verdict Banner */}
                            <div className={cn(
                                "p-6 rounded-2xl border flex items-start gap-5 backdrop-blur-xl",
                                result.change_type.includes("Major") ? "bg-red-500/10 border-red-500/20 text-red-200" : 
                                result.change_type.includes("Major") ? "bg-red-500/10 border-red-500/20 text-red-200" : 
                                result.change_type.includes("Modified") ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-200" :
                                "bg-green-500/10 border-green-500/20 text-green-200"
                            )}>
                                <div className={cn(
                                    "p-3 rounded-xl shrink-0",
                                     result.change_type.includes("Major") ? "bg-red-500/20" : 
                                     result.change_type.includes("Modified") ? "bg-indigo-500/20" :
                                     "bg-green-500/20"
                                )}>
                                    <Gavel className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl mb-1 text-white">{result.verdict}</h3>
                                    <p className="opacity-80 leading-relaxed">{result.legal_impact}</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Key Changes List */}
                                <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                                    <h4 className="text-lg font-semibold text-white mb-4">Key Changes</h4>
                                    <ul className="space-y-3">
                                        {result.key_changes.map((change, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                                                {change}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Penalty & Details */}
                                <div className="space-y-6">
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                                        <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Penalty Impact</h4>
                                        <div className={cn(
                                            "text-lg font-bold",
                                            result.penalty_difference.includes("Increased") ? "text-red-400" :
                                            result.penalty_difference.includes("Decreased") ? "text-green-400" :
                                            "text-gray-200"
                                        )}>
                                            {result.penalty_difference}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                                        <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Change Type</h4>
                                        <Badge variant="outline" className="text-base py-1 px-3 border-white/20 text-white bg-white/5">
                                            {result.change_type}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Inline Disclaimer */}
                            <div className="flex items-center justify-center gap-2 text-xs text-gray-600 bg-white/5 p-3 rounded-lg border border-white/5">
                                <AlertTriangle className="w-3 h-3" />
                                <span>This comparison highlights textual and structural changes only. It does not constitute legal advice.</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ComparisonPage;
