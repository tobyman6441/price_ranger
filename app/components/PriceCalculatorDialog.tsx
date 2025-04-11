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
    otherCost: number;
    materialTax: number;
    laborTax: number;
    otherTax: number;
    totalTax: number;
    profitMargin: number;
    totalPrice: number;
  }) => void;
  currentPrice?: number;
  defaultProfitMargin?: number;
  initialMaterialCost?: number;
  initialLaborCost?: number;
  initialOtherCost?: number;
  initialMaterialTax?: number;
  initialLaborTax?: number;
  initialOtherTax?: number;
  hasInitialCosts?: boolean;
}

export function PriceCalculatorDialog({
  isOpen,
  onClose,
  onCalculate,
  currentPrice,
  defaultProfitMargin = 75,
  initialMaterialCost = 0,
  initialLaborCost = 0,
  initialOtherCost = 0,
  initialMaterialTax = 0,
  initialLaborTax = 0,
  initialOtherTax = 0,
  hasInitialCosts = false
}: PriceCalculatorDialogProps) {
  const [materialCost, setMaterialCost] = useState<string>(initialMaterialCost.toString());
  const [laborCost, setLaborCost] = useState<string>(initialLaborCost.toString());
  const [otherCost, setOtherCost] = useState<string>(initialOtherCost.toString());
  const [materialTax, setMaterialTax] = useState<string>(initialMaterialTax.toString());
  const [laborTax, setLaborTax] = useState<string>(initialLaborTax.toString());
  const [otherTax, setOtherTax] = useState<string>(initialOtherTax.toString());
  const [profitMargin, setProfitMargin] = useState<number>(defaultProfitMargin);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [totalTax, setTotalTax] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [isAutoCalculating, setIsAutoCalculating] = useState(hasInitialCosts);
  const [hasEnteredCosts, setHasEnteredCosts] = useState(hasInitialCosts);
  const [showMarginWarning, setShowMarginWarning] = useState(false);

  // Initialize values when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (currentPrice) {
        setTotalPrice(currentPrice);
      }
      
      // If we have initial costs, set up auto-calculation
      if (hasInitialCosts) {
        setIsAutoCalculating(true);
        setHasEnteredCosts(true);
        
        const material = parseFloat(materialCost) || 0;
        const labor = parseFloat(laborCost) || 0;
        const other = parseFloat(otherCost) || 0;
        const total = material + labor + other;
        
        if (total > 0 && currentPrice) {
          const margin = ((currentPrice - total) / currentPrice) * 100;
          setProfitMargin(Math.round(margin));
          setShowMarginWarning(margin < 30);
        }
      }
    }
  }, [isOpen, currentPrice, materialCost, laborCost, otherCost, hasInitialCosts]);

  // Calculate total cost and profit margin whenever costs or price changes
  useEffect(() => {
    const material = parseFloat(materialCost) || 0;
    const labor = parseFloat(laborCost) || 0;
    const other = parseFloat(otherCost) || 0;
    const materialTaxAmount = (material * (parseFloat(materialTax) || 0)) / 100;
    const laborTaxAmount = (labor * (parseFloat(laborTax) || 0)) / 100;
    const otherTaxAmount = (other * (parseFloat(otherTax) || 0)) / 100;
    
    const total = material + labor + other;
    const totalTaxAmount = materialTaxAmount + laborTaxAmount + otherTaxAmount;
    
    setTotalCost(total);
    setTotalTax(totalTaxAmount);
    
    // If we have both a total price and costs, calculate the actual margin
    if (totalPrice > 0 && total > 0) {
      const margin = ((totalPrice - total - totalTaxAmount) / totalPrice) * 100;
      if (!isAutoCalculating) {
        setProfitMargin(Math.round(margin));
        setShowMarginWarning(margin < 30);
      }
    }
  }, [materialCost, laborCost, otherCost, materialTax, laborTax, otherTax, totalPrice, isAutoCalculating]);

  // Calculate price when profit margin changes in auto-calculate mode
  useEffect(() => {
    if (isAutoCalculating && hasEnteredCosts) {
      const material = parseFloat(materialCost) || 0;
      const labor = parseFloat(laborCost) || 0;
      const other = parseFloat(otherCost) || 0;
      const materialTaxAmount = (material * (parseFloat(materialTax) || 0)) / 100;
      const laborTaxAmount = (labor * (parseFloat(laborTax) || 0)) / 100;
      const otherTaxAmount = (other * (parseFloat(otherTax) || 0)) / 100;
      
      const total = material + labor + other;
      const totalTaxAmount = materialTaxAmount + laborTaxAmount + otherTaxAmount;
      
      if (total > 0) {
        // Calculate price based on profit margin and tax
        const price = (total + totalTaxAmount) / (1 - (profitMargin / 100));
        setTotalPrice(price);
      }
    }
  }, [profitMargin, materialCost, laborCost, otherCost, materialTax, laborTax, otherTax, isAutoCalculating, hasEnteredCosts]);

  // Add new effect to handle initial price display
  useEffect(() => {
    if (isOpen && currentPrice) {
      setTotalPrice(currentPrice);
    }
  }, [isOpen, currentPrice]);

  const handleProfitMarginChange = (value: number[]) => {
    setIsAutoCalculating(true);
    setProfitMargin(value[0]);
    setShowMarginWarning(value[0] < 30);
  };

  const handleCostChange = (value: string, type: 'material' | 'labor' | 'other' | 'materialTax' | 'laborTax' | 'otherTax') => {
    if (type === 'material') {
      setMaterialCost(value);
    } else if (type === 'labor') {
      setLaborCost(value);
    } else if (type === 'other') {
      setOtherCost(value);
    } else if (type === 'materialTax') {
      setMaterialTax(value);
    } else if (type === 'laborTax') {
      setLaborTax(value);
    } else if (type === 'otherTax') {
      setOtherTax(value);
    }

    // Set hasEnteredCosts if either cost is entered
    const material = type === 'material' ? parseFloat(value) || 0 : parseFloat(materialCost) || 0;
    const labor = type === 'labor' ? parseFloat(value) || 0 : parseFloat(laborCost) || 0;
    const other = type === 'other' ? parseFloat(value) || 0 : parseFloat(otherCost) || 0;
    
    if (material > 0 || labor > 0 || other > 0) {
      setHasEnteredCosts(true);
      // If no price is set yet, start auto-calculating with default margin
      if (totalPrice === 0) {
        setIsAutoCalculating(true);
        setProfitMargin(75); // Use 75% as default only when first entering costs
      }
    }

    // Trigger price calculation immediately
    const total = material + labor + other;
    if (total > 0 && isAutoCalculating) {
      const materialTaxAmount = (material * (parseFloat(materialTax) || 0)) / 100;
      const laborTaxAmount = (labor * (parseFloat(laborTax) || 0)) / 100;
      const otherTaxAmount = (other * (parseFloat(otherTax) || 0)) / 100;
      const totalTaxAmount = materialTaxAmount + laborTaxAmount + otherTaxAmount;
      const price = (total + totalTaxAmount) / (1 - (profitMargin / 100));
      setTotalPrice(price);
    }
  };

  const handleCalculate = () => {
    const material = parseFloat(materialCost) || 0;
    const labor = parseFloat(laborCost) || 0;
    const other = parseFloat(otherCost) || 0;
    const materialTaxAmount = (material * (parseFloat(materialTax) || 0)) / 100;
    const laborTaxAmount = (labor * (parseFloat(laborTax) || 0)) / 100;
    const otherTaxAmount = (other * (parseFloat(otherTax) || 0)) / 100;
    const totalTaxAmount = materialTaxAmount + laborTaxAmount + otherTaxAmount;

    // Calculate final price
    const total = material + labor + other;
    const finalPrice = (total + totalTaxAmount) / (1 - (profitMargin / 100));
    setTotalPrice(finalPrice);

    onCalculate({
      materialCost: material,
      laborCost: labor,
      otherCost: other,
      materialTax: parseFloat(materialTax) || 0,
      laborTax: parseFloat(laborTax) || 0,
      otherTax: parseFloat(otherTax) || 0,
      totalTax: totalTaxAmount,
      profitMargin,
      totalPrice: finalPrice
    });

    // Keep dialog open briefly to show the updated price
    setTimeout(() => {
      onClose();
    }, 100);
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
            {/* Material Cost and Tax */}
            <div className="grid grid-cols-5 gap-4">
              <div className="space-y-2 col-span-3">
                <Label>Material Cost</Label>
                <Input
                  type="number"
                  value={materialCost}
                  onChange={(e) => handleCostChange(e.target.value, 'material')}
                  placeholder="Enter material cost"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Material Tax (%)</Label>
                <Input
                  type="number"
                  value={materialTax}
                  onChange={(e) => handleCostChange(e.target.value, 'materialTax')}
                  placeholder="Enter material tax"
                  className="bg-background/50"
                />
              </div>
            </div>

            {/* Labor Cost and Tax */}
            <div className="grid grid-cols-5 gap-4">
              <div className="space-y-2 col-span-3">
                <Label>Labor Cost</Label>
                <Input
                  type="number"
                  value={laborCost}
                  onChange={(e) => handleCostChange(e.target.value, 'labor')}
                  placeholder="Enter labor cost"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Labor Tax (%)</Label>
                <Input
                  type="number"
                  value={laborTax}
                  onChange={(e) => handleCostChange(e.target.value, 'laborTax')}
                  placeholder="Enter labor tax"
                  className="bg-background/50"
                />
              </div>
            </div>

            {/* Other Cost and Tax */}
            <div className="grid grid-cols-5 gap-4">
              <div className="space-y-2 col-span-3">
                <Label>Other Cost</Label>
                <Input
                  type="number"
                  value={otherCost}
                  onChange={(e) => handleCostChange(e.target.value, 'other')}
                  placeholder="Enter other cost"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Other Tax (%)</Label>
                <Input
                  type="number"
                  value={otherTax}
                  onChange={(e) => handleCostChange(e.target.value, 'otherTax')}
                  placeholder="Enter other tax"
                  className="bg-background/50"
                />
              </div>
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
                <span className="text-muted-foreground">Total Tax:</span>
                <span className="font-medium">{formatCurrency(totalTax)}</span>
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