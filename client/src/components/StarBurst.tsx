/**
 * StarBurst Component - QuranIQ Kids
 * Animated celebration effect with stars bursting outward
 */

import { motion } from 'framer-motion';

interface StarBurstProps {
  show: boolean;
  count?: number;
}

export default function StarBurst({ show, count = 12 }: StarBurstProps) {
  if (!show) return null;

  const stars = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 360;
    const distance = 80 + Math.random() * 60;
    const x = Math.cos((angle * Math.PI) / 180) * distance;
    const y = Math.sin((angle * Math.PI) / 180) * distance;
    const size = 12 + Math.random() * 16;
    const delay = Math.random() * 0.3;

    return { id: i, x, y, size, delay, angle };
  });

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
      {stars.map(star => (
        <motion.div
          key={star.id}
          className="absolute text-yellow-400"
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{ 
            x: star.x, 
            y: star.y, 
            scale: [0, 1.2, 0.8],
            opacity: [1, 1, 0],
            rotate: star.angle + 180,
          }}
          transition={{ 
            duration: 1,
            delay: star.delay,
            ease: 'easeOut',
          }}
          style={{ fontSize: star.size }}
        >
          ⭐
        </motion.div>
      ))}
    </div>
  );
}
