import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import RefundPolicyContent from "@/components/legal/RefundPolicyContent";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-6 py-16">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <h1
          className="mb-2 text-3xl font-bold text-foreground md:text-4xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Refund & Satisfaction Policy
        </h1>

        <div className="mt-8 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <RefundPolicyContent />
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
