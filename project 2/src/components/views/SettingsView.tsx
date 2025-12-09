import { useState, useEffect } from 'react';
import { Settings, Download, Database, Copy, Check } from 'lucide-react';
import { supabase, WaterLevel } from '../../lib/supabase';

interface SettingsViewProps {
  waterLevels: WaterLevel[];
}

export function SettingsView({ waterLevels }: SettingsViewProps) {
  const [maxCapacity, setMaxCapacity] = useState(10);
  const [tempCapacity, setTempCapacity] = useState('10');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const savedCapacity = localStorage.getItem('tankMaxCapacity');
    if (savedCapacity) {
      const capacity = parseFloat(savedCapacity);
      setMaxCapacity(capacity);
      setTempCapacity(savedCapacity);
    }

    const url = import.meta.env.VITE_SUPABASE_URL || '';
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    setSupabaseUrl(url);
    setSupabaseKey(key);
  }, []);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveCapacity = () => {
    const capacity = parseFloat(tempCapacity);
    if (!isNaN(capacity) && capacity > 0) {
      setMaxCapacity(capacity);
      localStorage.setItem('tankMaxCapacity', capacity.toString());
      window.dispatchEvent(new Event('tankCapacityChanged'));
      alert('Capacité maximale enregistrée avec succès');
    }
  };

  const exportToCSV = async () => {
    try {
      let query = supabase.from('water_levels').select('*');

      if (startDate || endDate) {
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        query = query
          .gte('timestamp', start.toISOString())
          .lte('timestamp', end.toISOString());
      }

      const { data, error } = await query.order('timestamp', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        alert('Aucune donnée à exporter');
        return;
      }

      const headers = ['ID', 'Timestamp', 'Volume (m³)', 'Volume (Litres)'];
      const csvRows = [headers.join(',')];

      data.forEach((level: WaterLevel) => {
        const row = [
          level.id,
          level.timestamp,
          level.volume_m3.toFixed(3),
          level.volume_liters.toFixed(2)
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `water_levels_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Erreur lors de l\'export CSV');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Paramètres</h2>
        </div>
        <p className="text-sm opacity-90">Configuration du système</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Capacité maximale de la cuve</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Capacité maximale (m³)
            </label>
            <input
              type="number"
              value={tempCapacity}
              onChange={(e) => setTempCapacity(e.target.value)}
              step="0.1"
              min="0.1"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <button
            onClick={handleSaveCapacity}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-base font-medium"
          >
            Enregistrer
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configuration Supabase</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL Supabase
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={supabaseUrl}
                readOnly
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg bg-gray-50 font-mono text-sm outline-none"
              />
              <button
                onClick={() => copyToClipboard(supabaseUrl, 'url')}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {copiedField === 'url' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Clé API Anon
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={supabaseKey}
                readOnly
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg bg-gray-50 font-mono text-sm outline-none"
              />
              <button
                onClick={() => copyToClipboard(supabaseKey, 'key')}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {copiedField === 'key' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> Ces informations proviennent de votre fichier .env. Pour modifier la connexion Supabase, mettez à jour les variables d'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY, puis redémarrez l'application.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Exporter données (CSV)</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date de début
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <button
            onClick={exportToCSV}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-base font-medium"
          >
            <Download className="w-5 h-5" />
            Exporter CSV
          </button>
        </div>
      </div>
    </div>
  );
}
