import { useMemo } from 'react';

interface WaterTankVisualProps {
  currentVolume: number;
  maxCapacity: number;
}

export function WaterTankVisual({ currentVolume, maxCapacity }: WaterTankVisualProps) {
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-100 dark:border-gray-700 h-full">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">Niveau de la cuve</h3>

      <div className="flex flex-col gap-8 h-full">
        <div className="relative w-full h-96 border-4 border-gray-300 dark:border-gray-600 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-900 flex flex-col justify-end">
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
            <div className="text-center z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <p className={`text-6xl font-bold ${fillPercentage > 50 ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                {fillPercentage.toFixed(0)}%
              </p>
              <p className={`text-base font-semibold mt-2 ${fillPercentage > 50 ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'}`}>
                {getStatusText()}
              </p>
            </div>
          </div>

          <div className="absolute top-2 left-3 text-sm font-medium text-gray-500 dark:text-gray-400">
            100%
          </div>
          <div className="absolute bottom-2 left-3 text-sm font-medium text-gray-500 dark:text-gray-400">
            0%
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 w-full">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-xl p-6 text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Volume en m³</p>
            <p className="text-4xl font-bold text-blue-700 dark:text-blue-300">
              {currentVolume.toFixed(3)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">mètres cubes</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900 dark:to-cyan-800 rounded-xl p-6 text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Volume en litres</p>
            <p className="text-4xl font-bold text-cyan-700 dark:text-cyan-300">
              {(currentVolume * 1000).toFixed(0)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">litres</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-base font-medium text-gray-600 dark:text-gray-400">Capacité maximale</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">{maxCapacity} m³</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base font-medium text-gray-600 dark:text-gray-400">Capacité libre</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">{(maxCapacity - currentVolume).toFixed(3)} m³</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
