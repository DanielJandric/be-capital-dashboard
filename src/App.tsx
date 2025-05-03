import React, { useState, useMemo, useCallback } from 'react';
import data from './data/real_estate_data.json';
import './styles/globals.css';
import MetricCard from './components/MetricCard';
import PropertyTable from './components/PropertyTable';
import ChartsSection from './components/ChartsSection';
import FilterControls from './components/FilterControls';
import MapSection from './components/MapSection';
import ComparisonTool from './components/ComparisonTool';
import SimulationSection from './components/SimulationSection';

// Define interfaces for better type safety
interface PropertyData {
  id: number;
  commune: string;
  adresse: string;
  type: string;
  anneconstr: string; // Corrected type based on JSON conversion
  prixacquisitionchf: number | null;
  financementchf: number | null;
  financement: number | null;
  valeurcbrechf: number | null;
  loyerannuelsourcechf: number | null;
  loyerfutursourcechf: number | null;
  rendbrutsource: number | null;
  constructionrnovation: string | null;
  surfacelocm: number | null;
  vacance: number | null;
  loyeractuelchfancbre: number | null;
  loyerpotentielchfancbre: number | null;
  potentiel: number | null;
  rendbrut: string | null;
  rendnet: string | null;
  toiture: string | null;
  fentres: string | null;
  chauffagetypeanne: string | null;
  faade: string | null;
  notes: string | null;
  datevaluation: string | null;
  tauxdescomptenominal: number | null;
  tauxcapitalisationexit: number | null;
  inflation: number | null;
  // latitude?: number | null; // Add if available
  // longitude?: number | null; // Add if available
}

// Helper function to safely parse yield string
const parseYield = (yieldStr: string | null): number => {
  if (!yieldStr) return 0;
  const cleanedStr = String(yieldStr).replace('%', '').trim();
  const value = parseFloat(cleanedStr);
  return isNaN(value) ? 0 : value;
};

const App: React.FC = () => {
  // Cast data to unknown first, then to PropertyData[] to satisfy TS
  const allProperties: PropertyData[] = data as unknown as PropertyData[];

  // State for filters
  const [filters, setFilters] = useState({
    commune: '',
    type: '',
    yearMin: '',
    yearMax: '',
    searchTerm: '',
  });

  // State for selected properties for comparison
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<Set<number>>(new Set());

  // Memoize unique communes and types for filter dropdowns
  const uniqueCommunes = useMemo(() => {
    const communes = new Set(allProperties.map(p => p.commune).filter(Boolean));
    return Array.from(communes).sort();
  }, [allProperties]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(allProperties.map(p => p.type).filter(Boolean));
    return Array.from(types).sort();
  }, [allProperties]);

  // Filter properties based on state
  const filteredProperties = useMemo(() => {
    return allProperties.filter(prop => {
      const year = parseInt(prop.anneconstr, 10);
      const yearMin = parseInt(filters.yearMin, 10);
      const yearMax = parseInt(filters.yearMax, 10);

      const communeMatch = !filters.commune || prop.commune === filters.commune;
      const typeMatch = !filters.type || prop.type === filters.type;
      const yearMinMatch = !filters.yearMin || (isNaN(year) || isNaN(yearMin)) || year >= yearMin;
      const yearMaxMatch = !filters.yearMax || (isNaN(year) || isNaN(yearMax)) || year <= yearMax;
      const searchMatch = !filters.searchTerm || 
                          prop.adresse?.toLowerCase().includes(filters.searchTerm.toLowerCase());

      return communeMatch && typeMatch && yearMinMatch && yearMaxMatch && searchMatch;
    });
  }, [allProperties, filters]);

  // Callback for filter changes
  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    // Clear selection when filters change to avoid confusion
    setSelectedPropertyIds(new Set()); 
  }, []);

  // Callback for property selection changes
  const handleSelectionChange = useCallback((propertyId: number, isSelected: boolean) => {
    setSelectedPropertyIds(prev => {
      const next = new Set(prev);
      if (isSelected) {
        next.add(propertyId);
      } else {
        next.delete(propertyId);
      }
      return next;
    });
  }, []);

  // Get the actual property data for selected IDs
  const propertiesToCompare = useMemo(() => {
      return allProperties.filter(prop => selectedPropertyIds.has(prop.id));
  }, [allProperties, selectedPropertyIds]);

  // Calculate stats based on filtered properties
  const totalValue = useMemo(() => filteredProperties.reduce((sum, prop) => sum + (prop.valeurcbrechf || 0), 0), [filteredProperties]);
  const totalProperties = useMemo(() => filteredProperties.length, [filteredProperties]);
  const averageYield = useMemo(() => totalProperties > 0
    ? filteredProperties.reduce((sum, prop) => sum + parseYield(prop.rendbrut), 0) / totalProperties
    : 0, [filteredProperties, totalProperties]);
  const totalSurface = useMemo(() => filteredProperties.reduce((sum, prop) => sum + (prop.surfacelocm || 0), 0), [filteredProperties]);

  // Calculate original total value for simulation baseline
  const originalTotalValue = useMemo(() => allProperties.reduce((sum, prop) => sum + (prop.valeurcbrechf || 0), 0), [allProperties]);

  return (
    <div className="min-h-screen bg-be_capital_light_grey p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-be_capital_dark_grey text-center">BE Capital - Real Estate Portfolio Overview</h1>
      </header>

      {/* Consolidated Metrics Section */}
      <section className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
         <MetricCard
          title="Total Portfolio Value (CBRE)"
          value={totalValue.toLocaleString('fr-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 0 })}
        />
        <MetricCard
          title="Properties Displayed"
          value={totalProperties}
        />
        <MetricCard
          title="Average Gross Yield"
          value={averageYield.toFixed(2)}
          unit="%"
        />
        <MetricCard
          title="Total Surface Area"
          value={totalSurface.toLocaleString('fr-CH')}
          unit="m²"
        />
      </section>

      {/* Filtering/Search Controls Section */}
      <FilterControls 
        communes={uniqueCommunes} 
        types={uniqueTypes} 
        onFilterChange={handleFilterChange} 
      />

      {/* Charts Section */}
      <ChartsSection properties={filteredProperties} />

      {/* Map Section */}
      <MapSection properties={filteredProperties} />

      {/* Detailed Property Table Section */}
      <section className="bg-white rounded-lg shadow-md p-4 mb-8">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-be_capital_dark_grey">Consolidated Property Data ({totalProperties} items)</h2>
            {/* Comparison Tool Trigger */}
            <ComparisonTool selectedProperties={propertiesToCompare} />
        </div>
        <PropertyTable 
            properties={filteredProperties} 
            selectedProperties={selectedPropertyIds}
            onSelectionChange={handleSelectionChange}
        />
      </section>

      {/* Simulation Section */}
      <SimulationSection properties={allProperties} originalTotalValue={originalTotalValue} />

      {/* Placeholder for other sections (Enhancements?) */}
      {/* <section className="bg-white rounded-lg shadow-md p-4">
         <h2 className="text-xl font-semibold text-be_capital_dark_grey mb-4">Additional Features (Placeholder)</h2>
         <p className="text-be_capital_grey">UI/UX enhancements (animations, transitions) could be added here.</p>
      </section> */}

      <footer className="mt-8 text-center text-sm text-be_capital_grey">
        Generated by Manus AI - {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default App;

