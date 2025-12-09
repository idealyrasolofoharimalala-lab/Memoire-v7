import { Droplets, Thermometer, BarChart3, Home, Users, Settings, Upload, Moon, Sun, Bot } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TankSettings } from './TankSettings';
import { WaterLevel } from '../lib/supabase';

interface SidebarProps {
  onNavigate: (section: string) => void;
  activeSection: string;
  waterLevels?: WaterLevel[];
}

export function Sidebar({ onNavigate, activeSection, waterLevels = [] }: SidebarProps) {
  const { user, toggleDarkMode } = useAuth();
  const [logoSrc, setLogoSrc] = useState('/images/logo.svg');
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Tableau de bord' },
    { id: 'water', icon: Droplets, label: 'Niveau d\'eau' },
    { id: 'weather', icon: Thermometer, label: 'Météo' },
    { id: 'stats', icon: BarChart3, label: 'Statistiques' },
    { id: 'ai', icon: Bot, label: 'Assistant IA' },
    { id: 'users', icon: Users, label: 'Utilisateurs', adminOnly: true },
    { id: 'settings', icon: Settings, label: 'Paramètres' },
  ];

  useEffect(() => {
    if (user?.dark_mode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.dark_mode]);

  const handleLogoClick = () => {
    setShowUpload(!showUpload);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setLogoSrc(result);
        localStorage.setItem('customLogo', result);
        setShowUpload(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = () => {
    setLogoSrc('/images/logo.svg');
    localStorage.removeItem('customLogo');
    setShowUpload(false);
  };

  useState(() => {
    const savedLogo = localStorage.getItem('customLogo');
    if (savedLogo) {
      setLogoSrc(savedLogo);
    }
  });

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="relative flex items-center gap-3 mb-4">
          <div
            onClick={handleLogoClick}
            className="cursor-pointer flex-shrink-0 bg-gray-50 dark:bg-gray-700 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
          >
            <img
              src={logoSrc}
              alt="Logo"
              className="h-12 w-12 object-contain"
              onError={() => setLogoSrc('/images/logo.svg')}
            />
          </div>

          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Education For Madagascar</h1>
            
          </div>

          {showUpload && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 z-50">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium mb-2"
              >
                <Upload className="w-4 h-4" />
                Changer le logo
              </button>
              <button
                onClick={handleResetLogo}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm font-medium"
              >
                Réinitialiser
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          if (item.adminOnly && !user?.is_admin) {
            return null;
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          {user?.dark_mode ? (
            <>
              <Sun className="w-5 h-5" />
              Mode clair
            </>
          ) : (
            <>
              <Moon className="w-5 h-5" />
              Mode nuit
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
