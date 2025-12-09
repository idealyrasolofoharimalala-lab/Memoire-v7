import { useState } from 'react';
import { BarChart3, TrendingUp, Activity, Database, Calendar, Cloud, Droplets } from 'lucide-react';
import { WaterLevel, AtmosphericCondition } from '../../lib/supabase';

interface StatisticsViewProps {
  waterLevels: WaterLevel[];
  atmospheric: AtmosphericCondition[];
}

export function StatisticsView({ waterLevels, atmospheric }: StatisticsViewProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const calculateWaterStats = (data: WaterLevel[]) => {
    if (data.length === 0) {
      return {
        total: 0,
        avgVolume: 0,
        maxVolume: 0,
        minVolume: 0,
        consumption: 0,
        totalConsumption: 0,
        totalRainRecovered: 0
      };
    }

    const volumes = data.map(w => w.volume_m3);
    const consumptions = data.map(w => w.water_consumed_liters || 0);
    const rainRecovered = data.map(w => w.rain_recovered_liters || 0);

    let consumption = 0;
    if (data.length >= 2) {
      const firstVolume = data[data.length - 1].volume_m3;
      const lastVolume = data[0].volume_m3;
      consumption = Math.abs(firstVolume - lastVolume);
    }

    return {
      total: data.length,
      avgVolume: volumes.reduce((a, b) => a + b, 0) / volumes.length,
      maxVolume: Math.max(...volumes),
      minVolume: Math.min(...volumes),
      consumption: consumption,
      totalConsumption: consumptions.reduce((a, b) => a + b, 0),
      totalRainRecovered: rainRecovered.reduce((a, b) => a + b, 0)
    };
  };

  const getFilteredWaterLevels = () => {
    if (!startDate && !endDate) return waterLevels;

    return waterLevels.filter(level => {
      const levelDate = new Date(level.timestamp);
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);

      return levelDate >= start && levelDate <= end;
    });
  };

  const calculateAtmosphericStats = () => {
    if (atmospheric.length === 0) {
      return {
        total: 0,
        avgTemp: 0,
        avgHumidity: 0,
        maxTemp: 0,
        minTemp: 0
      };
    }

    const temps = atmospheric.map(a => a.temperature);
    const humidities = atmospheric.map(a => a.humidity);

    return {
      total: atmospheric.length,
      avgTemp: temps.reduce((a, b) => a + b, 0) / temps.length,
      avgHumidity: humidities.reduce((a, b) => a + b, 0) / humidities.length,
      maxTemp: Math.max(...temps),
      minTemp: Math.min(...temps)
    };
  };

  const calculateDataFrequency = () => {
    if (waterLevels.length < 2) return 0;

    const timestamps = waterLevels.map(w => new Date(w.timestamp).getTime());
    const differences = [];

    for (let i = 0; i < timestamps.length - 1; i++) {
      differences.push(timestamps[i] - timestamps[i + 1]);
    }

    const avgDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
    return avgDiff / 1000 / 60;
  };

  const filteredWaterLevels = getFilteredWaterLevels();
  const waterStats = calculateWaterStats(filteredWaterLevels);
  const atmosphericStats = calculateAtmosphericStats();
  const dataFrequency = calculateDataFrequency();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Statistiques globales</h2>
        </div>
        <p className="text-sm opacity-90">Analyse complète des données collectées</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filtrer par période</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date de début
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date de fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de données</h3>
          </div>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {waterLevels.length + atmospheric.length}
          </p>
          <p className="text-sm text-gray-500 mt-1">lectures enregistrées</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Fréquence</h3>
          </div>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {dataFrequency > 0 ? dataFrequency.toFixed(1) : '---'}
          </p>
          <p className="text-sm text-gray-500 mt-1">minutes entre lectures</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Activité</h3>
          </div>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {waterLevels.length > 0 ? 'Active' : 'Inactive'}
          </p>
          <p className="text-sm text-gray-500 mt-1">état du système</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Statistiques d'eau</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Lectures totales</p>
              <p className="text-3xl font-bold text-blue-600">{waterStats.total}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Volume max</p>
                <p className="text-xl font-bold text-green-600">{waterStats.maxVolume.toFixed(3)} m³</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Volume min</p>
                <p className="text-xl font-bold text-red-600">{waterStats.minVolume.toFixed(3)} m³</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total consommé</p>
                <p className="text-xl font-bold text-red-600">{waterStats.totalConsumption.toFixed(2)} L</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Pluie récupérée</p>
                <p className="text-xl font-bold text-green-600">{waterStats.totalRainRecovered.toFixed(2)} L</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Statistiques météo</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Lectures totales</p>
              <p className="text-3xl font-bold text-orange-600">{atmosphericStats.total}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Temp. moyenne</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{atmosphericStats.avgTemp.toFixed(1)}°C</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Humidité moy.</p>
                <p className="text-xl font-bold text-blue-600">{atmosphericStats.avgHumidity.toFixed(1)}%</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Temp. max</p>
                <p className="text-xl font-bold text-red-600">{atmosphericStats.maxTemp.toFixed(1)}°C</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Temp. min</p>
                <p className="text-xl font-bold text-cyan-600">{atmosphericStats.minTemp.toFixed(1)}°C</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Informations système</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-2">Dernière lecture d'eau</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {waterLevels.length > 0
                ? new Date(waterLevels[0].timestamp).toLocaleString('fr-FR')
                : 'Aucune donnée'}
            </p>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-2">Dernière lecture météo</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {atmospheric.length > 0
                ? new Date(atmospheric[0].timestamp).toLocaleString('fr-FR')
                : 'Aucune donnée'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
