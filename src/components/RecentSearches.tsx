import React from 'react';
import { motion } from 'framer-motion';
import { SearchType } from '../types/music';

export interface RecentSearchItem {
  id: string;
  query: string;
  type: SearchType;
  timestamp: number;
}

interface RecentSearchesProps {
  recentSearches: RecentSearchItem[];
  onSelect: (item: RecentSearchItem) => void;
  onRemove: (id: string, e: React.MouseEvent) => void;
  onClearAll: () => void;
}

export const RecentSearches: React.FC<RecentSearchesProps> = ({
  recentSearches,
  onSelect,
  onRemove,
  onClearAll,
}) => {
  if (recentSearches.length === 0) return null;

  return (
    <div className="w-full max-w-3xl mx-auto pt-3 flex items-center justify-between text-xs font-mono text-zinc-600 select-none">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-zinc-500 text-[11px] uppercase tracking-wider">history:</span>
        {recentSearches.map((item) => (
          <motion.span
            key={item.id}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md bg-white/70 border border-black/5 border-t-white/95 shadow-[0_2px_8px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] text-zinc-700 hover:text-zinc-950 transition-all cursor-pointer"
          >
            <button
              onClick={() => onSelect(item)}
              className="cursor-pointer lowercase hover:underline truncate max-w-[160px]"
              title={`Re-run search for ${item.query}`}
            >
              {item.query}
            </button>
            <button
              onClick={(e) => onRemove(item.id, e)}
              className="text-zinc-400 hover:text-zinc-800 p-0.5 cursor-pointer transition-colors"
              title="Remove"
            >
              ×
            </button>
          </motion.span>
        ))}
      </div>

      <button
        onClick={onClearAll}
        className="text-[11px] text-zinc-400 hover:text-zinc-800 transition-colors cursor-pointer lowercase ml-4 shrink-0 hover:underline"
      >
        clear
      </button>
    </div>
  );
};
