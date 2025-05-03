import jsPDF from 'jspdf';

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

// Helper to format currency for PDF
const formatCurrencyPDF = (value: number | null): string => {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('fr-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 0 });
};

// Helper to format percentage for PDF
const formatPercentagePDF = (value: number | null, decimals = 2): string => {
  if (value === null || value === undefined) return '-';
  const numValue = Number(value);
  if (isNaN(numValue)) return '-';
  const displayValue = numValue <= 1 && numValue >= 0 ? numValue * 100 : numValue;
  return `${displayValue.toFixed(decimals)}%`;
};

// Helper to format numbers like surface area for PDF
const formatNumberPDF = (value: number | null): string => {
    if (value === null || value === undefined) return '-';
    return value.toLocaleString('fr-CH');
}

export const generatePropertyPDF = (property: PropertyData) => {
  const doc = new jsPDF();
  const margin = 15;
  let yPos = margin;

  // Title
  doc.setFontSize(18);
  doc.text(`Property Details - ID: ${property.id}`, margin, yPos);
  yPos += 10;

  // Basic Info
  doc.setFontSize(12);
  doc.text(`Address: ${property.adresse || '-'}`, margin, yPos);
  yPos += 7;
  doc.text(`Commune: ${property.commune || '-'}`, margin, yPos);
  yPos += 7;
  doc.text(`Type: ${property.type || '-'}`, margin, yPos);
  yPos += 7;
  doc.text(`Construction Year: ${property.anneconstr || '-'}`, margin, yPos);
  yPos += 10;

  // Financial Info
  doc.setFontSize(14);
  doc.text('Financial Overview', margin, yPos);
  yPos += 8;
  doc.setFontSize(10);
  doc.text(`CBRE Value: ${formatCurrencyPDF(property.valeurcbrechf)}`, margin, yPos);
  yPos += 6;
  doc.text(`Acquisition Price: ${formatCurrencyPDF(property.prixacquisitionchf)}`, margin, yPos);
  yPos += 6;
  doc.text(`Current Rent (CBRE): ${formatCurrencyPDF(property.loyeractuelchfancbre)} / year`, margin, yPos);
  yPos += 6;
  doc.text(`Potential Rent (CBRE): ${formatCurrencyPDF(property.loyerpotentielchfancbre)} / year`, margin, yPos);
  yPos += 6;
  doc.text(`Gross Yield: ${property.rendbrut || '-'}`, margin, yPos);
  yPos += 6;
  doc.text(`Net Yield: ${property.rendnet || '-'}`, margin, yPos);
  yPos += 6;
  doc.text(`Vacancy: ${formatPercentagePDF(property.vacance)}`, margin, yPos);
  yPos += 10;

  // Physical Info
  doc.setFontSize(14);
  doc.text('Physical Details', margin, yPos);
  yPos += 8;
  doc.setFontSize(10);
  doc.text(`Surface Area: ${formatNumberPDF(property.surfacelocm)} m²`, margin, yPos);
  yPos += 6;
  doc.text(`Roof: ${property.toiture || '-'}`, margin, yPos);
  yPos += 6;
  doc.text(`Windows: ${property.fentres || '-'}`, margin, yPos);
  yPos += 6;
  doc.text(`Heating: ${property.chauffagetypeanne || '-'}`, margin, yPos);
  yPos += 6;
  doc.text(`Facade: ${property.faade || '-'}`, margin, yPos);
  yPos += 10;

  // Notes
  if (property.notes) {
      doc.setFontSize(12);
      doc.text('Notes:', margin, yPos);
      yPos += 6;
      doc.setFontSize(10);
      // Use splitTextToSize for potentially long notes
      const notesLines = doc.splitTextToSize(property.notes, doc.internal.pageSize.width - margin * 2);
      doc.text(notesLines, margin, yPos);
      yPos += notesLines.length * 4; // Adjust spacing based on number of lines
  }

  // Save the PDF
  doc.save(`property_${property.id}_${property.adresse?.replace(/\s+/g, '_')}.pdf`);
};

