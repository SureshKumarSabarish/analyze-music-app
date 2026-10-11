import React from 'react';
import { motion } from 'framer-motion';

export const LiquidBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none bg-[#FAFAFA]">
      {/* Soft Peach / Apricot Pastel Orb (Top Left to Center) */}
      <motion.div
        animate={{
          x: [0, 80, -60, 0],
          y: [0, 90, 40, 0],
          scale: [1, 1.25, 0.9, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-[10%] -left-[10%] w-[680px] h-[680px] rounded-full bg-gradient-to-tr from-[#ffedd5] via-[#fed7aa] to-[#fef08a] blur-[120px] opacity-70"
      />

      {/* Soft Sky Blue Pastel Orb (Top Right to Center) */}
      <motion.div
        animate={{
          x: [0, -100, 60, 0],
          y: [0, 110, -50, 0],
          scale: [1, 1.2, 0.95, 1],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
        className="absolute top-[5%] -right-[15%] w-[740px] h-[740px] rounded-full bg-gradient-to-bl from-[#e0f2fe] via-[#bae6fd] to-[#dbeafe] blur-[120px] opacity-75"
      />

      {/* Soft Mint Green / Sage Pastel Orb (Bottom Left / Center) */}
      <motion.div
        animate={{
          x: [0, 120, -80, 0],
          y: [0, -90, 50, 0],
          scale: [1, 1.25, 0.9, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        className="absolute -bottom-[15%] left-[15%] w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-[#dcfce7] via-[#a7f3d0] to-[#ccfbf1] blur-[120px] opacity-65"
      />

      {/* Soft Lavender / Rose Pastel Orb (Mid Right to Bottom) */}
      <motion.div
        animate={{
          x: [0, -80, 90, 0],
          y: [0, -70, 60, 0],
          scale: [0.95, 1.15, 1.05, 0.95],
        }}
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 3,
        }}
        className="absolute top-[45%] -right-[5%] w-[640px] h-[640px] rounded-full bg-gradient-to-br from-[#fae8ff] via-[#f3e8ff] to-[#e0e7ff] blur-[120px] opacity-60"
      />

      {/* Subtle Tactile Paper/Noise Grain Texture */}
      <div className="absolute inset-0 opacity-15 mix-blend-multiply pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <filter id="pastel-noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#pastel-noise)" />
        </svg>
      </div>
    </div>
  );
};
