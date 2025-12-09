import { WaterLevel } from './supabase';

export interface SystemStatus {
  isRaining: boolean;
  isPumpActive: boolean;
  dailyRainfallVolume: number;
}

export function detectRainAndPump(waterLevels: WaterLevel[]): SystemStatus {
  const status: SystemStatus = {
    isRaining: false,
    isPumpActive: false,
    dailyRainfallVolume: 0,
  };

  if (waterLevels.length === 0) {
    return status;
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const todayLevels = waterLevels.filter(level => {
    const levelDate = new Date(level.timestamp);
    return levelDate >= startOfDay;
  });

  if (todayLevels.length < 2) {
    return status;
  }

  let totalDailyIncrease = 0;
  for (let i = 0; i < todayLevels.length - 1; i++) {
    const diff = todayLevels[i].volume_liters - todayLevels[i + 1].volume_liters;
    if (diff > 0) {
      totalDailyIncrease += diff;
    }
  }

  status.dailyRainfallVolume = totalDailyIncrease;
  if (totalDailyIncrease > 10) {
    status.isRaining = true;
  }

  if (waterLevels.length >= 3) {
    const first = waterLevels[0];
    const second = waterLevels[1];
    const third = waterLevels[2];

    const isDecreasing1 = first.volume_liters < second.volume_liters;
    const isDecreasing2 = second.volume_liters < third.volume_liters;

    if (isDecreasing1 && isDecreasing2) {
      status.isPumpActive = true;
    }
  }

  return status;
}
