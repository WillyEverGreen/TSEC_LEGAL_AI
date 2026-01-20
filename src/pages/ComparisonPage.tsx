import { useState } from "react";
import Header from "@/components/Header";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRightLeft, Sparkles, Loader2 } from "lucide-react";

// Pre-defined examples
const EXAMPLES = [
  {
    title: "Murder (IPC 302 vs BNS 103)",
    text1: "Section 302 IPC: Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine.",
    text2: "Section 103 BNS: (1) Whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine."
  },
  {
    title: "Theft (IPC 378 vs BNS 303)",
    text1: "Section 378 IPC: Whoever, intending to take dishonestly any movable property out of the possession of any person...",
    text2: "Section 303 BNS: (1) Whoever, intending to take dishonestly any movable property out of the possession of any person..."
  }
];

const ComparisonPage = () => {
    const [text1, setText1] = useState(EXAMPLES[0].text1);
    const [text2, setText2] = useState(EXAMPLES[0].text2);
    const [comparison, setComparison] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleCompare = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/v1/compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text1, text2 })
            });
            const data = await response.json();
            setComparison(data.comparison || "Could not generate comparison.");
        } catch (error) {
            console.error("Comparison Error:", error);
            setComparison("Error connecting to server.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <div className="container mx-auto p-6 flex-1 max-w-6xl">
                <div className="flex flex-col items-center mb-8">
                    <h1 className="text-4xl font-serif font-bold mb-4">AI Clause Comparison</h1>
                    <p className="text-muted-foreground text-center max-w-2xl">
                        Compare IPC vs BNS sections or analyze two different legal clauses side-by-side using AI.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Clause A (e.g. IPC)</label>
                        <Textarea 
                            value={text1} 
                            onChange={(e) => setText1(e.target.value)}
                            placeholder="Paste IPC section or any legal text..."
                            className="min-h-[200px] font-serif p-4 text-base"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Clause B (e.g. BNS)</label>
                        <Textarea 
                            value={text2} 
                            onChange={(e) => setText2(e.target.value)}
                            placeholder="Paste BNS section or any legal text..."
                            className="min-h-[200px] font-serif p-4 text-base"
                        />
                    </div>
                </div>

                <div className="flex justify-center mb-10">
                    <Button size="lg" onClick={handleCompare} disabled={isLoading} className="px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all">
                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5 text-yellow-400" />}
                        {isLoading ? "Analyzing..." : "Analyze Differences"}
                    </Button>
                </div>

                {comparison && (
                    <Card className="border-t-4 border-t-primary shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="flex items-center gap-2 text-primary">
                                <ArrowRightLeft className="w-5 h-5" />
                                Comparative Analysis
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="prose dark:prose-invert max-w-none prose-sm md:prose-base">
                                <div className="whitespace-pre-wrap font-sans leading-relaxed">{comparison}</div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {!comparison && !isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {EXAMPLES.map((ex, i) => (
                            <button 
                                key={i}
                                onClick={() => { setText1(ex.text1); setText2(ex.text2); }}
                                className="text-left p-4 rounded-xl border bg-card hover:bg-accent transition-colors text-sm"
                            >
                                <span className="font-bold block mb-1">Try: {ex.title}</span>
                                <span className="text-muted-foreground line-clamp-1">{ex.text1}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};
export default ComparisonPage;

