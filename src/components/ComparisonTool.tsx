import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"; // Assuming shadcn/ui Dialog

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

interface ComparisonToolProps {
  selectedProperties: PropertyData[];
}

// Define which metrics to compare
const comparisonMetrics: { key: keyof PropertyData; label: string; format?: (value: any) => string }[] = [
  { key: 'adresse', label: 'Adresse' },
  { key: 'commune', label: 'Commune' },
  { key: 'type', label: 'Type' },
  { key: 'anneconstr', label: 'Année constr.' },
  { key: 'valeurcbrechf', label: 'Valeur CBRE (CHF)', format: (v) => v?.toLocaleString('fr-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 0 }) ?? '-' },
  { key: 'surfacelocm', label: 'Surface loc. (m²)', format: (v) => v?.toLocaleString('fr-CH') ?? '-' },
  { key: 'loyeractuelchfancbre', label: 'Loyer actuel (CHF/an)', format: (v) => v?.toLocaleString('fr-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 0 }) ?? '-' },
  { key: 'rendbrut', label: 'Rend. brut' },
  { key: 'vacance', label: 'Vacance (%)', format: (v) => v !== null && v !== undefined ? `${(Number(v) * 100).toFixed(2)}%` : '-' },
];

const ComparisonTool: React.FC<ComparisonToolProps> = ({ selectedProperties }) => {
  if (selectedProperties.length < 2) {
    return (
      <p className="text-be_capital_grey italic">
        Select at least two properties from the table to compare.
      </p>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-white border-be_capital_grey text-be_capital_dark_grey hover:bg-gray-50">
          Compare Selected ({selectedProperties.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl"> {/* Adjust width as needed */}
        <DialogHeader>
          <DialogTitle>Compare Properties</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto py-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-be_capital_dark_grey uppercase tracking-wider">Metric</th>
                {selectedProperties.map(prop => (
                  <th key={prop.id} className="px-4 py-2 text-left text-xs font-medium text-be_capital_dark_grey uppercase tracking-wider truncate" title={prop.adresse}>
                    {prop.adresse} ({prop.id})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {comparisonMetrics.map(metric => (
                <tr key={metric.key}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{metric.label}</td>
                  {selectedProperties.map(prop => (
                    <td key={`${prop.id}-${metric.key}`} className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                      {metric.format
                        ? metric.format(prop[metric.key])
                        : prop[metric.key] !== null && prop[metric.key] !== undefined
                        ? String(prop[metric.key])
                        : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ComparisonTool;

