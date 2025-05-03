import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  bgColor?: string; // Optional background color
  textColor?: string; // Optional text color
  borderColor?: string; // Optional border color
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = '',
  bgColor = 'bg-white',
  textColor = 'text-be_capital_gold',
  borderColor = 'border-be_capital_gold',
}) => {
  return (
    <div className={`${bgColor} rounded-lg shadow-md p-4 border-l-4 ${borderColor}`}>
      <h2 className="text-lg font-semibold text-be_capital_dark_grey mb-2 truncate" title={title}>{title}</h2>
      <p className={`text-2xl font-bold ${textColor}`}>
        {typeof value === 'number' ? value.toLocaleString('fr-CH') : value}
        {unit && <span className="text-lg font-normal ml-1">{unit}</span>}
      </p>
    </div>
  );
};

export default MetricCard;

