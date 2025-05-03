import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
}

interface ChartsSectionProps {
  properties: PropertyData[];
}

// Helper to parse yield string for numeric value
const parseYield = (yieldStr: string | null): number => {
  if (!yieldStr) return 0;
  const cleanedStr = String(yieldStr).replace('%', '').trim();
  const value = parseFloat(cleanedStr);
  return isNaN(value) ? 0 : value;
};

// Define colors for charts (using BE Capital theme inspiration)
const COLORS = ['#bfa78a', '#b3b3b3', '#8a7e72', '#cccccc', '#d9d9d9']; // Gold, Grey, Darker Gold/Grey, Lighter Greys

const ChartsSection: React.FC<ChartsSectionProps> = ({ properties }) => {
  // Data preparation for charts
  const typeDistributionData = React.useMemo(() => {
    const counts: { [key: string]: number } = {};
    properties.forEach(prop => {
      const type = prop.type || 'Unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [properties]);

  const yieldByCommuneData = React.useMemo(() => {
    const yields: { [key: string]: { totalYield: number; count: number } } = {};
    properties.forEach(prop => {
      const commune = prop.commune || 'Unknown';
      const yieldValue = parseYield(prop.rendbrut);
      if (!yields[commune]) {
        yields[commune] = { totalYield: 0, count: 0 };
      }
      yields[commune].totalYield += yieldValue;
      yields[commune].count += 1;
    });
    return Object.entries(yields).map(([name, data]) => ({
      name,
      averageYield: data.count > 0 ? parseFloat((data.totalYield / data.count).toFixed(2)) : 0,
    })).sort((a, b) => b.averageYield - a.averageYield); // Sort by yield descending
  }, [properties]);

  const valueByYearData = React.useMemo(() => {
      const values: { [key: string]: number } = {};
      properties.forEach(prop => {
          const year = prop.anneconstr || 'Unknown';
          if (year !== 'Unknown') { // Only include properties with a valid year
              values[year] = (values[year] || 0) + (prop.valeurcbrechf || 0);
          }
      });
      return Object.entries(values)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => parseInt(a.name) - parseInt(b.name)); // Sort by year ascending
  }, [properties]);

  // Custom Tooltip for Charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // const data = payload[0].payload; // Removed unused variable
      const value = payload[0].value;
      const name = payload[0].name; // For BarChart, name is the dataKey ('averageYield', 'value')

      let displayValue = value;
      if (name === 'averageYield') {
          displayValue = `${value.toFixed(2)}%`;
      } else if (name === 'value') {
          displayValue = value.toLocaleString('fr-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 0 });
      }

      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow-sm text-sm">
          <p className="font-semibold">{`${label}`}</p>
          {/* For PieChart, payload[0].name is the slice name (e.g., property type) */}
          {payload[0].payload.name && <p>{`${payload[0].payload.name}: ${displayValue}`}</p>}
          {/* For BarChart, label is the XAxis value (e.g., commune or year) */}
          {!payload[0].payload.name && <p>{`${name}: ${displayValue}`}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <section className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Property Type Distribution Pie Chart */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="text-be_capital_dark_grey">Property Types</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {typeDistributionData.map((_entry, index) => ( // Use _entry to indicate it's not directly used in this map
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Average Yield by Commune Bar Chart */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-be_capital_dark_grey">Average Gross Yield by Commune</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yieldByCommuneData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-15} textAnchor="end" height={50} interval={0} fontSize={10} />
              <YAxis unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="averageYield" fill={COLORS[0]} name="Avg. Yield" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Total Value by Construction Year Bar Chart */}
       <Card className="col-span-1 lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-be_capital_dark_grey">Total Portfolio Value (CBRE) by Construction Year</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={valueByYearData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} interval={0} fontSize={10} />
              <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="value" fill={COLORS[1]} name="Total Value (CHF)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </section>
  );
};

export default ChartsSection;

