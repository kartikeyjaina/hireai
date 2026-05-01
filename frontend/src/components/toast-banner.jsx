import { AnimatePresence, motion } from "framer-motion";

function ToastBanner({ message }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          className="fixed bottom-5 right-5 z-50 rounded-2xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-100 shadow-panel backdrop-blur"
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
        >
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default ToastBanner;
