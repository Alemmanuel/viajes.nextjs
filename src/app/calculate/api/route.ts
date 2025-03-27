// src/app/calculate/api/route.ts

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

// Usa la cadena de conexión; si no está definida en el entorno, se usa la predeterminada.
const connectionString =
  process.env.DATABASE_URL ||
  'postgres://neondb_owner:npg_BXPliJTQv14m@ep-royal-hat-a50vyfld-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

// Precio del galón en Colombia (COP)
const costPerGallon = 15573;

// Función para obtener lat/lon desde una dirección usando Nominatim
async function geocodeAddress(address: string) {
  const encoded = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}`;
  const resp = await fetch(url, { headers: { 'User-Agent': 'TripCostManager/1.0' } });
  if (!resp.ok) {
    throw new Error(`Error geocodificando "${address}": ${resp.statusText}`);
  }

  const data = await resp.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`No se encontró ubicación para "${address}"`);
  }

  // Tomamos la primera coincidencia
  const { lat, lon } = data[0];
  return { lat: parseFloat(lat), lon: parseFloat(lon) };
}

// Función para obtener la distancia real (en km) usando OSRM
async function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  // OSRM usa el formato: /route/v1/driving/{lon1},{lat1};{lon2},{lat2}
  // Devuelve la distancia en metros
  const url = `http://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
  const resp = await fetch(url, { headers: { 'User-Agent': 'TripCostManager/1.0' } });
  if (!resp.ok) {
    throw new Error(`Error obteniendo ruta OSRM: ${resp.statusText}`);
  }

  const data = await resp.json();
  if (!data.routes || data.routes.length === 0) {
    throw new Error(`No se encontró ruta en OSRM para los puntos [${lat1},${lon1}] -> [${lat2},${lon2}]`);
  }

  const distanceMeters = data.routes[0].distance;
  const distanceKm = distanceMeters / 1000;
  return distanceKm;
}

// Calcula consumo y costo con base en la distancia, cilindraje y precio del galón en Colombia
function calculateConsumptionAndCost(distanceKm: number, engineSize: string) {
  // Consumo base: 7 L/100km para un motor 1.6
  const baseConsumption = 7; 
  const rate = parseFloat(engineSize) / 1.6; 
  const litersUsed = (distanceKm * baseConsumption * rate) / 100;
  const gallonsUsed = litersUsed / 3.785;
  const totalFuelCost = gallonsUsed * costPerGallon;

  return { gallonsUsed, totalFuelCost };
}

export async function POST(req: Request) {
  try {
    // Recibe datos del frontend
    const { origin, destination, engineSize } = await req.json();
    if (!origin || !destination || !engineSize) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos (origin, destination, engineSize)' },
        { status: 400 }
      );
    }

    // 1. Geocodificar origen y destino con Nominatim
    const [originCoords, destinationCoords] = await Promise.all([
      geocodeAddress(origin),
      geocodeAddress(destination),
    ]);

    // 2. Obtener distancia real usando OSRM
    const distanceKm = await getDistanceInKm(
      originCoords.lat,
      originCoords.lon,
      destinationCoords.lat,
      destinationCoords.lon
    );

    // 3. Calcular consumo y costo
    const { gallonsUsed, totalFuelCost } = calculateConsumptionAndCost(distanceKm, engineSize);

    // 4. Retornar la estructura que tu frontend espera
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
