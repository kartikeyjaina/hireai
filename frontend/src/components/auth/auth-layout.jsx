import { BriefcaseBusiness, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const highlights = [
  {
    icon: Sparkles,
    title: "AI-assisted sourcing",
    description: "Generate role-aligned hiring workflows with recruiter-grade precision."
  },
  {
    icon: ShieldCheck,
    title: "Secure collaboration",
    description: "Role-based access keeps admins, recruiters, and interviewers aligned."
  },
  {
    icon: BriefcaseBusiness,
    title: "Premium workflow design",
    description: "A fast and composed dashboard built for high-volume talent operations."
  }
];

function AuthLayout({ title, subtitle, form }) {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1480px] gap-6 lg:grid-cols-[minmax(0,1.08fr)_520px]">
        <motion.section
          className="surface-panel relative hidden overflow-hidden p-8 lg:flex lg:flex-col lg:justify-between lg:p-10"
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="soft-grid absolute inset-0 opacity-30" />
          <div className="relative">
            <div className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">
              HireAI access portal
            </div>
            <h1 className="mt-6 max-w-xl">
              Move from resume overload to a disciplined hiring operating system.
            </h1>
            <p className="mt-4 max-w-lg">
              Built for modern recruiting teams that need speed, signal, and reliable
              collaboration across every stage of the funnel.
            </p>
          </div>

          <div className="relative grid gap-4">
            {highlights.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.title}
                  className="rounded-[24px] border border-border/80 bg-secondary/55 p-5"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.07 }}
                >
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3>{item.title}</h3>
                  <p className="mt-2 text-sm">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          className="surface-panel flex items-center justify-center px-5 py-8 sm:px-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Secure workspace access
              </div>
              <h2 className="mt-3">{title}</h2>
              <p className="mt-3">{subtitle}</p>
            </div>
            {form}
          </div>
        </motion.section>
      </div>
    </div>
  );
}

export default AuthLayout;
