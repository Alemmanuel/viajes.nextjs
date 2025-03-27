// src/app/calculate/page.tsx

"use client";
import { useState, FormEvent } from "react";

export default function CalculatePage() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [engineSize, setEngineSize] = useState("1.6");
  const [routeData, setRouteData] = useState<{
    distance?: number;
    gallonsUsed?: number;
    fuelCost?: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setRouteData(null);

    try {
      const res = await fetch("/calculate/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination, engineSize }),
      });

      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
        return;
      }

      setRouteData({
        distance: Number(data.routeSummary.distanceKm),
        gallonsUsed: Number(data.fuelConsumption.gallonsUsed),
        fuelCost: Number(data.costDetails.totalFuelCost)
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Calcular Costo de Viaje</h1>
      <form onSubmit={handleSubmit} className="form">
        <div className="field">
          <label>Origen:</label>
          <input 
            type="text" 
            value={origin} 
            onChange={(e) => setOrigin(e.target.value)} 
            required 
            disabled={isLoading}
          />
        </div>
        <div className="field">
          <label>Destino:</label>
          <input 
            type="text" 
            value={destination} 
            onChange={(e) => setDestination(e.target.value)} 
            required 
            disabled={isLoading}
          />
        </div>
        <div className="field">
          <label>Cilindraje del vehículo:</label>
          <select 
            value={engineSize} 
            onChange={(e) => setEngineSize(e.target.value)}
            disabled={isLoading}
          >
            {["0.8", "1.0", "1.2", "1.3", "1.4", "1.5", "1.6", "1.8", "2.0", "2.2", "2.4", "2.7", "3.0", "3.5", "4.0"].map((size) => (
              <option key={size} value={size}>
                {size} litros
              </option>
            ))}
          </select>
        </div>
        <button 
          type="submit" 
          className="button" 
          disabled={isLoading}
        >
          {isLoading ? 'Buscando...' : 'Calcular costo total'}
        </button>
      </form>

      {isLoading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Buscando información...</p>
        </div>
      )}

      {error && (
        <div className="error">
          <p>{error}</p>
        </div>
      )}

      {routeData && (
        <div className="result">
          <h2>Distancia: {routeData.distance?.toFixed(2)} km</h2>
          <h2>Galones usados: {routeData.gallonsUsed?.toFixed(2)} gal</h2>
          <h2>Costo total del combustible: ${routeData.fuelCost?.toFixed(2)} COP</h2>
        </div>
      )}
    </div>
  );
}
