import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col animate-pulse select-none">
      {/* Alabaster Glass Card Skeleton */}
      <div className="p-2.5 rounded-2xl backdrop-blur-xl bg-white/60 border border-black/5 border-t-white/95 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        <div className="w-full aspect-square bg-zinc-200/60 rounded-xl" />
      </div>

      {/* Typography placeholder lines */}
      <div className="pt-3 px-1 space-y-1.5">
        <div className="h-3.5 bg-zinc-200/80 rounded w-3/4" />
        <div className="h-2.5 bg-zinc-200/50 rounded w-1/2" />
      </div>
    </div>
  );
};
