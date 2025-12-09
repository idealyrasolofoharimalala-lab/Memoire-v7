export interface WeatherForecast {
  day: string;
  date: string;
  tempMax: number;
  tempMin: number;
  humidity: number;
  rainProbability: number;
  condition: string;
  icon: string;
}

interface WeatherCache {
  forecasts: WeatherForecast[];
  timestamp: number;
}

const CACHE_DURATION = 3600000;
let weatherCache: WeatherCache | null = null;

const FALLBACK_FORECAST: WeatherForecast[] = generateFallbackForecast();

function generateFallbackForecast(): WeatherForecast[] {
  const forecasts: WeatherForecast[] = [];
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    forecasts.push({
      day: dayNames[date.getDay()],
      date: `${date.getDate()} ${monthNames[date.getMonth()]}`,
      tempMax: 26 + Math.floor(Math.random() * 4),
      tempMin: 19 + Math.floor(Math.random() * 4),
      humidity: 60 + Math.floor(Math.random() * 15),
      rainProbability: Math.floor(Math.random() * 80),
      condition: 'Variable',
      icon: 'cloudy'
    });
  }

  return forecasts;
}

async function fetchWeatherFromAPI(): Promise<WeatherForecast[]> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase configuration missing, using fallback data');
      return FALLBACK_FORECAST;
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/weather-forecast`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.forecasts) {
      return data.forecasts;
    } else {
      throw new Error('Invalid weather data format');
    }
  } catch (error) {
    console.error('Error fetching weather:', error);
    return FALLBACK_FORECAST;
  }
}

export async function getWeekForecast(): Promise<WeatherForecast[]> {
  const now = Date.now();

  if (weatherCache && (now - weatherCache.timestamp) < CACHE_DURATION) {
    return weatherCache.forecasts;
  }

  const forecasts = await fetchWeatherFromAPI();

  weatherCache = {
    forecasts,
    timestamp: now
  };

  return forecasts;
}

export async function hasRainForecast(days: number = 2): Promise<boolean> {
  const forecasts = await getWeekForecast();
  return forecasts.slice(0, days).some(f => f.rainProbability >= 50);
}

export async function getRainAlerts(): Promise<string[]> {
  const alerts: string[] = [];
  const forecasts = await getWeekForecast();
  const highRainDays = forecasts.filter(f => f.rainProbability >= 60);

  if (highRainDays.length > 0) {
    alerts.push(`Pluie probable les ${highRainDays.map(d => d.day).join(', ')}`);
  }

  return alerts;
}
