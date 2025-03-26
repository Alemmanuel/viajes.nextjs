// src/app/calculate/api/route.ts
import { NextResponse } from "next/server";

type RequestBody = {
  origin: string;
  destination: string;
  engineSize: string;
};

const FUEL_EFFICIENCY: { [key: string]: number } = {
  "0.8": 18, "1.0": 16, "1.2": 15, "1.3": 14, "1.5": 12, "1.6": 11, "1.8": 10,
  "2.0": 9, "2.2": 8.5, "2.4": 8, "2.7": 7, "3.0": 6.5, "3.5": 6, "4.0": 5,
};

async function getCoordinates(location: string): Promise<{ lat: string; lon: string }> {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
  if (!res.ok) throw new Error(`Error al obtener coordenadas para ${location}: ${res.statusText}`);
  const data = await res.json();
  if (!data || data.length === 0) throw new Error(`No se encontró la ubicación: ${location}`);
  return { lat: data[0].lat, lon: data[0].lon };
}

async function getDistance(
  originCoords: { lat: string; lon: string },
  destinationCoords: { lat: string; lon: string }
): Promise<number> {
  const res = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${originCoords.lon},${originCoords.lat};${destinationCoords.lon},${destinationCoords.lat}?overview=false`
  );
  if (!res.ok) throw new Error("Error al obtener la distancia: " + res.statusText);
  const data = await res.json();
  if (!data.routes || data.routes.length === 0) throw new Error("No se pudo calcular la distancia entre las ubicaciones.");
  return data.routes[0].distance / 1000; // Convertir de metros a kilómetros
}

async function getFuelPrice(): Promise<number> {
  // Default to a fixed price if external API fails
  return 15753; // Valor predeterminado en COP
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { origin, destination, engineSize } = (await request.json()) as RequestBody;

    if (!origin || !destination || !engineSize) {
      throw new Error("Datos faltantes o inválidos en la solicitud.");
    }

    const [originCoords, destinationCoords] = await Promise.all([
      getCoordinates(origin),
      getCoordinates(destination),
    ]);

    const distance = await getDistance(originCoords, destinationCoords);
    const kmPerGallon = FUEL_EFFICIENCY[engineSize] || 10;
    const gallonsUsed = distance / kmPerGallon;
    const fuelPricePerGallon = await getFuelPrice();
    const totalFuelCost = gallonsUsed * fuelPricePerGallon;

    return NextResponse.json({
      distance: distance,
      gallonsUsed: gallonsUsed,
      fuelCost: totalFuelCost,
      routeSummary: {
        origin: origin,
        destination: destination,
        distanceKm: distance,
      },
      fuelConsumption: {
        engineSize: engineSize,
        kmPerGallon: kmPerGallon,
        gallonsUsed: gallonsUsed,
      },
      costDetails: {
        fuelPricePerGallon: fuelPricePerGallon,
        totalFuelCost: totalFuelCost,
        currency: "COP",
      },
    });
  } catch (error: unknown) {
    console.error("Error en API route:", error);
    let errorMessage = "Error procesando la solicitud.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}