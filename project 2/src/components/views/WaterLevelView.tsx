import { useState } from 'react';
import { Droplets, Calendar, TrendingDown, Search, Clock, Cloud, AlertCircle } from 'lucide-react';
import { WaterLevel } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';

interface WaterLevelViewProps {
  waterLevels: WaterLevel[];
  latestWater: WaterLevel | null;
}

export function WaterLevelView({ waterLevels, latestWater }: WaterLevelViewProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [searchResult, setSearchResult] = useState<WaterLevel | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      alert('Veuillez sélectionner une date et une heure');
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const searchDateTime = new Date(`${selectedDate}T${selectedTime}`);
      const searchTimestamp = searchDateTime.toISOString();

      const { data } = await supabase
        .from('water_levels')
        .select('*')
        .lte('timestamp', searchTimestamp)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      setSearchResult(data || null);
    } catch (error) {
      console.error('Error searching historical data:', error);
      alert('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const calculateAverage = () => {
    if (waterLevels.length === 0) return 0;
    const sum = waterLevels.reduce((acc, level) => acc + level.volume_m3, 0);
    return sum / waterLevels.length;
  };

  const calculateTrend = () => {
    if (waterLevels.length < 2) return 0;
    const recent = waterLevels.slice(0, 5);
    const older = waterLevels.slice(5, 10);

    if (older.length === 0) return 0;

    const recentAvg = recent.reduce((acc, l) => acc + l.volume_m3, 0) / recent.length;
    const olderAvg = older.reduce((acc, l) => acc + l.volume_m3, 0) / older.length;

    return ((recentAvg - olderAvg) / olderAvg) * 100;
  };

  const average = calculateAverage();
  const trend = calculateTrend();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-5 h-5" />
            <h3 className="text-sm font-medium opacity-90">Volume actuel</h3>
          </div>
          <p className="text-4xl font-bold mb-1">
            {latestWater ? latestWater.volume_m3.toFixed(3) : '---'}
          </p>
          <p className="text-sm opacity-75">m³ ({latestWater ? latestWater.volume_liters.toFixed(0) : '---'} L)</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Volume moyen</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {average.toFixed(3)}
          </p>
          <p className="text-sm text-gray-500">m³</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Tendance</h3>
          </div>
          <p className={`text-3xl font-bold mb-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500">vs lectures précédentes</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg shadow-lg p-4 text-white mb-6">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Recherche historique</h3>
          </div>
          <p className="text-sm opacity-90 mt-1">Consultez les données à une date et heure spécifique</p>
        </div>

        <form onSubmit={handleSearch} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </div>
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Heure
                </div>
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>Recherche en cours...</>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Rechercher
              </>
            )}
          </button>
        </form>

        {searched && searchResult && (
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Résultat pour le {selectedDate} à {selectedTime}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Volume (m³)</p>
                <p className="text-3xl font-bold text-blue-600">
                  {searchResult.volume_m3.toFixed(3)}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Volume (Litres)</p>
                <p className="text-3xl font-bold text-cyan-600">
                  {searchResult.volume_liters.toFixed(2)}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Eau consommée</p>
                <p className="text-3xl font-bold text-red-600">
                  {(searchResult.water_consumed_liters || 0).toFixed(2)} L
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pluie récupérée</p>
                <p className="text-3xl font-bold text-green-600">
                  {(searchResult.rain_recovered_liters || 0).toFixed(2)} L
                </p>
              </div>
            </div>
            <div className="bg-blue-100 dark:bg-blue-800/30 rounded-lg p-3 mt-4">
              <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mb-1">
                Enregistré le:
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {formatDateTime(searchResult.timestamp)}
              </p>
            </div>
          </div>
        )}

        {searched && !searchResult && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Aucune donnée d'eau trouvée pour cette date/heure
            </p>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Historique complet des volumes d’eau</h3>
        </div>
        <div className="overflow-y-auto max-h-[600px]">
          {waterLevels.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Aucune donnée disponible</p>
          ) : (
            <div className="space-y-2">
              {waterLevels.map((level, index) => (
                <div
                  key={level.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-600 transition overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Droplets className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {level.volume_m3.toFixed(3)} m³ • {level.volume_liters.toFixed(0)} L
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(level.timestamp).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {index === 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full block mb-2">
                          Plus récent
                        </span>
                      )}
                    </div>
                  </div>
                  {(level.water_consumed_liters || level.rain_recovered_liters) && (
                    <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-600 flex gap-4">
                      {level.water_consumed_liters !== undefined && level.water_consumed_liters > 0 && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-red-600">
                            Consomation: {level.water_consumed_liters.toFixed(2)} L
                          </span>
                        </div>
                      )}
                      {level.rain_recovered_liters !== undefined && level.rain_recovered_liters > 0 && (
                        <div className="flex items-center gap-2">
                          <Cloud className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">
                            Pluie: {level.rain_recovered_liters.toFixed(2)} L
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
