import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SensorData {
  volume_m3?: number;
  volume_liters?: number;
  temperature?: number;
  humidity?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const data: SensorData = await req.json();

    // Validate data
    if (!data.volume_m3 && !data.volume_liters && !data.temperature && !data.humidity) {
      return new Response(
        JSON.stringify({ error: "Au moins une donnée est requise" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const results: any = {};

    // Insert water level data if provided
    if (data.volume_m3 !== undefined || data.volume_liters !== undefined) {
      const volume_m3 = data.volume_m3 || (data.volume_liters ? data.volume_liters / 1000 : 0);
      const volume_liters = data.volume_liters || (data.volume_m3 ? data.volume_m3 * 1000 : 0);

      const { data: waterData, error: waterError } = await supabase
        .from("water_levels")
        .insert({
          volume_m3,
          volume_liters,
        })
        .select()
        .single();

      if (waterError) {
        console.error("Error inserting water level:", waterError);
        results.water_error = waterError.message;
      } else {
        results.water_level = waterData;
      }
    }

    // Insert atmospheric data if provided
    if (data.temperature !== undefined || data.humidity !== undefined) {
      const { data: atmosphericData, error: atmosphericError } = await supabase
        .from("atmospheric_conditions")
        .insert({
          temperature: data.temperature || 0,
          humidity: data.humidity || 0,
        })
        .select()
        .single();

      if (atmosphericError) {
        console.error("Error inserting atmospheric data:", atmosphericError);
        results.atmospheric_error = atmosphericError.message;
      } else {
        results.atmospheric_condition = atmosphericData;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Données insérées avec succès",
        results,
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
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({
        error: "Erreur lors du traitement de la requête",
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
