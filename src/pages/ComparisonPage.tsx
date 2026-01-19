import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft } from "lucide-react";

// Mock Data for Phase 1
const COMPARISON_DATA = [
  {
    id: "murder",
    title: "Punishment for Murder",
    ipc: { section: "Section 302", content: "Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine." },
    bns: { section: "Section 103", content: "Whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine." },
    difference: "Retained core punishment structure but reorganized under new chapter headings."
  },
  {
    id: "theft",
    title: "Theft",
    ipc: { section: "Section 378", content: "Whoever, intending to take dishonestly any movable property out of the possession of any person without that person's consent, moves that property in order to such taking, is said to commit theft." },
    bns: { section: "Section 303", content: "Whoever, intending to take dishonestly any movable property out of the possession of any person without that person's consent, moves that property in order to such taking, is said to commit theft." },
    difference: "Definition remains largely consistent; renumbered for better logical grouping."
  },
  {
    id: "defamation",
    title: "Defamation",
    ipc: { section: "Section 499", content: "Whoever, by words either spoken or intended to be read... makes or publishes any imputation concerning any person intending to harm... reputation..." },
    bns: { section: "Section 356", content: "Consolidates defamation provisions with minor modernization in language concerning digital publication." },
    difference: "Updated to explicitly account for electronic forms of communication."
  }
];

const ComparisonPage = () => {
    const [selectedTopic, setSelectedTopic] = useState(COMPARISON_DATA[0]);

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <div className="container mx-auto p-6 flex-1">
                <div className="flex flex-col items-center mb-8">
                    <h1 className="text-4xl font-serif font-bold mb-4">IPC vs BNS Comparison</h1>
                    <p className="text-muted-foreground text-center max-w-2xl">
                        Analyze the transition from the Indian Penal Code (1860) to the Bhartiya Nyaya Sanhita (2023).
                    </p>
                </div>

                <div className="max-w-md mx-auto mb-8">
                    <Select 
                        onValueChange={(val) => setSelectedTopic(COMPARISON_DATA.find(d => d.id === val) || COMPARISON_DATA[0])}
                        defaultValue={selectedTopic.id}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a Legal Topic" />
                        </SelectTrigger>
                        <SelectContent>
                            {COMPARISON_DATA.map(topic => (
                                <SelectItem key={topic.id} value={topic.id}>{topic.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
                    {/* IPC Card */}
                    <Card className="border-l-4 border-l-orange-500 shadow-lg bg-orange-50/30 dark:bg-orange-950/10">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center text-orange-700 dark:text-orange-400">
                                <span>IPC (Old)</span>
                                <span className="text-sm px-2 py-1 bg-orange-100 dark:bg-orange-900 rounded">{selectedTopic.ipc.section}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="leading-relaxed font-serif text-lg">{selectedTopic.ipc.content}</p>
                        </CardContent>
                    </Card>

                    {/* Arrow Icon (Absolute Center on LG screens) */}
                    <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border p-2 rounded-full shadow-sm z-10">
                        <ArrowRightLeft className="w-6 h-6 text-muted-foreground" />
                    </div>

                    {/* BNS Card */}
                    <Card className="border-l-4 border-l-green-600 shadow-lg bg-green-50/30 dark:bg-green-950/10">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center text-green-700 dark:text-green-400">
                                <span>BNS (New)</span>
                                <span className="text-sm px-2 py-1 bg-green-100 dark:bg-green-900 rounded">{selectedTopic.bns.section}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="leading-relaxed font-serif text-lg">{selectedTopic.bns.content}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="mt-8 bg-muted/30">
                    <CardContent className="pt-6">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs">i</span>
                            Key Difference
                        </h3>
                        <p className="text-muted-foreground">{selectedTopic.difference}</p>
                    </CardContent>
                </Card>

            </div>
            <Footer />
        </div>
    );
};
export default ComparisonPage;
