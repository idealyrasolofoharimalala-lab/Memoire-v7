import { useState } from 'react';
import { Calendar, Search, Droplets, Thermometer, Clock, Cloud, Zap } from 'lucide-react';
import { supabase, WaterLevel, AtmosphericCondition } from '../../lib/supabase';

export function HistoryView() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [searchResults, setSearchResults] = useState<{
    water: WaterLevel | null;
    atmospheric: AtmosphericCondition | null;
  } | null>(null);
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

      const { data: waterData } = await supabase
        .from('water_levels')
        .select('*')
        .lte('timestamp', searchTimestamp)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: atmosphericData } = await supabase
        .from('atmospheric_conditions')
        .select('*')
        .lte('timestamp', searchTimestamp)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      setSearchResults({
        water: waterData || null,
        atmospheric: atmosphericData || null,
      });
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

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Historique des données</h2>
        </div>
        <p className="text-sm opacity-90">Consultez les données à une date et heure spécifique</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <form onSubmit={handleSearch} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
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
      </div>

      {searched && searchResults && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Résultats pour le {selectedDate} à {selectedTime}
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-600 p-3 rounded-lg">
                    <Droplets className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Niveau d'eau</h4>
                </div>

                {searchResults.water ? (
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Volume (m³)</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {searchResults.water.volume_m3.toFixed(3)}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Volume (Litres)</p>
                      <p className="text-3xl font-bold text-cyan-600">
                        {searchResults.water.volume_liters.toFixed(2)}
                      </p>
                    </div>
                    {searchResults.water.water_consumed_liters !== undefined && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Eau consommée</p>
                        <p className="text-3xl font-bold text-red-600">
                          {searchResults.water.water_consumed_liters.toFixed(2)} L
                        </p>
                      </div>
                    )}
                    {searchResults.water.rain_recovered_liters !== undefined && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pluie récupérée</p>
                        <p className="text-3xl font-bold text-green-600">
                          {searchResults.water.rain_recovered_liters.toFixed(2)} L
                        </p>
                      </div>
                    )}
                    <div className="bg-blue-100 rounded-lg p-3">
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mb-1">
                        Enregistré le:
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {formatDateTime(searchResults.water.timestamp)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      Aucune donnée d'eau trouvée pour cette date/heure
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-orange-600 p-3 rounded-lg">
                    <Thermometer className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Conditions météo</h4>
                </div>

                {searchResults.atmospheric ? (
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Température</p>
                      <p className="text-3xl font-bold text-orange-600">
                        {searchResults.atmospheric.temperature.toFixed(1)}°C
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Humidité</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {searchResults.atmospheric.humidity.toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-orange-100 rounded-lg p-3">
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mb-1">
                        Enregistré le:
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {formatDateTime(searchResults.atmospheric.timestamp)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      Aucune donnée météo trouvée pour cette date/heure
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Les résultats affichent la dernière lecture enregistrée avant ou à la date/heure sélectionnée.
            </p>
          </div>
        </div>
      )}

      {searched && !searchResults?.water && !searchResults?.atmospheric && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-center text-red-800 font-medium">
            Aucune donnée trouvée pour cette date et heure
          </p>
        </div>
      )}
    </div>
  );
}
