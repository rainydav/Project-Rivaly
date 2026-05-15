import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

const base =
  'inline-flex items-center justify-center gap-2 font-black rounded-2xl transition-transform active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/25 disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<string, string> = {
  primary: 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500',
  secondary:
    'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800',
  danger: 'bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-400',
  ghost: 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
  indigo: 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500',
};

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  children: ReactNode;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${base} ${variants[variant] ?? variants.primary} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[35px] shadow-sm overflow-hidden transition-all ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  variant = 'blue',
}: {
  children: ReactNode;
  variant?: 'blue' | 'orange' | 'emerald' | 'slate';
}) {
  const styles: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  };
  return (
    <span
      className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
