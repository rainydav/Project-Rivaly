import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function ThemeToggleButton({ className = '' }: { className?: string }) {
  const { isDark, toggleDark } = useApp();

  return (
    <button
      type="button"
      onClick={toggleDark}
      title={isDark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}
      aria-label={isDark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}
      className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white text-amber-500 shadow-sm transition hover:border-amber-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:border-slate-500 ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, rotate: -70, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 70, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          >
            <Moon size={22} strokeWidth={2.25} className="text-slate-200" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, rotate: 70, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -70, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          >
            <Sun size={22} strokeWidth={2.25} className="text-amber-500" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
