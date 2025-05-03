import React from 'react';

interface FilterControlsProps {
  communes: string[];
  types: string[];
  onFilterChange: (filters: { commune: string; type: string; yearMin: string; yearMax: string; searchTerm: string }) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({ communes, types, onFilterChange }) => {
  const [communeFilter, setCommuneFilter] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('');
  const [yearMinFilter, setYearMinFilter] = React.useState('');
  const [yearMaxFilter, setYearMaxFilter] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');

  // Handle filter changes and call the callback
  const handleFilter = () => {
    onFilterChange({ 
        commune: communeFilter, 
        type: typeFilter, 
        yearMin: yearMinFilter, 
        yearMax: yearMaxFilter, 
        searchTerm: searchTerm 
    });
  };

  // Trigger filter on input change or button click
  React.useEffect(() => {
    // Debounce or trigger on button click might be better for performance
    const timer = setTimeout(() => {
        handleFilter();
    }, 300); // Simple debounce
    return () => clearTimeout(timer);
  }, [communeFilter, typeFilter, yearMinFilter, yearMaxFilter, searchTerm]);

  return (
    <section className="bg-white rounded-lg shadow-md p-4 mb-8">
      <h2 className="text-xl font-semibold text-be_capital_dark_grey mb-4">Filter & Search Properties</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Commune Filter */}
        <div>
          <label htmlFor="commune" className="block text-sm font-medium text-gray-700">Commune</label>
          <select
            id="commune"
            value={communeFilter}
            onChange={(e) => setCommuneFilter(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-be_capital_gold focus:border-be_capital_gold sm:text-sm rounded-md"
          >
            <option value="">All</option>
            {communes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
          <select
            id="type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-be_capital_gold focus:border-be_capital_gold sm:text-sm rounded-md"
          >
            <option value="">All</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Construction Year Min Filter */}
        <div>
          <label htmlFor="yearMin" className="block text-sm font-medium text-gray-700">Year Min</label>
          <input
            type="number"
            id="yearMin"
            value={yearMinFilter}
            onChange={(e) => setYearMinFilter(e.target.value)}
            placeholder="e.g., 1980"
            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-be_capital_gold focus:border-be_capital_gold"
          />
        </div>

        {/* Construction Year Max Filter */}
        <div>
          <label htmlFor="yearMax" className="block text-sm font-medium text-gray-700">Year Max</label>
          <input
            type="number"
            id="yearMax"
            value={yearMaxFilter}
            onChange={(e) => setYearMaxFilter(e.target.value)}
            placeholder="e.g., 2024"
            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-be_capital_gold focus:border-be_capital_gold"
          />
        </div>

        {/* Search Term Filter */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search Address</label>
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter address..."
            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-be_capital_gold focus:border-be_capital_gold"
          />
        </div>
      </div>
    </section>
  );
};

export default FilterControls;

