import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

function EmptyState() {
  return (
    <motion.div
      className="flex min-h-[260px] flex-col items-center justify-center rounded-[28px] border border-dashed border-border/80 bg-card/60 px-6 py-12 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="mb-4 rounded-full border border-primary/25 bg-primary/10 p-4 text-primary">
        <Sparkles className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-semibold text-foreground">No archived searches yet</h3>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        Save filtered talent pools and AI-generated shortlists to compare hiring
        quality over time.
      </p>
      <Button variant="secondary" className="mt-6">
        Create saved search
      </Button>
    </motion.div>
  );
}

export default EmptyState;
