import { Thermometer, TrendingUp, Activity, CloudRain, Power, Droplets, Clock, Cloud } from 'lucide-react';
import { WaterLevel, AtmosphericCondition } from '../../lib/supabase';
import { StatisticsPanel } from '../StatisticsPanel';
import { WaterTankCompact } from '../WaterTankCompact';
import { detectRainAndPump } from '../../lib/statusDetection';

interface DashboardViewProps {
  latestWater: WaterLevel | null;
  latestAtmospheric: AtmosphericCondition | null;
  waterLevels: WaterLevel[];
  atmospheric: AtmosphericCondition[];
  maxCapacity: number;
}

export function DashboardView({ latestWater, latestAtmospheric, waterLevels, atmospheric, maxCapacity }: DashboardViewProps) {
  const status = detectRainAndPump(waterLevels);

  const calculateDailyStats = () => {
    if (waterLevels.length === 0) {
      return { consumption: 0, rainRecovered: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayReadings = waterLevels.filter(level => {
      const readingDate = new Date(level.timestamp);
      readingDate.setHours(0, 0, 0, 0);
      return readingDate.getTime() === today.getTime();
    });

    const consumption = todayReadings.reduce((sum, level) => sum + (level.water_consumed_liters || 0), 0);
    const rainRecovered = todayReadings.reduce((sum, level) => sum + (level.rain_recovered_liters || 0), 0);

    return { consumption, rainRecovered };
  };

  const calculateMonthlyStats = () => {
    if (waterLevels.length === 0) {
      return {
        currentMonthConsumption: 0,
        currentMonthRain: 0,
        lastMonthConsumption: 0,
        lastMonthRain: 0
      };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const firstDayCurrentMonth = new Date(currentYear, currentMonth, 1);
    const firstDayLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayLastMonth = new Date(currentYear, currentMonth, 0);
    lastDayLastMonth.setHours(23, 59, 59, 999);

    const currentMonthReadings = waterLevels.filter(level => {
      const date = new Date(level.timestamp);
      return date >= firstDayCurrentMonth;
    });

    const lastMonthReadings = waterLevels.filter(level => {
      const date = new Date(level.timestamp);
      return date >= firstDayLastMonth && date <= lastDayLastMonth;
    });

    return {
      currentMonthConsumption: currentMonthReadings.reduce((sum, level) => sum + (level.water_consumed_liters || 0), 0),
      currentMonthRain: currentMonthReadings.reduce((sum, level) => sum + (level.rain_recovered_liters || 0), 0),
      lastMonthConsumption: lastMonthReadings.reduce((sum, level) => sum + (level.water_consumed_liters || 0), 0),
      lastMonthRain: lastMonthReadings.reduce((sum, level) => sum + (level.rain_recovered_liters || 0), 0)
    };
  };

  const dailyStats = calculateDailyStats();
  const monthlyStats = calculateMonthlyStats();
  const lastUpdateTime = latestWater ? new Date(latestWater.timestamp) : null;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl shadow-sm p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Dernière mise à jour</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
              {lastUpdateTime
                ? lastUpdateTime.toLocaleString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })
                : 'Aucune donnée'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Niveau de la cuve</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <WaterTankCompact
                currentVolume={latestWater?.volume_m3 || 0}
                maxCapacity={maxCapacity}
              />
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-center mb-2">
                  <Droplets className="w-5 h-5 text-blue-600 dark:text-blue-300 mr-2" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Volume en m³</p>
                </div>
                <p className="text-4xl font-bold text-blue-700 dark:text-blue-300 my-2">
                  {latestWater ? latestWater.volume_m3.toFixed(3) : '---'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">mètres cubes</p>
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900 dark:to-cyan-800 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Volume en litres</p>
                <p className="text-4xl font-bold text-cyan-700 dark:text-cyan-300 my-2">
                  {latestWater ? (latestWater.volume_m3 * 1000).toFixed(0) : '---'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">litres</p>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Capacité maximale</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{maxCapacity} m³</p>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Capacité libre</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{Math.round((maxCapacity - (latestWater?.volume_m3 || 0)) * 1000) / 1000} m³</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 dark:bg-red-900 p-3 rounded-lg">
              <Droplets className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Consommation journalière</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dailyStats.consumption.toFixed(0)} L
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
              <Cloud className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Pluie récupérée</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dailyStats.rainRecovered.toFixed(0)} L
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg">
              <Thermometer className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Température</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {latestAtmospheric ? `${latestAtmospheric.temperature.toFixed(1)}°C` : '---'}
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {latestAtmospheric && new Date(latestAtmospheric.timestamp).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Humidité</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {latestAtmospheric ? `${latestAtmospheric.humidity.toFixed(1)}%` : '---'}
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {latestAtmospheric && new Date(latestAtmospheric.timestamp).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
              <Droplets className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Consommation mois dernier</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {monthlyStats.lastMonthConsumption.toFixed(0)} L
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(new Date().getFullYear(), new Date().getMonth() - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 dark:bg-red-900 p-3 rounded-lg">
              <Droplets className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Consommation mois en cours</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {monthlyStats.currentMonthConsumption.toFixed(0)} L
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-teal-100 dark:bg-teal-900 p-3 rounded-lg">
              <Cloud className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Pluie récupérée mois dernier</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {monthlyStats.lastMonthRain.toFixed(0)} L
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(new Date().getFullYear(), new Date().getMonth() - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
              <Cloud className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Pluie récupérée mois en cours</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {monthlyStats.currentMonthRain.toFixed(0)} L
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      <StatisticsPanel waterLevels={waterLevels} atmospheric={atmospheric} />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Résumé d'activité</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">Total de lectures</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">{waterLevels.length + atmospheric.length}</p>
          </div>
          <div className="bg-cyan-50 dark:bg-cyan-900 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">Lectures d'eau</p>
            <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-300">{waterLevels.length}</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">Lectures météo</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-300">{atmospheric.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
