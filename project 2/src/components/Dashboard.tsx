import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, WaterLevel, AtmosphericCondition } from '../lib/supabase';
import { LogOut } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { DashboardView } from './views/DashboardView';
import { WaterLevelView } from './views/WaterLevelView';
import { WeatherView } from './views/WeatherView';
import { StatisticsView } from './views/StatisticsView';
import { UsersView } from './views/UsersView';
import { SettingsView } from './views/SettingsView';
import { AIAssistantView } from './views/AIAssistantView';

export function Dashboard() {
  const { signOut, user } = useAuth();
  const [waterLevels, setWaterLevels] = useState<WaterLevel[]>([]);
  const [atmospheric, setAtmospheric] = useState<AtmosphericCondition[]>([]);
  const [latestWater, setLatestWater] = useState<WaterLevel | null>(null);
  const [latestAtmospheric, setLatestAtmospheric] = useState<AtmosphericCondition | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [maxCapacity, setMaxCapacity] = useState(10);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const savedCapacity = localStorage.getItem('tankMaxCapacity');
    if (savedCapacity) {
      setMaxCapacity(parseFloat(savedCapacity));
    }

    const lastWater = localStorage.getItem('lastWaterLevel');
    if (lastWater) {
      setLatestWater(JSON.parse(lastWater));
    }

    const lastAtmo = localStorage.getItem('lastAtmospheric');
    if (lastAtmo) {
      setLatestAtmospheric(JSON.parse(lastAtmo));
    }

    const lastUpdateTime = localStorage.getItem('lastUpdateTime');
    if (lastUpdateTime) {
      setLastUpdate(new Date(lastUpdateTime));
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToChanges();
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleCapacityChange = () => {
      const saved = localStorage.getItem('tankMaxCapacity');
      if (saved) {
        setMaxCapacity(parseFloat(saved));
      }
    };

    window.addEventListener('tankCapacityChanged', handleCapacityChange);
    return () => window.removeEventListener('tankCapacityChanged', handleCapacityChange);
  }, []);

  const loadData = async () => {
    try {
      const { data: waterData } = await supabase
        .from('water_levels')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      const { data: atmosphericData } = await supabase
        .from('atmospheric_conditions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (waterData) {
        setWaterLevels(waterData);
        if (waterData.length > 0) {
          setLatestWater(waterData[0]);
          localStorage.setItem('lastWaterLevel', JSON.stringify(waterData[0]));
        }
      }

      if (atmosphericData) {
        setAtmospheric(atmosphericData);
        if (atmosphericData.length > 0) {
          setLatestAtmospheric(atmosphericData[0]);
          localStorage.setItem('lastAtmospheric', JSON.stringify(atmosphericData[0]));
        }
      }

      const now = new Date();
      setLastUpdate(now);
      localStorage.setItem('lastUpdateTime', now.toISOString());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChanges = () => {
    const waterChannel = supabase
      .channel('water_levels_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'water_levels' },
        (payload) => {
          const newLevel = payload.new as WaterLevel;
          setLatestWater(newLevel);
          localStorage.setItem('lastWaterLevel', JSON.stringify(newLevel));
          setLastUpdate(new Date());
          localStorage.setItem('lastUpdateTime', new Date().toISOString());
          setWaterLevels((prev) => [newLevel, ...prev.slice(0, 99)]);
        }
      )
      .subscribe();

    const atmosphericChannel = supabase
      .channel('atmospheric_conditions_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'atmospheric_conditions' },
        (payload) => {
          const newCondition = payload.new as AtmosphericCondition;
          setLatestAtmospheric(newCondition);
          localStorage.setItem('lastAtmospheric', JSON.stringify(newCondition));
          setLastUpdate(new Date());
          localStorage.setItem('lastUpdateTime', new Date().toISOString());
          setAtmospheric((prev) => [newCondition, ...prev.slice(0, 99)]);
        }
      )
      .subscribe();

    return () => {
      waterChannel.unsubscribe();
      atmosphericChannel.unsubscribe();
    };
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'dashboard':
        return 'Tableau de bord';
      case 'water':
        return 'Niveau d\'eau';
      case 'weather':
        return 'Météo';
      case 'stats':
        return 'Statistiques';
      case 'settings':
        return 'Paramètres';
      case 'ai':
        return 'Assistant IA';
      case 'users':
        return 'Utilisateurs';
      default:
        return 'Dashboard';
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <DashboardView
            latestWater={latestWater}
            latestAtmospheric={latestAtmospheric}
            waterLevels={waterLevels}
            atmospheric={atmospheric}
            maxCapacity={maxCapacity}
          />
        );
      case 'water':
        return <WaterLevelView waterLevels={waterLevels} latestWater={latestWater} />;
      case 'weather':
        return <WeatherView atmospheric={atmospheric} latestAtmospheric={latestAtmospheric} />;
      case 'stats':
        return <StatisticsView waterLevels={waterLevels} atmospheric={atmospheric} />;
      case 'settings':
        return <SettingsView waterLevels={waterLevels} />;
      case 'ai':
        return (
          <AIAssistantView
            waterLevels={waterLevels}
            atmospheric={atmospheric}
            latestWater={latestWater}
            latestAtmospheric={latestAtmospheric}
          />
        );
      case 'users':
        if (!user?.is_admin) {
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Accès refusé</h3>
              <p className="text-red-700">Seuls les administrateurs peuvent accéder à cette section.</p>
            </div>
          );
        }
        return <UsersView />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Chargement...</div>
      </div>
    );
  }

  const getTimeAgo = (date: Date | null) => {
    if (!date) return 'N/A';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'à l\'instant';
    if (minutes < 60) return `il y a ${minutes}m`;
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar onNavigate={setActiveSection} activeSection={activeSection} waterLevels={waterLevels} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{getSectionTitle()}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isOnline ? '🟢 En ligne' : '🔴 Hors ligne'} · Dernière mise à jour: {getTimeAgo(lastUpdate)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{user?.username}</span>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50 dark:bg-gray-900">
          {!isOnline && (
            <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
              <div className="text-amber-600 dark:text-amber-400 text-lg">⚠️</div>
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-200">Vous êtes hors ligne</h3>
                <p className="text-sm text-amber-800 dark:text-amber-300">Les données affichées sont les dernières données reçues. Reconnectez-vous pour synchroniser.</p>
              </div>
            </div>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
