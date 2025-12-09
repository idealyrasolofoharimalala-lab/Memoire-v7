import { useState, useEffect } from 'react';
import { Thermometer, Droplets, Wind, Calendar, AlertTriangle, Cloud, CloudRain, Loader } from 'lucide-react';
import { AtmosphericCondition } from '../../lib/supabase';
import { getWeekForecast, getRainAlerts, WeatherForecast } from '../../services/weatherService';

interface WeatherViewProps {
  atmospheric: AtmosphericCondition[];
  latestAtmospheric: AtmosphericCondition | null;
}

export function WeatherView({ atmospheric, latestAtmospheric }: WeatherViewProps) {
  const [weekForecast, setWeekForecast] = useState<WeatherForecast[]>([]);
  const [rainAlerts, setRainAlerts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWeatherData = async () => {
      setLoading(true);
      try {
        const [forecast, alerts] = await Promise.all([
          getWeekForecast(),
          getRainAlerts()
        ]);
        setWeekForecast(forecast);
        setRainAlerts(alerts);
      } catch (error) {
        console.error('Error loading weather data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWeatherData();
  }, []);

  const calculateStats = () => {
    if (atmospheric.length === 0) {
      return {
        avgTemp: 0,
        avgHumidity: 0,
        maxTemp: 0,
        minTemp: 0,
        maxHumidity: 0,
        minHumidity: 0
      };
    }

    const temps = atmospheric.map(a => a.temperature);
    const humidities = atmospheric.map(a => a.humidity);

    return {
      avgTemp: temps.reduce((a, b) => a + b, 0) / temps.length,
      avgHumidity: humidities.reduce((a, b) => a + b, 0) / humidities.length,
      maxTemp: Math.max(...temps),
      minTemp: Math.min(...temps),
      maxHumidity: Math.max(...humidities),
      minHumidity: Math.min(...humidities)
    };
  };

  const stats = calculateStats();

  const getComfortLevel = () => {
    if (!latestAtmospheric) return { text: 'Indisponible', color: 'gray' };

    const temp = latestAtmospheric.temperature;
    const humidity = latestAtmospheric.humidity;

    if (temp >= 20 && temp <= 26 && humidity >= 40 && humidity <= 60) {
      return { text: 'Confortable', color: 'green' };
    } else if (temp > 30 || humidity > 70) {
      return { text: 'Chaud et humide', color: 'orange' };
    } else if (temp < 15) {
      return { text: 'Froid', color: 'blue' };
    } else {
      return { text: 'Acceptable', color: 'yellow' };
    }
  };

  const comfort = getComfortLevel();

  const getWeatherIcon = (icon: string) => {
    switch(icon) {
      case 'sunny':
        return <CloudRain className="w-6 h-6 text-yellow-500" />;
      case 'cloudy':
        return <Cloud className="w-6 h-6 text-gray-400" />;
      case 'rain':
      case 'heavy-rain':
        return <CloudRain className="w-6 h-6 text-blue-500" />;
      default:
        return <Cloud className="w-6 h-6 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {rainAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-l-4 border-amber-500 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900 dark:text-amber-100">Alerte Météo</h4>
            {rainAlerts.map((alert, idx) => (
              <p key={idx} className="text-sm text-amber-800 dark:text-amber-200 mt-1">{alert}</p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="w-5 h-5" />
            <h3 className="text-sm font-medium opacity-90">Température actuelle</h3>
          </div>
          <p className="text-5xl font-bold mb-1">
            {latestAtmospheric ? `${latestAtmospheric.temperature.toFixed(1)}°` : '---'}
          </p>
          <p className="text-sm opacity-75">Celsius</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-5 h-5" />
            <h3 className="text-sm font-medium opacity-90">Humidité actuelle</h3>
          </div>
          <p className="text-5xl font-bold mb-1">
            {latestAtmospheric ? `${latestAtmospheric.humidity.toFixed(0)}%` : '---'}
          </p>
          <p className="text-sm opacity-75">Humidité relative</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Wind className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Surveillance de l’environnement physique de l’Arduino</h3>
        </div>
        <div className={`bg-${comfort.color}-50 border border-${comfort.color}-200 rounded-lg p-6 text-center`}>
          <p className={`text-3xl font-bold text-${comfort.color}-700 mb-2`}>{comfort.text}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Basé sur la température et l'humidité actuelles</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Statistiques température</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Moyenne</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.avgTemp.toFixed(1)}°C</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Maximum</span>
              <span className="text-lg font-bold text-red-600">{stats.maxTemp.toFixed(1)}°C</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Minimum</span>
              <span className="text-lg font-bold text-blue-600">{stats.minTemp.toFixed(1)}°C</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Statistiques humidité</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Moyenne</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.avgHumidity.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Maximum</span>
              <span className="text-lg font-bold text-cyan-600">{stats.maxHumidity.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Minimum</span>
              <span className="text-lg font-bold text-orange-600">{stats.minHumidity.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Cloud className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Prévisions météo - Ambohibe</h3>
          {loading && <Loader className="w-4 h-4 animate-spin text-blue-600" />}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Chargement des prévisions...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {weekForecast.map((day, idx) => {
              const isToday = idx === 0;
            return (
              <div
                key={idx}
                className={`p-4 rounded-lg text-center border transition ${
                  isToday
                    ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-400 dark:border-blue-600 ring-2 ring-blue-300 dark:ring-blue-500'
                    : day.rainProbability >= 60
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                }`}
              >
                <p className={`font-semibold text-sm mb-2 ${
                  isToday
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {day.day}
                </p>
                {isToday && (
                  <p className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full inline-block mb-2">Aujourd'hui</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{day.date}</p>

                <div className="flex justify-center mb-3">
                  {getWeatherIcon(day.icon)}
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">{day.condition}</p>

                <div className="space-y-1 mb-3">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {day.tempMax}°
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {day.tempMin}°
                  </p>
                </div>

                <div className={`text-xs font-semibold ${
                  day.rainProbability >= 60
                    ? 'text-blue-600 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {day.rainProbability}% pluie
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Historique température et humidité complet</h3>
        </div>
        <div className="overflow-y-auto max-h-[500px]">
          {atmospheric.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Aucune donnée disponible</p>
          ) : (
            <div className="space-y-2">
              {atmospheric.map((condition, index) => (
                <div
                  key={condition.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-orange-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <Thermometer className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {condition.temperature.toFixed(1)}°C
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(condition.timestamp).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">
                      {condition.humidity.toFixed(0)}%
                    </p>
                    {index === 0 && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Plus récent
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
