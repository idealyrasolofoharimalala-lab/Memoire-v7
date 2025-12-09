import { useState, useEffect } from 'react';
import { Settings, Download, X } from 'lucide-react';
import { supabase, WaterLevel } from '../lib/supabase';

interface TankSettingsProps {
  waterLevels: WaterLevel[];
}

export function TankSettings({ waterLevels }: TankSettingsProps) {
  const [showModal, setShowModal] = useState(false);
  const [maxCapacity, setMaxCapacity] = useState(10);
  const [tempCapacity, setTempCapacity] = useState('10');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const savedCapacity = localStorage.getItem('tankMaxCapacity');
    if (savedCapacity) {
      const capacity = parseFloat(savedCapacity);
      setMaxCapacity(capacity);
      setTempCapacity(savedCapacity);
    }
  }, []);

  const handleSaveCapacity = () => {
    const capacity = parseFloat(tempCapacity);
    if (!isNaN(capacity) && capacity > 0) {
      setMaxCapacity(capacity);
      localStorage.setItem('tankMaxCapacity', capacity.toString());
      window.dispatchEvent(new Event('tankCapacityChanged'));
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

      const headers = ['ID', 'Timestamp', 'Volume (m³)', 'Volume (Litres)', 'Date de création'];
      const csvRows = [headers.join(',')];

      data.forEach((level: WaterLevel) => {
        const row = [
          level.id,
          level.timestamp,
          level.volume_m3.toFixed(3),
          level.volume_liters.toFixed(2),
          level.created_at
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
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
      >
        <Settings className="w-5 h-5" />
        Paramètres
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Paramètres</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Capacité maximale de la cuve</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Capacité maximale (m³)
                    </label>
                    <input
                      type="number"
                      value={tempCapacity}
                      onChange={(e) => setTempCapacity(e.target.value)}
                      step="0.1"
                      min="0.1"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSaveCapacity}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Exporter données (CSV)</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Date de début
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <button
                    onClick={exportToCSV}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Exporter CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
