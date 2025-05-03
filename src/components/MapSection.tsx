import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Re-use PropertyData interface
interface PropertyData {
  id: number;
  commune: string;
  adresse: string;
  type: string;
  anneconstr: string;
  valeurcbrechf: number | null;
  surfacelocm: number | null;
  // Add latitude and longitude if available in the future
  // latitude?: number | null;
  // longitude?: number | null;
}

interface MapSectionProps {
  properties: PropertyData[];
}

// Fix for default Leaflet icon issues with bundlers like Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MapSection: React.FC<MapSectionProps> = ({ properties }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Check if coordinates are available (assuming they might be added later)
  // Fix: Use _p for unused variable
  const propertiesWithCoords = properties.filter(_p => false); // Placeholder: check for p.latitude && p.longitude
  const hasCoordinates = propertiesWithCoords.length > 0;

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // Initialize map centered on Switzerland (approximate)
      mapRef.current = L.map(mapContainerRef.current).setView([46.8, 8.2], 8);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
    }

    // Add markers if coordinates become available
    if (mapRef.current && hasCoordinates) {
        // Clear existing markers first (if any)
        // mapRef.current.eachLayer(layer => {
        //     if (layer instanceof L.Marker) {
        //         mapRef.current?.removeLayer(layer);
        //     }
        // });

        // propertiesWithCoords.forEach(prop => {
        //     if (prop.latitude && prop.longitude) {
        //         L.marker([prop.latitude, prop.longitude])
        //             .addTo(mapRef.current!)
        //             .bindPopup(`<b>${prop.adresse}</b><br>${prop.commune}`);
        //     }
        // });

        // Adjust map bounds to fit markers
        // const bounds = L.latLngBounds(propertiesWithCoords.map(p => [p.latitude!, p.longitude!]));
        // mapRef.current.fitBounds(bounds.pad(0.1));
    }

    // Cleanup map instance on component unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [propertiesWithCoords, hasCoordinates]); // Re-run if properties with coords change

  return (
    <section className="bg-white rounded-lg shadow-md p-4 mb-8">
      <h2 className="text-xl font-semibold text-be_capital_dark_grey mb-4">Property Locations Map</h2>
      {!hasCoordinates && (
          <p className="text-be_capital_grey mb-4">
              Map view requires latitude and longitude data for properties, which is currently unavailable in the provided dataset.
              The map below is centered on Switzerland.
          </p>
      )}
      <div ref={mapContainerRef} style={{ height: '400px', width: '100%' }} className="rounded" />
    </section>
  );
};

export default MapSection;

