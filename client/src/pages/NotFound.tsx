import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { MASCOT } from '@/lib/assets';


export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#FFF8E7' }}>
      <motion.img
        src={MASCOT}
        alt="Hilal"
        className="w-24 h-24 mb-6"
        animate={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <h1 className="text-3xl font-bold text-teal-700" style={{ fontFamily: 'var(--font-heading)' }}>
        Oops!
      </h1>
      <p className="text-gray-600 mt-2 mb-6">This page doesn't exist yet.</p>
      <button
        onClick={() => navigate('/')}
        className="px-8 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-white font-bold rounded-full shadow-lg"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Go Home
      </button>
    </div>
  );
}
