"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { calculateMonthlyPayment } from "@/app/utils/calculations";
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { X, ThumbsUp, AlertTriangle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { FinanceOptionDialog } from './FinanceOptionDialog';
import { PriceCalculatorDialog } from './PriceCalculatorDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "./DatePicker";

interface Promotion {
  type: string;
  discount: string;
  validUntil: string;
  id: string;
}

interface FinancingOption {
  id: string;
  name: string;
  apr: number;
  termLength: number;
}

interface EstimateDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  onCalculate: () => void;
  optionDetails?: {
    title: string;
    description: string;
    price: number;
    priceRange?: { min: number; max: number };
    afterImage: string;
    hasCalculations: boolean;
    showAsLowAsPrice: boolean;
    isApproved?: boolean;
    promotion?: Promotion;
    financingOption?: FinancingOption;
    calculatedPriceDetails?: {
      materialCost: number;
      laborCost: number;
      otherCost: number;
      materialTax: number;
      laborTax: number;
      otherTax: number;
      totalTax: number;
      profitMargin: number;
      totalPrice: number;
    };
    options: Array<{
      id: number;
      content: string;
      isComplete: boolean;
      isApproved?: boolean;
      title?: string;
      description?: string;
      price?: number;
      finalPrice?: number;
      afterImage?: string;
      hasCalculations?: boolean;
      showAsLowAsPrice?: boolean;
      promotion?: Promotion;
      details?: {
        title: string;
        description: string;
        price: number;
        finalPrice?: number;
        afterImage: string;
        address?: string;
        priceRange?: {
          min: number;
          max: number;
        };
      };
    }>;
  };
  onSave: (details: EstimateDetails) => void;
}

interface EstimateDetails {
  title: string;
  description: string;
  price: number;
  priceRange?: { min: number; max: number };
  afterImage: string;
  hasCalculations: boolean;
  showAsLowAsPrice: boolean;
  isApproved?: boolean;
  promotion?: Promotion;
  financingOption?: FinancingOption;
  calculatedPriceDetails?: {
    materialCost: number;
    laborCost: number;
    otherCost: number;
    materialTax: number;
    laborTax: number;
    otherTax: number;
    totalTax: number;
    profitMargin: number;
    totalPrice: number;
  };
  options: Array<{
    id: number;
    content: string;
    isComplete: boolean;
    isApproved?: boolean;
    title?: string;
    description?: string;
    price?: number;
    finalPrice?: number;
    afterImage?: string;
    hasCalculations?: boolean;
    showAsLowAsPrice?: boolean;
    promotion?: Promotion;
    details?: {
      title: string;
      description: string;
      price: number;
      finalPrice?: number;
      afterImage: string;
      address?: string;
      priceRange?: {
        min: number;
        max: number;
      };
    };
  }>;
  _preventClose?: boolean;
}

export function EstimateDetails({ isOpen, onClose, onCalculate, optionDetails, onSave }: EstimateDetailsProps) {
  const [isCalculated, setIsCalculated] = useState(false);
  const [price, setPrice] = useState<number>(0);
  const [displayPrice, setDisplayPrice] = useState<string>('$0.00');
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editingPrice, setEditingPrice] = useState('');
  const [apr, setApr] = useState(6.99);
  const [termLength, setTermLength] = useState(60);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageSourceDialog, setShowImageSourceDialog] = useState(false);
  const [showAsLowAsPrice, setShowAsLowAsPrice] = useState(true);
  const [isApproved, setIsApproved] = useState(false);

  // Promotion states
  const [isPromotionEnabled, setIsPromotionEnabled] = useState(false);
  const [promotionName, setPromotionName] = useState<string>("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<string>("");
  const [savedPromotions, setSavedPromotions] = useState<Promotion[]>([]);
  const [activePromotion, setActivePromotion] = useState<Promotion | null>(null);
  const [validUntil, setValidUntil] = useState<Date>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [isCreatingPromotion, setIsCreatingPromotion] = useState(false);
  const [editingPromotionId, setEditingPromotionId] = useState<string | null>(null);
  const [showPromotionForm, setShowPromotionForm] = useState(false);
  const [showWarningMessage, setShowWarningMessage] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [adjustedProfitMargin, setAdjustedProfitMargin] = useState<number | null>(null);

  // Financing options states
  const [isFinancingLibraryOpen, setIsFinancingLibraryOpen] = useState(false);
  const [financingOptionName, setFinancingOptionName] = useState("");
  const [savedFinancingOptions, setSavedFinancingOptions] = useState<FinancingOption[]>([]);
  const [activeFinancingOption, setActiveFinancingOption] = useState<FinancingOption | null>(null);
  const [isCreatingFinancingOption, setIsCreatingFinancingOption] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showFinanceOptionDialog, setShowFinanceOptionDialog] = useState(false);

  // Price calculator states
  const [showPriceCalculator, setShowPriceCalculator] = useState(false);
  const [calculatedPriceDetails, setCalculatedPriceDetails] = useState<{
    materialCost: number;
    laborCost: number;
    otherCost: number;
    materialTax: number;
    laborTax: number;
    otherTax: number;
    totalTax: number;
    profitMargin: number;
    totalPrice: number;
  } | null>(optionDetails?.calculatedPriceDetails || null);

  // Initialize hasEnteredCosts based on whether we have existing costs
  const hasInitialCosts = useMemo(() => {
    if (optionDetails?.calculatedPriceDetails) {
      const { materialCost, laborCost, otherCost } = optionDetails.calculatedPriceDetails;
      return materialCost > 0 || laborCost > 0 || otherCost > 0;
    }
    return false;
  }, [optionDetails?.calculatedPriceDetails]);

  // Update calculatedPriceDetails when optionDetails changes
  useEffect(() => {
    if (optionDetails?.calculatedPriceDetails) {
      setCalculatedPriceDetails(optionDetails.calculatedPriceDetails);
    }
  }, [optionDetails?.calculatedPriceDetails]);

  // Load saved financing options from localStorage on initial render
  useEffect(() => {
    const savedOptions = localStorage.getItem('financingOptions');
    if (savedOptions) {
      try {
        setSavedFinancingOptions(JSON.parse(savedOptions));
      } catch (error) {
        console.error('Failed to parse saved financing options:', error);
      }
    }
  }, []);

  // Update displayPrice whenever price changes
  useEffect(() => {
    setDisplayPrice(formatCurrency(price));
  }, [price]);

  // Format currency helper
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Initialize price from optionDetails
  useEffect(() => {
    if (optionDetails?.price) {
      setPrice(optionDetails.price);
    }
  }, [optionDetails?.price]);

  // Update price when calculatedPriceDetails changes
  useEffect(() => {
    if (calculatedPriceDetails?.totalPrice) {
      setPrice(calculatedPriceDetails.totalPrice);
    }
  }, [calculatedPriceDetails?.totalPrice]);

  const calculateDiscount = (price: number, promotion: Promotion) => {
    const discountAmount = parseFloat(promotion.discount.replace(/[^0-9.]/g, ''))
    const isPercentage = promotion.discount.includes('%')
    
    if (isPercentage) {
      return (price * discountAmount) / 100
    }
    return discountAmount
  };

  const finalPrice = activePromotion ? (price) - calculateDiscount(price, activePromotion) : price;
  const monthlyPayment = calculateMonthlyPayment(finalPrice, activeFinancingOption?.apr || apr, activeFinancingOption?.termLength || termLength);

  // Update local state when optionDetails changes
  useEffect(() => {
    if (!optionDetails) return;
    
    setTitle(optionDetails.title);
    setDescription(optionDetails.description);
    setIsApproved(optionDetails.isApproved || false);
    
    const fixedPrice = optionDetails.price || 0;
    setPrice(fixedPrice);
    setDisplayPrice(`$${fixedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    setEditingPrice(fixedPrice.toString());
    
    setImages(optionDetails.afterImage ? [optionDetails.afterImage] : []);
    setCurrentImageIndex(0);
    setIsCalculated(!!optionDetails.hasCalculations);
    setShowAsLowAsPrice(optionDetails.showAsLowAsPrice !== false);
    
    // Set active promotion if it exists
    if (optionDetails.promotion) {
      setIsPromotionEnabled(true);
      const promotion = {
        ...optionDetails.promotion,
        id: optionDetails.promotion.id || Date.now().toString()
      };
      setActivePromotion(promotion);
      setValidUntil(new Date(promotion.validUntil));
    }
    
    // Set active financing option if it exists
    if (optionDetails.financingOption) {
      setActiveFinancingOption(optionDetails.financingOption);
      setApr(optionDetails.financingOption.apr);
      setTermLength(optionDetails.financingOption.termLength);
    }

    // Set calculated price details if they exist
    if (optionDetails.calculatedPriceDetails) {
      setCalculatedPriceDetails({
        ...optionDetails.calculatedPriceDetails,
        otherCost: optionDetails.calculatedPriceDetails.otherCost || 0,
        materialTax: optionDetails.calculatedPriceDetails.materialTax || 0,
        laborTax: optionDetails.calculatedPriceDetails.laborTax || 0,
        otherTax: optionDetails.calculatedPriceDetails.otherTax || 0,
        totalTax: optionDetails.calculatedPriceDetails.totalTax || 0
      });
    }
  }, [optionDetails]);

  // Only handle dialog closing state
  useEffect(() => {
    if (!isOpen) {
      setIsEditingPrice(false);
    }
  }, [isOpen]);

  const handleCalculate = () => {
    setShowPriceCalculator(true);
  };

  const handlePriceCalculated = (calculatedPrice: {
    materialCost: number;
    laborCost: number;
    otherCost: number;
    materialTax: number;
    laborTax: number;
    otherTax: number;
    totalTax: number;
    profitMargin: number;
    totalPrice: number;
  }) => {
    setCalculatedPriceDetails(calculatedPrice);
    setPrice(calculatedPrice.totalPrice);
    setDisplayPrice(`$${calculatedPrice.totalPrice.toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`);
    setIsCalculated(true);
  };

  // Add this function to check if a promotion would violate the minimum profit margin
  const checkPromotionProfitMargin = (promotionDiscount: string) => {
    if (!calculatedPriceDetails) return true;

    const { materialCost, laborCost, otherCost, materialTax, laborTax, otherTax } = calculatedPriceDetails;
    const materialTaxAmount = (materialCost * materialTax) / 100;
    const laborTaxAmount = (laborCost * laborTax) / 100;
    const otherTaxAmount = (otherCost * otherTax) / 100;
    const totalCost = materialCost + laborCost + otherCost;
    const totalTaxAmount = materialTaxAmount + laborTaxAmount + otherTaxAmount;
    
    // Calculate the discounted price
    const discountAmount = parseFloat(promotionDiscount.replace(/[^0-9.]/g, ''));
    const isPercentage = promotionDiscount.includes('%');
    const currentPrice = price;
    
    let discountedPrice = currentPrice;
    if (isPercentage) {
      discountedPrice = currentPrice * (1 - discountAmount / 100);
    } else {
      discountedPrice = currentPrice - discountAmount;
    }
    
    // Calculate the new profit margin with the discount
    const newProfitMargin = ((discountedPrice - totalCost - totalTaxAmount) / discountedPrice) * 100;
    
    // Return true if the new profit margin is above the minimum (30%)
    return newProfitMargin >= 30;
  };

  // Add this function to calculate the floor price
  const calculateFloorPrice = () => {
    if (!calculatedPriceDetails) return null;
    const { materialCost, laborCost } = calculatedPriceDetails;
    const totalCost = materialCost + laborCost;
    // Calculate minimum price that maintains 30% profit margin
    // If cost is 70% of price, then price = cost / 0.7
    return totalCost / 0.7;
  };

  // Add this function to calculate adjusted profit margin
  const calculateAdjustedProfitMargin = (promoDiscount: string) => {
    if (!calculatedPriceDetails) return null;
    
    const { materialCost, laborCost } = calculatedPriceDetails;
    const totalCost = materialCost + laborCost;
    
    let discountedPrice = price;
    if (promoDiscount.includes('%')) {
      const percentage = parseFloat(promoDiscount.replace('%', ''));
      discountedPrice = price * (1 - percentage / 100);
    } else {
      const fixedAmount = parseFloat(promoDiscount.replace('$', ''));
      discountedPrice = price - fixedAmount;
    }
    
    return ((discountedPrice - totalCost) / discountedPrice) * 100;
  };

  // Modify handleSavePromotion to calculate adjusted margin
  const handleSavePromotion = () => {
    if (!promotionName || !discountValue) return;

    // Check if the promotion would violate minimum profit margin
    const promotionDiscount = discountType === "percentage" ? `${discountValue}%` : `$${discountValue}`;
    if (!checkPromotionProfitMargin(promotionDiscount)) {
      const floorPrice = calculateFloorPrice();
      setWarningMessage(
        `Cannot apply promotion: Would result in profit margin below 30% (Floor price: $${floorPrice?.toLocaleString('en-US', { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2 
        })})`
      );
      setShowWarningMessage(true);
      return;
    }

    // Calculate and set the adjusted profit margin
    const adjustedMargin = calculateAdjustedProfitMargin(promotionDiscount);
    setAdjustedProfitMargin(adjustedMargin);

    const newPromotion: Promotion = {
      type: promotionName,
      discount: promotionDiscount,
      validUntil: validUntil.toISOString(),
      id: editingPromotionId || Date.now().toString()
    };

    if (editingPromotionId) {
      setSavedPromotions(savedPromotions.map(p => 
        p.id === editingPromotionId ? newPromotion : p
      ));
      setEditingPromotionId(null);
    } else {
      setSavedPromotions([...savedPromotions, newPromotion]);
    }
    
    setActivePromotion(newPromotion);
    setPromotionName("");
    setDiscountValue("");
    setIsCreatingPromotion(false);
    
    // Apply the promotion to the options and save changes
    if (optionDetails) {
      // Calculate and save final prices for each option
      const updatedOptions = optionDetails.options?.map(option => {
        const originalPrice = option.price || option.details?.price;
        if (originalPrice) {
          const discountValue = parseFloat(newPromotion.discount.replace(/[^0-9.]/g, ''));
          const isPercentage = newPromotion.discount.includes('%');
          const finalPrice = isPercentage 
            ? originalPrice * (1 - discountValue / 100)
            : originalPrice - discountValue;

          return {
            ...option,
            finalPrice,
            details: option.details 
              ? { ...option.details, finalPrice }
              : option.details
          };
        }
        return option;
      }) || [];

      // Create updated details and save without closing
      onSave({
        ...optionDetails,
        promotion: newPromotion,
        options: updatedOptions,
        _preventClose: true
      });
    }
  };

  const handleImageSourceSelect = (source: string) => {
    if (source === "upload") {
      // Handle file upload
    } else if (source === "design") {
      // Open design ideas link in new tab
      window.open('https://hover.to/wr/properties/design', '_blank');
      
      // Add design idea images to carousel
      const designImages = [
        "/design-idea1.jpg",
        "/design-idea2.jpg",
        "/design-idea3.jpg",
        "/design-idea4.jpg"
      ];
      
      // Keep existing images if any, and add design ideas
      setImages(prevImages => {
        const uniqueImages = new Set([...prevImages, ...designImages]);
        return Array.from(uniqueImages);
      });
      
      setShowImageSourceDialog(false);
    } else {
      // Show job selector
      setShowImageSourceDialog(false);
    }
  };

  const handleSave = () => {
    const details: EstimateDetails = {
      title,
      description,
      price,
      afterImage: images[0] || '',
      hasCalculations: isCalculated,
      showAsLowAsPrice,
      isApproved,
      promotion: isPromotionEnabled ? activePromotion || undefined : undefined,
      financingOption: activeFinancingOption || undefined,
      options: optionDetails?.options || [],
      calculatedPriceDetails: calculatedPriceDetails ? {
        ...calculatedPriceDetails,
        otherCost: calculatedPriceDetails.otherCost || 0,
        materialTax: calculatedPriceDetails.materialTax || 0,
        laborTax: calculatedPriceDetails.laborTax || 0,
        otherTax: calculatedPriceDetails.otherTax || 0,
        totalTax: calculatedPriceDetails.totalTax || 0
      } : undefined,
      _preventClose: false
    };
    
    onSave(details);
    // Only close if explicitly saving (not when applying a promotion)
    if (!details._preventClose) {
      onClose();
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // If the value starts with $, remove it
    const rawValue = value.startsWith('$') ? value.slice(1) : value;
    
    // Allow any numeric input including decimals
    setEditingPrice(rawValue);
    
    // Try to parse the number, removing any commas
    const numericValue = parseFloat(rawValue.replace(/,/g, ''));
    if (!isNaN(numericValue)) {
      setPrice(numericValue);
      setDisplayPrice(`$${numericValue.toLocaleString('en-US', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      })}`);

      // If we have calculated price details, update the profit margin
      if (calculatedPriceDetails) {
        const { materialCost, laborCost, otherCost, materialTax, laborTax, otherTax } = calculatedPriceDetails;
        const materialTaxAmount = (materialCost * materialTax) / 100;
        const laborTaxAmount = (laborCost * laborTax) / 100;
        const otherTaxAmount = (otherCost * otherTax) / 100;
        const totalCost = materialCost + laborCost + otherCost;
        const totalTaxAmount = materialTaxAmount + laborTaxAmount + otherTaxAmount;
        
        if (totalCost > 0) {
          const newProfitMargin = ((numericValue - totalCost - totalTaxAmount) / numericValue) * 100;
          setCalculatedPriceDetails({
            ...calculatedPriceDetails,
            profitMargin: Math.round(newProfitMargin),
            totalPrice: numericValue
          });
        }
      }
    }
  };

  const handlePriceBlur = () => {
    setIsEditingPrice(false);
    // Format the price for display
    const formattedValue = `$${price.toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
    setDisplayPrice(formattedValue);
  };

  const handlePriceFocus = () => {
    setIsEditingPrice(true);
    // Show the raw number for editing, without commas
    setEditingPrice(price.toString());
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setPromotionName(promotion.type);
    setDiscountType(promotion.discount.includes('%') ? "percentage" : "fixed");
    setDiscountValue(promotion.discount.replace(/[^0-9.]/g, ''));
    setValidUntil(new Date(promotion.validUntil));
    setEditingPromotionId(promotion.id);
    setIsCreatingPromotion(true);
    setActivePromotion(null);
  };

  const handleDeletePromotion = (id: string) => {
    // Remove the promotion
    setSavedPromotions(savedPromotions.filter(p => p.id !== id));
    
    // If this was the active promotion, clear it
    if (activePromotion?.id === id) {
      setActivePromotion(null);
    }
    
    // If we were editing this promotion, cancel the edit
    if (editingPromotionId === id) {
      setEditingPromotionId(null);
      setIsCreatingPromotion(false);
      setPromotionName("");
      setDiscountValue("");
    }
  };

  const handleApplyPromotion = (promotion: Promotion) => {
    // Set the active promotion and update UI state
    setActivePromotion(promotion);
    setIsCreatingPromotion(false);
    setIsPromotionEnabled(true);

    if (!optionDetails) return;

    // Calculate and save final prices for each option
    const updatedOptions = optionDetails.options?.map(option => {
      const originalPrice = option.price || option.details?.price;
      if (originalPrice) {
        const discountValue = parseFloat(promotion.discount.replace(/[^0-9.]/g, ''));
        const isPercentage = promotion.discount.includes('%');
        const finalPrice = isPercentage 
          ? originalPrice * (1 - discountValue / 100)
          : originalPrice - discountValue;

        return {
          ...option,
          finalPrice,
          details: option.details 
            ? { ...option.details, finalPrice }
            : option.details
        };
      }
      return option;
    }) || [];

    // Create the updated details object
    const updatedDetails: EstimateDetails = {
      title,
      description,
      price,
      afterImage: images[0] || '',
      hasCalculations: isCalculated,
      showAsLowAsPrice,
      isApproved,
      promotion,
      financingOption: activeFinancingOption || undefined,
      options: updatedOptions,
      calculatedPriceDetails: calculatedPriceDetails || undefined,
      _preventClose: true
    };
    
    // Save the changes but don't close the estimate details screen
    onSave(updatedDetails);
  };

  const handleRemovePromotion = () => {
    setActivePromotion(null);
    
    if (!optionDetails) return;

    // Clear final prices when removing promotion
    const updatedOptions = optionDetails.options?.map(option => ({
      ...option,
      finalPrice: undefined,
      details: option.details 
        ? { ...option.details, finalPrice: undefined }
        : option.details
    })) || [];

    // Update the option details without promotion and final prices
    onSave({
      ...optionDetails,
      options: updatedOptions,
      promotion: undefined,
      _preventClose: true
    });
  };

  const startCreatingPromotion = () => {
    setActivePromotion(null);
    setIsCreatingPromotion(true);
  };

  const handleSaveFinancingOption = () => {
    if (!financingOptionName) return;

    const newOption: FinancingOption = {
      id: Date.now().toString(),
      name: financingOptionName,
      apr,
      termLength,
    };

    const updatedOptions = [...savedFinancingOptions, newOption];
    setSavedFinancingOptions(updatedOptions);
    // Save to localStorage
    localStorage.setItem('financingOptions', JSON.stringify(updatedOptions));
    setFinancingOptionName("");
    setIsCreatingFinancingOption(false);
    
    // Show success message
    setSuccessMessage(`"${newOption.name}" added to financing options library`);
    setShowSuccessMessage(true);
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  const handleApplyFinancingOption = (option: FinancingOption) => {
    setActiveFinancingOption(option);
    setApr(option.apr);
    setTermLength(option.termLength);
    setIsFinancingLibraryOpen(false);
  };

  const handleRemoveFinancingOption = () => {
    setActiveFinancingOption(null);
  };

  const startCreatingFinancingOption = () => {
    setIsCreatingFinancingOption(true);
    setIsFinancingLibraryOpen(false);
  };

  const handleDeleteFinancingOption = (id: string) => {
    // Find the option that's being deleted to show its name in the message
    const optionToDelete = savedFinancingOptions.find(option => option.id === id);
    
    // Remove the option from the saved options
    const updatedOptions = savedFinancingOptions.filter(option => option.id !== id);
    setSavedFinancingOptions(updatedOptions);
    
    // Update localStorage
    localStorage.setItem('financingOptions', JSON.stringify(updatedOptions));
    
    // If this was the active option, clear it
    if (activeFinancingOption?.id === id) {
      setActiveFinancingOption(null);
    }
    
    // Show success message
    if (optionToDelete) {
      setSuccessMessage(`"${optionToDelete.name}" removed from financing options library`);
      setShowSuccessMessage(true);
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    }
  };

  // Add an edit function for the dialog screen seen in the screenshot
  const handleSaveFinancingOptionFromDialog = () => {
    setIsCreatingFinancingOption(true);
  };

  const handleSaveFinanceOptionsDialog = (details: any) => {
    if (details.financingOption) {
      setApr(details.financingOption.apr);
      setTermLength(details.financingOption.termLength);
      
      // If this is a saved financing option with a name, we should set it as the active option
      if (details.financingOption.name) {
        const option = {
          id: details.financingOption.id || Date.now().toString(),
          name: details.financingOption.name,
          apr: details.financingOption.apr,
          termLength: details.financingOption.termLength
        };
        setActiveFinancingOption(option);
      } else {
        // If it's just APR and term length changes without saving as a template
        setActiveFinancingOption(null);
      }
    }
    
    setShowAsLowAsPrice(details.showAsLowAsPrice);
    setShowFinanceOptionDialog(false);
  };

  // Add this function to validate discount in real-time
  const validateDiscount = (value: string): string | null => {
    if (!value || !calculatedPriceDetails) return null;
    
    const promotionDiscount = discountType === "percentage" ? `${value}%` : `$${value}`;
    if (!checkPromotionProfitMargin(promotionDiscount)) {
      const floorPrice = calculateFloorPrice();
      if (discountType === "percentage") {
        const maxPercentage = ((price - (floorPrice || 0)) / price) * 100;
        return `Maximum allowed: ${maxPercentage.toFixed(1)}%`;
      } else {
        const maxDiscount = price - (floorPrice || 0);
        return `Maximum allowed: $${maxDiscount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
      }
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // If dialog is closing (open becoming false), call onClose
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800">
        <DialogTitle className="flex justify-between items-center border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-4">
            <span>Estimate Details</span>
            {optionDetails && (
              <Button
                variant={isApproved ? "secondary" : "outline"}
                onClick={() => setIsApproved(!isApproved)}
                className={cn(
                  "gap-2",
                  isApproved && "bg-green-100 hover:bg-green-200 text-green-700"
                )}
              >
                {isApproved ? "Approved" : "Mark as Approved"}
              </Button>
            )}
          </div>
        </DialogTitle>
        
        <div className="flex flex-col h-full space-y-6 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-6">
              {/* Image Section */}
              <div className="space-y-4">
                <div className="relative bg-zinc-800/50 rounded-lg p-1">
                  {images.length > 0 ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden">
                      <Image
                        src={images[currentImageIndex]}
                        alt="Project image"
                        fill
                        className="object-cover"
                      />
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={handlePrevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                          >
                            ←
                          </button>
                          <button
                            onClick={handleNextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                          >
                            →
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setShowImageSourceDialog(true)}
                        className="absolute bottom-2 right-2 px-3 py-1.5 rounded-full text-xs font-medium bg-black/50 text-white hover:bg-black/60 transition-colors flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add images
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => setShowImageSourceDialog(true)}
                      className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-border/80 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <div className="text-sm font-medium text-foreground">Add images</div>
                        <div className="text-sm text-muted-foreground">Click to select image source</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Section */}
              <div className="space-y-4">
                <div className="flex flex-col gap-6">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground/80">Total Price</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="text"
                        value={isEditingPrice ? editingPrice : displayPrice}
                        onChange={handlePriceChange}
                        onFocus={handlePriceFocus}
                        onBlur={handlePriceBlur}
                        placeholder="0.00"
                        className="text-2xl font-bold text-muted-foreground/90 bg-background/50 flex-1"
                      />
                      <Button
                        onClick={handleCalculate}
                        className="bg-primary/80 text-primary-foreground/90 hover:bg-primary/70 whitespace-nowrap text-sm font-medium"
                      >
                        Calculate price
                      </Button>
                    </div>
                  </div>
                  
                  {/* Promotion Toggle */}
                  <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={isPromotionEnabled}
                        onCheckedChange={(checked) => {
                          setIsPromotionEnabled(checked);
                          if (!checked && activePromotion) {
                            handleRemovePromotion();
                          }
                        }}
                      />
                      <Label className="text-sm font-medium text-muted-foreground/90">Apply Promotion</Label>
                    </div>
                    {isPromotionEnabled && activePromotion && (
                      <div className="text-sm text-muted-foreground/70">
                        ${(price - calculateDiscount(price, activePromotion)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>

                  {/* Warning notification */}
                  {showWarningMessage && (
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>{warningMessage}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowWarningMessage(false)}
                          className="ml-4 hover:bg-yellow-200"
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Promotion Form */}
                  {isPromotionEnabled && (
                    <div className="space-y-4 border border-zinc-800 rounded-lg p-4 bg-zinc-800/30">
                      {activePromotion ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">Active Promotion</h3>
                              <Button variant="ghost" size="sm" onClick={handleRemovePromotion}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium">{activePromotion.type}</p>
                              <p className="text-sm text-muted-foreground">
                                {activePromotion.discount.includes('%') ? 
                                  `${parseFloat(activePromotion.discount.replace(/[^0-9.]/g, ''))}% off` : 
                                  `$${parseFloat(activePromotion.discount.replace(/[^0-9.]/g, '')).toLocaleString('en-US')} off`
                                }
                              </p>
                              <p className="text-sm font-medium text-green-600">
                                Savings: ${calculateDiscount(price, activePromotion).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              <p className="text-lg font-bold">
                                Final Price: ${(price - calculateDiscount(price, activePromotion)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              {adjustedProfitMargin !== null && (
                                <p className={cn(
                                  "text-sm",
                                  adjustedProfitMargin < 30 ? "text-red-500" : "text-green-500"
                                )}>
                                  Adjusted Profit Margin: {adjustedProfitMargin.toFixed(1)}%
                                </p>
                              )}
                              <p className="text-xs text-gray-500">
                                Valid until {new Date(activePromotion.validUntil).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              className="flex-1"
                              onClick={startCreatingPromotion}
                            >
                              Create New Promotion
                            </Button>
                          </div>
                        </div>
                      ) : isCreatingPromotion ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{editingPromotionId ? 'Edit Promotion' : 'Create New Promotion'}</h3>
                            {savedPromotions.length > 0 && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  setIsCreatingPromotion(false);
                                  setEditingPromotionId(null);
                                  setPromotionName("");
                                  setDiscountValue("");
                                }}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="promotionName">Promotion Name</Label>
                            <Input
                              id="promotionName"
                              value={promotionName}
                              onChange={(e) => setPromotionName(e.target.value)}
                              placeholder="Enter promotion name"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Discount Type</Label>
                            <RadioGroup
                              value={discountType}
                              onValueChange={(value: "percentage" | "fixed") => setDiscountType(value)}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="percentage" id="percentage" />
                                <Label htmlFor="percentage">Percentage (%)</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="fixed" id="fixed" />
                                <Label htmlFor="fixed">Fixed Amount ($)</Label>
                              </div>
                            </RadioGroup>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="discountValue">
                                {discountType === "percentage" ? "Discount Percentage" : "Discount Amount"}
                              </Label>
                              {discountValue && validateDiscount(discountValue) && (
                                <span className="text-sm text-red-500">
                                  {validateDiscount(discountValue)}
                                </span>
                              )}
                            </div>
                            <Input
                              id="discountValue"
                              type="number"
                              value={discountValue}
                              onChange={(e) => setDiscountValue(e.target.value)}
                              placeholder={discountType === "percentage" ? "Enter percentage" : "Enter amount"}
                              className={cn(
                                discountValue && validateDiscount(discountValue) && "border-red-500 focus-visible:ring-red-500"
                              )}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Valid Until</Label>
                            <DatePicker
                              date={validUntil}
                              onDateChange={(date) => {
                                if (date) {
                                  setValidUntil(date);
                                }
                              }}
                            />
                          </div>

                          <div className="flex space-x-2">
                            <Button 
                              onClick={handleSavePromotion} 
                              className="flex-1"
                              disabled={!promotionName || !discountValue}
                            >
                              {editingPromotionId ? 'Update & Apply' : 'Save & Apply'}
                            </Button>
                            {savedPromotions.length > 0 && (
                              <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => {
                                  setIsCreatingPromotion(false);
                                  setEditingPromotionId(null);
                                  setPromotionName("");
                                  setDiscountValue("");
                                }}
                              >
                                Choose from Library
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {savedPromotions.length > 0 ? (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <h3 className="font-medium">Promotion Library</h3>
                                <div className="space-y-2 max-h-60 overflow-auto">
                                  {savedPromotions.map((promotion) => (
                                    <div
                                      key={promotion.id}
                                      className="flex justify-between items-center p-2 border border-zinc-700 rounded-lg bg-zinc-900 hover:bg-zinc-700/50 transition-colors"
                                    >
                                      <div>
                                        <p className="font-medium text-gray-200">{promotion.type}</p>
                                        <p className="text-sm text-gray-400">
                                          {promotion.discount} off · Valid until {new Date(promotion.validUntil).toLocaleDateString()}
                                        </p>
                                        <p className="text-sm text-gray-400">
                                          Savings: ${calculateDiscount(price, promotion).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditPromotion(promotion)}
                                          className="text-gray-400 hover:text-gray-200"
                                        >
                                          Edit
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeletePromotion(promotion.id)}
                                          className="text-gray-400 hover:text-gray-200"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleApplyPromotion(promotion)}
                                          className="text-gray-200 hover:text-white border-zinc-700 hover:border-zinc-600"
                                        >
                                          Apply
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="flex justify-center">
                                <Button 
                                  variant="outline"
                                  onClick={startCreatingPromotion}
                                >
                                  Create New Promotion
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="text-center p-4">
                                <h3 className="font-medium mb-2">No Saved Promotions</h3>
                                <p className="text-sm text-muted-foreground mb-4">Create your first promotion to apply to this estimate</p>
                                <Button onClick={startCreatingPromotion}>
                                  Create New Promotion
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* As Low As Price Toggle */}
                  <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={showAsLowAsPrice}
                        onCheckedChange={setShowAsLowAsPrice}
                      />
                      <Label className="text-sm font-medium text-muted-foreground/90">Apply Financing</Label>
                    </div>
                    
                    {showAsLowAsPrice && (
                      <div 
                        className="text-sm text-muted-foreground/70 cursor-pointer hover:text-muted-foreground transition-colors"
                        onClick={() => setShowFinanceOptionDialog(true)}
                        key={`monthly-payment-${apr}-${termLength}`}
                      >
                        As low as ${monthlyPayment.toLocaleString('en-US', { maximumFractionDigits: 0 })}/month
                      </div>
                    )}
                  </div>

                  {showAsLowAsPrice && isFinancingLibraryOpen && (
                    <div className="p-4 bg-zinc-800/50 rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Financing Options Library</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsFinancingLibraryOpen(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {savedFinancingOptions.length > 0 ? (
                        <div className="space-y-2">
                          {savedFinancingOptions.map((option) => (
                            <div
                              key={option.id}
                              className="flex items-center justify-between p-2 border rounded bg-white"
                            >
                              <div>
                                <p className="font-medium">{option.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {option.apr}% APR for {option.termLength} months
                                </p>
                                <p className="text-sm text-gray-600">
                                  As low as ${calculateMonthlyPayment(finalPrice, option.apr, option.termLength).toLocaleString('en-US', { maximumFractionDigits: 0 })}/month
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteFinancingOption(option.id)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleApplyFinancingOption(option)}
                                >
                                  Apply
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No saved financing options yet.</p>
                      )}
                      
                      <Button 
                        onClick={startCreatingFinancingOption} 
                        variant="outline" 
                        className="w-full"
                      >
                        Create New Option
                      </Button>
                    </div>
                  )}

                  {showAsLowAsPrice && isCreatingFinancingOption && (
                    <div className="p-4 bg-zinc-800/50 rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Create Financing Option</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsCreatingFinancingOption(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="financingOptionName">Option Name</Label>
                          <Input
                            id="financingOptionName"
                            value={financingOptionName}
                            onChange={(e) => setFinancingOptionName(e.target.value)}
                            placeholder="Enter financing option name"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm">APR %</Label>
                          <Input
                            type="number"
                            value={apr}
                            onChange={(e) => {
                              const newApr = Number(e.target.value);
                              setApr(newApr);
                              // Monthly payment will be recalculated automatically as it depends on apr
                            }}
                            placeholder="APR %"
                            step="0.01"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm">Term Length (months)</Label>
                          <Input
                            type="number"
                            value={termLength}
                            onChange={(e) => {
                              const newTermLength = Number(e.target.value);
                              setTermLength(newTermLength);
                              // Monthly payment will be recalculated automatically as it depends on termLength
                            }}
                            placeholder="Term length"
                          />
                        </div>
                        
                        <Button onClick={handleSaveFinancingOption} className="w-full">
                          Save to Library
                        </Button>
                      </div>
                    </div>
                  )}

                  {showAsLowAsPrice && !isFinancingLibraryOpen && !isCreatingFinancingOption && (
                    <div className="flex gap-4 p-4 bg-zinc-800/50 rounded-lg">
                      {activeFinancingOption ? (
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-muted-foreground">Active Financing Option</h3>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={handleRemoveFinancingOption}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">{activeFinancingOption.name}</p>
                            <p className="text-sm text-muted-foreground/80">
                              {activeFinancingOption.apr}% APR for {activeFinancingOption.termLength} months
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 text-center">
                          <Button
                            variant="outline"
                            onClick={() => setShowFinanceOptionDialog(true)}
                            className="text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/50 border-border/50"
                          >
                            Configure Financing Options
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Header Section */}
              <div className="space-y-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Option name"
                  className="text-2xl font-bold text-muted-foreground/90 bg-background/50 border-border focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-0 px-3 py-2"
                />
              </div>

              {/* Description Section */}
              <div className="space-y-2">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Option description"
                  className="min-h-[100px] text-muted-foreground/80 bg-background/50 border-border focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-0 px-3 py-2 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex-shrink-0 pt-6">
            <Button
              onClick={handleSave}
              className="w-full bg-primary/80 text-primary-foreground/90 hover:bg-primary/70 font-medium"
            >
              Save
            </Button>
          </div>
        </div>

        {/* Image Source Dialog */}
        <Dialog open={showImageSourceDialog} onOpenChange={setShowImageSourceDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogTitle>Upload Images</DialogTitle>
            <div className="grid gap-4">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.tiff,.heif"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const imageUrls = files.map(file => URL.createObjectURL(file));
                  setImages(prev => [...prev, ...imageUrls]);
                  setShowImageSourceDialog(false);
                }}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-violet-50 file:text-violet-700
                  hover:file:bg-violet-100"
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Finance Option Dialog */}
        <FinanceOptionDialog
          isOpen={showFinanceOptionDialog}
          onClose={() => setShowFinanceOptionDialog(false)}
          onSave={handleSaveFinanceOptionsDialog}
          price={finalPrice}
          initialApr={apr}
          initialTermLength={termLength}
          activeTemplateId={activeFinancingOption?.id}
        />

        {/* Add the PriceCalculatorDialog */}
        <PriceCalculatorDialog
          isOpen={showPriceCalculator}
          onClose={() => setShowPriceCalculator(false)}
          onCalculate={(details) => {
            setCalculatedPriceDetails(details);
            setPrice(details.totalPrice);
            setShowPriceCalculator(false);
          }}
          currentPrice={price}
          defaultProfitMargin={calculatedPriceDetails?.profitMargin || 75}
          initialMaterialCost={calculatedPriceDetails?.materialCost || 0}
          initialLaborCost={calculatedPriceDetails?.laborCost || 0}
          initialOtherCost={calculatedPriceDetails?.otherCost || 0}
          initialMaterialTax={calculatedPriceDetails?.materialTax || 0}
          initialLaborTax={calculatedPriceDetails?.laborTax || 0}
          initialOtherTax={calculatedPriceDetails?.otherTax || 0}
          hasInitialCosts={hasInitialCosts}
        />
      </DialogContent>
    </Dialog>
  );
} 