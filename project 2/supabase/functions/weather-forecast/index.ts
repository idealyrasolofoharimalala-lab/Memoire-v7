import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OpenMeteoResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    weathercode: number[];
  };
}

function getWeatherCondition(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: "Ensoleillé", icon: "sunny" };
  if (code <= 3) return { condition: "Partiellement nuageux", icon: "cloudy" };
  if (code <= 48) return { condition: "Brouillard", icon: "cloudy" };
  if (code <= 57) return { condition: "Bruine", icon: "rain" };
  if (code <= 67) return { condition: "Pluie", icon: "rain" };
  if (code <= 77) return { condition: "Neige", icon: "rain" };
  if (code <= 82) return { condition: "Averses", icon: "rain" };
  if (code <= 86) return { condition: "Pluies intenses", icon: "heavy-rain" };
  return { condition: "Orage", icon: "heavy-rain" };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const latitude = -18.8792;
    const longitude = 47.5079;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&forecast_days=7`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch weather data");
    }

    const data: OpenMeteoResponse = await response.json();

    const forecasts = data.daily.time.map((date, index) => {
      const dateObj = new Date(date);
      const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
      const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];

      const { condition, icon } = getWeatherCondition(data.daily.weathercode[index]);

      return {
        day: dayNames[dateObj.getDay()],
        date: `${dateObj.getDate()} ${monthNames[dateObj.getMonth()]}`,
        tempMax: Math.round(data.daily.temperature_2m_max[index]),
        tempMin: Math.round(data.daily.temperature_2m_min[index]),
        humidity: 65,
        rainProbability: data.daily.precipitation_probability_max[index] || 0,
        condition,
        icon,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        forecasts,
        location: "Antananarivo, Madagascar",
        coordinates: { latitude, longitude },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching weather:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch weather data",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});