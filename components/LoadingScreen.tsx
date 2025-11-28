import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  text: string;
}

const LoadingScreen: React.FC<Props> = ({ text }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-white">
      <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden mb-6">
        <div className="h-full bg-white/80 animate-[shimmer_1s_infinite] w-1/3 mx-auto"></div>
      </div>
      <div className="flex items-center gap-3">
        <Loader2 className="animate-spin text-gray-400 w-5 h-5" />
        <p className="text-lg tracking-widest font-light serif text-gray-200">
          {text}{dots}
        </p>
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
