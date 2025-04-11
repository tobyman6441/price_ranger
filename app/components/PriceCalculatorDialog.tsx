import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface PriceCalculatorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCalculate: (calculatedPrice: {
    materialCost: number;
    laborCost: number;
    profitMargin: number;
    totalPrice: number;
  }) => void;
  currentPrice?: number;
  defaultProfitMargin?: number;
  initialMaterialCost?: number;
  initialLaborCost?: number;
}

export function PriceCalculatorDialog({
  isOpen,
  onClose,
  onCalculate,
  currentPrice,
  defaultProfitMargin = 75,
  initialMaterialCost = 0,
  initialLaborCost = 0
}: PriceCalculatorDialogProps) {
  const [materialCost, setMaterialCost] = useState<string>(initialMaterialCost.toString());
  const [laborCost, setLaborCost] = useState<string>(initialLaborCost.toString());
  const [profitMargin, setProfitMargin] = useState<number>(defaultProfitMargin);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [isAutoCalculating, setIsAutoCalculating] = useState(false);
  const [hasEnteredCosts, setHasEnteredCosts] = useState(false);
  const [showMarginWarning, setShowMarginWarning] = useState(false);

  // Initialize values when dialog opens
  useEffect(() => {
    if (isOpen && currentPrice) {
      setTotalPrice(currentPrice);
      // If we have costs, calculate the actual margin
      const material = parseFloat(materialCost) || 0;
      const labor = parseFloat(laborCost) || 0;
      const total = material + labor;
      
      if (total > 0) {
        const margin = ((currentPrice - total) / currentPrice) * 100;
        setProfitMargin(Math.round(margin));
        setShowMarginWarning(margin < 30);
      }
    }
  }, [isOpen, currentPrice, materialCost, laborCost]);

  // Calculate total cost and profit margin whenever costs or price changes
  useEffect(() => {
    const material = parseFloat(materialCost) || 0;
    const labor = parseFloat(laborCost) || 0;
    const total = material + labor;
    setTotalCost(total);
    
    // If we have both a total price and costs, calculate the actual margin
    if (totalPrice > 0 && total > 0) {
      const margin = ((totalPrice - total) / totalPrice) * 100;
      if (!isAutoCalculating) {
        setProfitMargin(Math.round(margin));
        setShowMarginWarning(margin < 30);
      }
    }
  }, [materialCost, laborCost, totalPrice, isAutoCalculating]);

  // Calculate price when profit margin changes in auto-calculate mode
  useEffect(() => {
    if (isAutoCalculating && hasEnteredCosts) {
      const material = parseFloat(materialCost) || 0;
      const labor = parseFloat(laborCost) || 0;
      const total = material + labor;
      
      if (total > 0) {
        // Calculate price based on profit margin
        const price = total / (1 - (profitMargin / 100));
        setTotalPrice(price);
      }
    }
  }, [profitMargin, materialCost, laborCost, isAutoCalculating, hasEnteredCosts]);

  const handleProfitMarginChange = (value: number[]) => {
    setIsAutoCalculating(true);
    setProfitMargin(value[0]);
    setShowMarginWarning(value[0] < 30);
  };

  const handleCostChange = (value: string, type: 'material' | 'labor') => {
    if (type === 'material') {
      setMaterialCost(value);
    } else {
      setLaborCost(value);
    }

    // Set hasEnteredCosts if either cost is entered
    const material = type === 'material' ? parseFloat(value) || 0 : parseFloat(materialCost) || 0;
    const labor = type === 'labor' ? parseFloat(value) || 0 : parseFloat(laborCost) || 0;
    
    if (material > 0 || labor > 0) {
      setHasEnteredCosts(true);
      // If no price is set yet, start auto-calculating with default margin
      if (totalPrice === 0) {
        setIsAutoCalculating(true);
        setProfitMargin(75); // Use 75% as default only when first entering costs
      }
    }
  };

  const handleCalculate = () => {
    onCalculate({
      materialCost: parseFloat(materialCost) || 0,
      laborCost: parseFloat(laborCost) || 0,
      profitMargin,
      totalPrice
    });
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800">
        <DialogTitle className="border-b border-zinc-800 pb-4">
          Calculate Price
        </DialogTitle>
        
        <div className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Material Cost</Label>
              <Input
                type="number"
                value={materialCost}
                onChange={(e) => handleCostChange(e.target.value, 'material')}
                placeholder="Enter material cost"
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label>Labor Cost</Label>
              <Input
                type="number"
                value={laborCost}
                onChange={(e) => handleCostChange(e.target.value, 'labor')}
                placeholder="Enter labor cost"
                className="bg-background/50"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Profit Margin</Label>
                <span className={cn(
                  "text-sm",
                  showMarginWarning ? "text-red-500" : "text-muted-foreground"
                )}>
                  {profitMargin}%
                </span>
              </div>
              <Slider
                value={[profitMargin]}
                onValueChange={handleProfitMarginChange}
                min={30}
                max={100}
                step={1}
                className={cn(
                  "w-full",
                  showMarginWarning && "[&>div]:bg-red-500"
                )}
              />
              {showMarginWarning && (
                <p className="text-sm text-red-500">
                  Warning: Profit margin is below minimum of 30%. Please adjust to maintain minimum margin.
                </p>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t border-zinc-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Cost:</span>
                <span className="font-medium">{formatCurrency(totalCost)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Price:</span>
                <span className="text-lg font-bold">{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleCalculate}>
              Apply Price
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 