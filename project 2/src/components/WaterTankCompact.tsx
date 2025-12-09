import { useMemo } from 'react';

interface WaterTankCompactProps {
  currentVolume: number;
  maxCapacity: number;
}

export function WaterTankCompact({ currentVolume, maxCapacity }: WaterTankCompactProps) {
  const fillPercentage = useMemo(() => {
    return Math.min((currentVolume / maxCapacity) * 100, 100);
  }, [currentVolume, maxCapacity]);

  const getFillColor = () => {
    return 'from-blue-400 to-blue-600';
  };

  const getStatusText = () => {
    if (fillPercentage > 75) return 'Cuve pleine';
    if (fillPercentage > 50) return 'Bon niveau';
    if (fillPercentage > 25) return 'Niveau moyen';
    return 'Niveau faible';
  };

  return (
    <div className="relative w-full h-[490px] border-4 border-gray-300 dark:border-gray-600 rounded-3xl overflow-hidden bg-gray-50 dark:bg-gray-900 flex flex-col justify-end shadow-lg">
      <div
        className={`absolute bottom-0 left-0 w-full bg-gradient-to-t ${getFillColor()} transition-all duration-1000 ease-out`}
        style={{ height: `${fillPercentage}%` }}
      >
        <div
          className="absolute inset-0 opacity-20 bg-repeat animate-wave"
          style={{
            backgroundImage: 'linear-gradient(0deg, transparent 50%, rgba(255,255,255,0.2) 50%)',
            backgroundSize: '100% 20px',
          }}
        />
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center z-10 bg-white/15 backdrop-blur-sm rounded-2xl p-8">
          <p className={`text-5xl font-bold ${fillPercentage > 50 ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
            {fillPercentage.toFixed(0)}%
          </p>
          <p className={`text-sm font-semibold mt-2 ${fillPercentage > 50 ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'}`}>
            {getStatusText()}
          </p>
        </div>
      </div>

      <div className="absolute top-3 left-4 text-xs font-medium text-gray-600 dark:text-gray-400">
        100%
      </div>
      <div className="absolute bottom-3 left-4 text-xs font-medium text-gray-600 dark:text-gray-400">
        0%
      </div>
    </div>
  );
}
