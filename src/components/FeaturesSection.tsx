import { Link } from "react-router-dom";
import { Languages, Gavel, ArrowLeftRight, Filter, LinkIcon, FileText } from "lucide-react";

const features = [
  {
    icon: Languages,
    title: "Bilingual Legal Querying",
    description: "Search IPC and BNS sections seamlessly across English and Hindi languages.",
    link: "/chat"
  },
  {
    icon: Gavel,
    title: "Case Law Cross-Referencing",
    description: "Relevant Supreme Court & High Court judgments mapped to legal sections.",
    link: "/chat"
  },
  {
    icon: ArrowLeftRight,
    title: "IPC vs BNS Comparison",
    description: "Side-by-side view of old and new legal provisions for easy reference.",
    link: "/compare"
  },
  {
    icon: Filter,
    title: "Domain-Specific Filtering",
    description: "Filter by Corporate Law, IT Act, Environmental Law, and more.",
    link: "/chat"
  },
  {
    icon: LinkIcon,
    title: "Verifiable Source Footnotes",
    description: "Clickable citations linked to official government gazettes.",
    link: "/chat"
  },
  {
    icon: FileText,
    title: "Document Summarization",
    description: "Upload judgments or legal documents to extract key points instantly.",
    link: "/summarize"
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="section-padding section-alt">
      <div className="section-container">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            Key Features
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Core capabilities designed specifically for Indian legal research
          </p>
          <div className="w-16 h-0.5 bg-primary mx-auto mt-6" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Link key={index} to={feature.link} className="block h-full">
                <div className="legal-card h-full hover:border-primary/50 transition-colors">
                <div className="feature-icon mb-4">
                    <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-xl text-foreground mb-2">
                    {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                </p>
                </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
