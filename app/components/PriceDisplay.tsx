interface PriceDisplayProps {
  price: number;
  priceRange?: {
    min: number;
    max: number;
  };
  isPriceRange: boolean;
}

export const PriceDisplay = ({ price, priceRange, isPriceRange }: PriceDisplayProps) => {
  const hasValidPrice = isPriceRange 
    ? priceRange && priceRange.min > 0 && priceRange.max > 0
    : price > 0;

  if (!hasValidPrice) return null;

  if (isPriceRange && priceRange) {
    return (
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">As low as</span>
        <span className="text-lg font-semibold">${priceRange.min.toFixed(2)} - ${priceRange.max.toFixed(2)}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <span className="text-lg font-semibold">${price.toFixed(2)}</span>
    </div>
  );
}; 