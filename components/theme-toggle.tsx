'use client';

import { useTheme } from '@/lib/theme-context';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="glass-icon-btn fixed bottom-6 right-6 z-50 p-3 rounded-full transition-all hover:scale-110 active:scale-95"
            aria-label="Toggle Theme"
        >
            {theme === 'light' ? (
                <Moon className="h-6 w-6 text-indigo-600 fill-indigo-600/20" />
            ) : (
                <Sun className="h-6 w-6 text-amber-400 fill-amber-400/20" />
            )}
        </button>
    );
}
