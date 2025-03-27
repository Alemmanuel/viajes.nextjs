// src/app/calculate/api/route.ts

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';


// Precio del galón en COP
const costPerGallon = 15573;

/**
 * Geocodifica una dirección usando Nominatim (OpenStreetMap).
 * No requiere API key.
 */
async function geocodeAddress(address: string) {
  const encoded = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}`;
  const resp = await fetch(url, { headers: { 'User-Agent': 'TripCostManager/1.0' } });
  if (!resp.ok) {
    throw new Error(`Error geocodificando "${address}": ${resp.statusText}`);
  }
  const data = await resp.json();
  if (!data || data.length === 0) {
    throw new Error(`No se encontró ubicación para "${address}"`);
  }
  const { lat, lon } = data[0];
  return { lat: parseFloat(lat), lon: parseFloat(lon) };
}

/**
 * Obtiene la distancia real en km entre dos puntos usando OSRM.
 */
async function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number): Promise<number> {
  const url = `http://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
  const resp = await fetch(url, { headers: { 'User-Agent': 'TripCostManager/1.0' } });
  if (!resp.ok) {
    throw new Error(`Error obteniendo ruta OSRM: ${resp.statusText}`);
  }
  const data = await resp.json();
  if (!data.routes || data.routes.length === 0) {
    throw new Error(`No se encontró ruta en OSRM para los puntos indicados`);
  }
  const distanceMeters = data.routes[0].distance;
  return distanceMeters / 1000;
}

/**
 * Calcula el consumo y costo total de combustible basado en la distancia real y el cilindraje.
 * Asume un consumo base de 7 L/100km para un motor de 1.6L y convierte a galones (1 galón = 3.785 L).
 */
function calculateConsumptionAndCost(distanceKm: number, engineSize: string) {
  const baseConsumption = 7; // L/100km para motor 1.6L
  const rate = parseFloat(engineSize) / 1.6;
  const litersUsed = (distanceKm * baseConsumption * rate) / 100;
  const gallonsUsed = litersUsed / 3.785;
  const totalFuelCost = gallonsUsed * costPerGallon;
  return { gallonsUsed, totalFuelCost };
}

export async function POST(req: Request) {
  try {
    const { origin, destination, engineSize } = await req.json();
    if (!origin || !destination || !engineSize) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos (origin, destination, engineSize)' },
        { status: 400 }
      );
    }

    // Geocodifica origen y destino
    const [originCoords, destinationCoords] = await Promise.all([
      geocodeAddress(origin),
      geocodeAddress(destination),
    ]);

    // Obtiene la distancia real en km usando OSRM
    const distanceKm = await getDistanceInKm(
      originCoords.lat,
      originCoords.lon,
      destinationCoords.lat,
      destinationCoords.lon
    );

    // Calcula el consumo y costo
    const { gallonsUsed, totalFuelCost } = calculateConsumptionAndCost(distanceKm, engineSize);

    // Retorna la estructura requerida
    const responseData = {
      routeSummary: { distanceKm },
      fuelConsumption: { gallonsUsed },
      costDetails: { totalFuelCost },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('Error en POST /calculate/api:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
