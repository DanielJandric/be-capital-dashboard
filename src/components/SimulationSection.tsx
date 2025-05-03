import React, { useState, useMemo, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MetricCard from './MetricCard';

// Re-use PropertyData interface
interface PropertyData {
  id: number;
  commune: string;
  adresse: string;
  type: string;
  anneconstr: string;
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
  rendnet: string | null; // Keep as string for parsing
  toiture: string | null;
  fentres: string | null;
  chauffagetypeanne: string | null;
  faade: string | null;
  notes: string | null;
  datevaluation: string | null;
  tauxdescomptenominal: number | null;
  tauxcapitalisationexit: number | null;
  inflation: number | null; // Available but might not be the best growth default
}

interface SimulationSectionProps {
  properties: PropertyData[];
  originalTotalValue: number;
}

// Helper to parse percentage string like "3.22 %"
const parsePercentageString = (percentageString: string | null | undefined): number | null => {
    if (!percentageString) return null;
    const numericPart = percentageString.replace(/[^\d.,-]/g, '').replace(',', '.');
    const value = parseFloat(numericPart);
    return isNaN(value) ? null : value;
};

// DCF Calculation Logic
const calculateDcfValue = (
    property: PropertyData,
    discountRatePercent: number,
    exitCapRatePercent: number,
    avgGrowthRatePercent: number,
    holdingPeriodYears: number
): number | null => {
    const originalValue = property.valeurcbrechf;
    const netYieldPercent = parsePercentageString(property.rendnet);

    if (originalValue === null || netYieldPercent === null || discountRatePercent <= 0 || exitCapRatePercent <= 0 || holdingPeriodYears <= 0) {
        console.warn("Invalid input for DCF calculation", { originalValue, netYieldPercent, discountRatePercent, exitCapRatePercent, holdingPeriodYears });
        return originalValue; // Return original value if essential data is missing or invalid
    }

    const currentNOI = originalValue * (netYieldPercent / 100);
    if (isNaN(currentNOI) || currentNOI <= 0) {
        console.warn("Could not calculate valid Current NOI", { originalValue, netYieldPercent });
        return originalValue;
    }

    const discountRate = discountRatePercent / 100;
    const exitCapRate = exitCapRatePercent / 100;
    const growthRate = avgGrowthRatePercent / 100;

    let presentValueNOIs = 0;
    let lastProjectedNOI = currentNOI; // Initialize for loop

    for (let year = 1; year <= holdingPeriodYears; year++) {
        const futureNOI = currentNOI * Math.pow(1 + growthRate, year);
        presentValueNOIs += futureNOI / Math.pow(1 + discountRate, year);
        if (year === holdingPeriodYears) {
            lastProjectedNOI = futureNOI; // Store the NOI of the last year of holding
        }
    }

    // Calculate NOI for the year *after* the holding period for residual value
    const noiYearNplus1 = lastProjectedNOI * (1 + growthRate);
    const residualValue = noiYearNplus1 / exitCapRate;

    // Discount the residual value back to present (end of year N)
    const presentValueResidual = residualValue / Math.pow(1 + discountRate, holdingPeriodYears);

    const simulatedValue = presentValueNOIs + presentValueResidual;

    return isNaN(simulatedValue) ? originalValue : simulatedValue;
};

const SimulationSection: React.FC<SimulationSectionProps> = ({ properties, originalTotalValue }) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  // State for DCF parameters
  const [discountRate, setDiscountRate] = useState<string>('');
  const [exitCapRate, setExitCapRate] = useState<string>('');
  const [avgGrowthRate, setAvgGrowthRate] = useState<string>('1.5'); // Default 1.5% annual growth
  const [holdingPeriod, setHoldingPeriod] = useState<string>('10'); // Default 10 years

  const selectedProperty = useMemo(() => {
    return properties.find(p => p.id.toString() === selectedPropertyId);
  }, [properties, selectedPropertyId]);

  // Effect to update default rates when property changes
  useEffect(() => {
    if (selectedProperty) {
      setDiscountRate(selectedProperty.tauxdescomptenominal?.toString() ?? '');
      setExitCapRate(selectedProperty.tauxcapitalisationexit?.toString() ?? '');
      // Keep user's growth rate and holding period unless they are empty/invalid
      if (!avgGrowthRate || isNaN(parseFloat(avgGrowthRate))) setAvgGrowthRate('1.5');
      if (!holdingPeriod || isNaN(parseInt(holdingPeriod)) || parseInt(holdingPeriod) <= 0) setHoldingPeriod('10');
    } else {
      // Reset if no property selected
      setDiscountRate('');
      setExitCapRate('');
      setAvgGrowthRate('1.5');
      setHoldingPeriod('10');
    }
  }, [selectedProperty]); // Removed avgGrowthRate and holdingPeriod from dependencies to avoid resetting user input

  const simulatedValue = useMemo(() => {
    if (!selectedProperty) return null;

    const discRate = parseFloat(discountRate);
    const capRate = parseFloat(exitCapRate);
    const growth = parseFloat(avgGrowthRate);
    const period = parseInt(holdingPeriod);

    if (isNaN(discRate) || isNaN(capRate) || isNaN(growth) || isNaN(period) || period <= 0) {
        return selectedProperty.valeurcbrechf; // Return original if inputs invalid
    }

    return calculateDcfValue(selectedProperty, discRate, capRate, growth, period);
  }, [selectedProperty, discountRate, exitCapRate, avgGrowthRate, holdingPeriod]);

  const valueDifference = useMemo(() => {
      if (simulatedValue === null || !selectedProperty || selectedProperty.valeurcbrechf === null) return 0;
      return simulatedValue - selectedProperty.valeurcbrechf;
  }, [simulatedValue, selectedProperty]);

  const newTotalValue = useMemo(() => {
      // Ensure originalTotalValue is a valid number
      const validOriginalTotalValue = typeof originalTotalValue === 'number' && !isNaN(originalTotalValue) ? originalTotalValue : 0;
      return validOriginalTotalValue + valueDifference;
  }, [originalTotalValue, valueDifference]);

  return (
    <section className="bg-white rounded-lg shadow-md p-4 mb-8">
      <h2 className="text-xl font-semibold text-be_capital_dark_grey mb-4">DCF Valuation Simulation</h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 items-end">
        {/* Property Selection */}
        <div className="md:col-span-1">
          <Label htmlFor="sim-property">Select Property</Label>
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger id="sim-property">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {properties.map(prop => (
                <SelectItem key={prop.id} value={prop.id.toString()}>
                  {prop.adresse} ({prop.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Discount Rate Input */}
        <div>
          <Label htmlFor="sim-discount">Discount Rate (%)</Label>
          <Input
            id="sim-discount"
            type="number"
            value={discountRate}
            onChange={(e) => setDiscountRate(e.target.value)}
            placeholder="e.g., 4.0"
            step="0.01"
            disabled={!selectedProperty}
          />
        </div>

        {/* Exit Cap Rate Input */}
        <div>
          <Label htmlFor="sim-exitcap">Exit Cap Rate (%)</Label>
          <Input
            id="sim-exitcap"
            type="number"
            value={exitCapRate}
            onChange={(e) => setExitCapRate(e.target.value)}
            placeholder="e.g., 3.5"
            step="0.01"
            disabled={!selectedProperty}
          />
        </div>

        {/* Avg Annual Growth Rate Input */}
        <div>
          <Label htmlFor="sim-growth">Avg. Annual Growth (%)</Label>
          <Input
            id="sim-growth"
            type="number"
            value={avgGrowthRate}
            onChange={(e) => setAvgGrowthRate(e.target.value)}
            placeholder="e.g., 1.5"
            step="0.1"
            disabled={!selectedProperty}
          />
        </div>

        {/* Holding Period Input */}
        <div>
          <Label htmlFor="sim-period">Holding Period (Years)</Label>
          <Input
            id="sim-period"
            type="number"
            value={holdingPeriod}
            onChange={(e) => setHoldingPeriod(e.target.value)}
            placeholder="e.g., 10"
            step="1"
            min="1"
            disabled={!selectedProperty}
          />
        </div>
      </div>

      {/* Simulation Results */}
      {selectedProperty && (
        <div>
          <h3 className="text-lg font-medium text-be_capital_dark_grey mb-4">Simulation Results for: {selectedProperty.adresse}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <MetricCard
                title="Original Value (CBRE)"
                value={selectedProperty.valeurcbrechf?.toLocaleString('fr-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 0 }) ?? '-'}
                borderColor='border-gray-400'
                textColor='text-gray-600'
            />
            <MetricCard
                title="Simulated DCF Value"
                value={simulatedValue?.toLocaleString('fr-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 0 }) ?? '-'}
            />
             <MetricCard
                title="Value Change"
                value={valueDifference.toLocaleString('fr-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 0 }) ?? '-'}
                textColor={valueDifference >= 0 ? 'text-green-600' : 'text-red-600'}
                borderColor={valueDifference >= 0 ? 'border-green-500' : 'border-red-500'}
            />
            <MetricCard
                title="Original Total Portfolio Value"
                value={originalTotalValue?.toLocaleString('fr-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 0 }) ?? '-'}
                borderColor='border-gray-400'
                textColor='text-gray-600'
            />
             <MetricCard
                title="New Total Portfolio Value"
                value={newTotalValue?.toLocaleString('fr-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 0 }) ?? '-'}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default SimulationSection;

