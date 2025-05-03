import React, { useState, useMemo } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generatePropertyPDF } from '@/utils/pdfGenerator'; // Import the PDF generator
import { Download } from 'lucide-react'; // Import an icon for the button

// Re-using the PropertyData interface
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

interface PropertyTableProps {
  properties: PropertyData[];
  selectedProperties: Set<number>; // Set of selected property IDs
  onSelectionChange: (propertyId: number, isSelected: boolean) => void;
}

type SortDirection = 'asc' | 'desc' | null;
interface SortConfig {
  key: keyof PropertyData | 'actions' | null; // Include 'actions' for the action column key
  direction: SortDirection;
}

// Define column configuration type
interface ColumnConfig {
    key: keyof PropertyData | 'actions'; // Include 'actions'
    header: string;
    sortable?: boolean;
    numeric?: boolean;
    format?: (value: any) => string; // Allow any type for formatter input
}

// Helper to format currency
const formatCurrency = (value: number | null): string => {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('fr-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 0 });
};

// Helper to format percentage
const formatPercentage = (value: number | null, decimals = 2): string => {
  if (value === null || value === undefined) return '-';
  const numValue = Number(value);
  if (isNaN(numValue)) return '-';
  const displayValue = numValue <= 1 && numValue >= 0 ? numValue * 100 : numValue;
  return `${displayValue.toFixed(decimals)}%`;
};

// Helper to format numbers like surface area
const formatNumber = (value: number | null): string => {
    if (value === null || value === undefined) return '-';
    return value.toLocaleString('fr-CH');
}

// Helper to parse yield string for sorting
const parseYieldForSort = (yieldStr: string | null): number => {
  if (!yieldStr) return -Infinity; // Treat null/empty as lowest value
  const cleanedStr = String(yieldStr).replace('%', '').trim();
  const value = parseFloat(cleanedStr);
  return isNaN(value) ? -Infinity : value;
};

// Define all possible columns
const ALL_COLUMNS: ColumnConfig[] = [
    { key: 'id', header: 'ID', sortable: true },
    { key: 'commune', header: 'Commune', sortable: true },
    { key: 'adresse', header: 'Adresse', sortable: true },
    { key: 'type', header: 'Type', sortable: true },
    { key: 'anneconstr', header: 'Année constr.', sortable: true, numeric: true },
    { key: 'valeurcbrechf', header: 'Valeur CBRE (CHF)', sortable: true, format: formatCurrency, numeric: true },
    { key: 'surfacelocm', header: 'Surface loc. (m²)', sortable: true, format: formatNumber, numeric: true },
    { key: 'loyeractuelchfancbre', header: 'Loyer actuel (CHF/an)', sortable: true, format: formatCurrency, numeric: true },
    { key: 'rendbrut', header: 'Rend. brut', sortable: true, numeric: true }, // Sort based on parsed numeric value
    { key: 'vacance', header: 'Vacance (%)', sortable: true, format: formatPercentage, numeric: true },
    { key: 'prixacquisitionchf', header: 'Prix Acq. (CHF)', sortable: true, format: formatCurrency, numeric: true },
    { key: 'financementchf', header: 'Financement (CHF)', sortable: true, format: formatCurrency, numeric: true },
    { key: 'financement', header: 'Financement %', sortable: true, format: formatPercentage, numeric: true },
    { key: 'rendnet', header: 'Rend. net', sortable: true }, // Assuming string for now
    // Add other columns from PropertyData if needed
];

// Define the specific type for column keys including 'actions'
type ColumnKey = keyof PropertyData | 'actions';

const PropertyTable: React.FC<PropertyTableProps> = ({ properties, selectedProperties, onSelectionChange }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'asc' });
  // State for visible columns - default to showing first 10 columns
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
      new Set([...ALL_COLUMNS.slice(0, 10).map(col => col.key), 'actions']) // Include 'actions' by default
  );

  const columns = useMemo(() => {
      // Ensure 'actions' column is always last if visible
      const dataCols = ALL_COLUMNS.filter(col => visibleColumns.has(col.key));
      const actionsCol: ColumnConfig = { key: 'actions', header: 'Actions' };
      // Explicitly type the result
      const currentCols: ColumnConfig[] = visibleColumns.has('actions') ? [...dataCols, actionsCol] : dataCols;
      return currentCols;
  }, [visibleColumns]);

  const sortedProperties = useMemo(() => {
    let sortableItems = [...properties];
    if (sortConfig.key !== null && sortConfig.key !== 'actions') {
      sortableItems.sort((a, b) => {
        // Assert sortConfig.key is keyof PropertyData here as 'actions' is excluded
        const key = sortConfig.key as keyof PropertyData;
        const aValue = a[key];
        const bValue = b[key];
        let comparison = 0;

        if (key === 'rendbrut') {
            const aNum = parseYieldForSort(aValue as string | null);
            const bNum = parseYieldForSort(bValue as string | null);
            comparison = aNum - bNum;
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else {
          if (aValue === null || aValue === undefined) comparison = 1;
          else if (bValue === null || bValue === undefined) comparison = -1;
          else comparison = String(aValue).localeCompare(String(bValue));
        }
        return sortConfig.direction === 'desc' ? comparison * -1 : comparison;
      });
    }
    return sortableItems;
  }, [properties, sortConfig]);

  const requestSort = (key: ColumnKey) => {
    if (key === 'actions') return; // Don't sort by actions column
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
        direction = null;
        key = 'id';
        direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (columnKey: ColumnKey) => {
    if (sortConfig.key !== columnKey) return null;
    if (sortConfig.direction === 'asc') return ' ▲';
    if (sortConfig.direction === 'desc') return ' ▼';
    return null;
  };

  const handleColumnVisibilityChange = (columnKey: ColumnKey, checked: boolean | 'indeterminate') => {
    setVisibleColumns(prev => {
        const next = new Set(prev);
        if (checked) {
            next.add(columnKey);
        } else {
            next.delete(columnKey);
        }
        return next;
    });
  };

  // Handle master checkbox change
  const handleMasterCheckboxChange = (checked: boolean | 'indeterminate') => {
    sortedProperties.forEach(prop => {
        onSelectionChange(prop.id, !!checked);
    });
  };

  // Determine master checkbox state
  const isAllVisibleSelected = useMemo(() => {
      return sortedProperties.length > 0 && sortedProperties.every(prop => selectedProperties.has(prop.id));
  }, [sortedProperties, selectedProperties]);
  const isSomeVisibleSelected = useMemo(() => {
      return sortedProperties.some(prop => selectedProperties.has(prop.id));
  }, [sortedProperties, selectedProperties]);
  const masterCheckboxState = isAllVisibleSelected ? true : (isSomeVisibleSelected ? 'indeterminate' : false);


  return (
    <div>
        {/* Column Visibility Toggle Dropdown */}
        <div className="mb-4 flex justify-end">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto bg-white border-be_capital_grey text-be_capital_dark_grey hover:bg-gray-50">
                        Columns
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {[...ALL_COLUMNS, { key: 'actions', header: 'Actions' }].map((column) => (
                        <DropdownMenuCheckboxItem
                            key={column.key}
                            className="capitalize"
                            // Fix: Ensure column.key is treated as ColumnKey
                            checked={visibleColumns.has(column.key as ColumnKey)}
                            onCheckedChange={(checked) => handleColumnVisibilityChange(column.key as ColumnKey, checked)}
                        >
                            {column.header}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-be_capital_light_grey bg-white">
            <thead className="bg-gray-50">
            <tr>
                {/* Selection Checkbox Header */}
                <th scope="col" className="px-4 py-3">
                    <Checkbox
                        checked={masterCheckboxState}
                        onCheckedChange={handleMasterCheckboxChange}
                        aria-label="Select all rows"
                    />
                </th>
                {/* Data Column Headers */}
                {columns.map((col) => (
                <th
                    key={col.key}
                    scope="col"
                    className={`px-4 py-3 text-left text-xs font-medium text-be_capital_dark_grey uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                    onClick={() => col.sortable && requestSort(col.key)}
                >
                    {col.header}
                    {col.sortable && getSortIndicator(col.key)}
                </th>
                ))}
            </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {sortedProperties.map((prop) => (
                <tr key={prop.id} className={`hover:bg-gray-50 ${selectedProperties.has(prop.id) ? 'bg-yellow-50' : ''}`}>
                 {/* Selection Checkbox Cell */}
                 <td className="px-4 py-3">
                     <Checkbox
                        checked={selectedProperties.has(prop.id)}
                        onCheckedChange={(checked) => onSelectionChange(prop.id, !!checked)}
                        aria-label={`Select row ${prop.id}`}
                     />
                 </td>
                 {/* Data Column Cells */}
                {columns.map((col) => {
                    if (col.key === 'actions') {
                        return (
                            <td key={`${prop.id}-actions`} className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => generatePropertyPDF(prop)}
                                    title="Download PDF"
                                >
                                    <Download className="h-4 w-4 text-be_capital_grey hover:text-be_capital_dark_grey" />
                                </Button>
                            </td>
                        );
                    }
                    // Assert col.key is keyof PropertyData here
                    const dataKey = col.key as keyof PropertyData;
                    return (
                        <td
                        key={`${prop.id}-${dataKey}`}
                        className="px-4 py-3 whitespace-nowrap text-sm text-gray-700"
                        >
                        {col.format
                            ? col.format(prop[dataKey])
                            : prop[dataKey] !== null && prop[dataKey] !== undefined
                            ? String(prop[dataKey])
                            : '-'}
                        </td>
                    );
                })}
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    </div>
  );
};

export default PropertyTable;

