import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { calculateMonthlyPayment } from '@/app/utils/calculations'
import { Badge } from "@/components/ui/badge"
import { useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Promotion {
  type: string;
  discount: string;
  validUntil: string;
  id: string;
}

interface Option {
  id: string;
  content: string;
  price?: number;
  priceRange?: { min: number; max: number };
  details?: {
    title: string;
    description: string;
    price: number;
    priceRange?: { min: number; max: number };
    afterImage: string;
    hasCalculations?: boolean;
    isApproved?: boolean;
    showAsLowAsPrice?: boolean;
    promotion?: Promotion;
    financingOption?: {
      id: string;
      name: string;
      apr: number;
      termLength: number;
    };
  };
  isApproved?: boolean;
  showAsLowAsPrice?: boolean;
  promotion?: Promotion;
  financingOption?: {
    id: string;
    name: string;
    apr: number;
    termLength: number;
  };
}

interface Operator {
  id: number
  type: 'and' | 'or'
}

interface GroupTotal {
  options: Option[];
  total: number;
  priceRange: { min: number; max: number; } | undefined;
  monthlyPayment: number;
  allApproved: boolean;
}

interface PriceSummaryProps {
  options: Option[]
  operators: Operator[]
}

export function PriceSummary({ options, operators }: PriceSummaryProps) {
  const [editingPackage, setEditingPackage] = useState<number | null>(null)
  const [packageNames, setPackageNames] = useState<{ [key: number]: string }>({})

  // Ensure operators array is properly aligned with options
  const alignedOperators = operators.slice(0, Math.max(0, options.length - 1))

  // Group options by "And" relationships
  const andGroups: Option[][] = []
  let currentGroup: Option[] = []

  // Process options to create groups
  for (let i = 0; i < options.length; i++) {
    const option = options[i]
    
    if (currentGroup.length === 0) {
      currentGroup.push(option)
    } else {
      const operator = alignedOperators[i - 1]
      if (operator?.type === 'or') {
        andGroups.push([...currentGroup])
        currentGroup = [option]
      } else {
        currentGroup.push(option)
      }
    }
  }

  // Add the last group if it's not empty
  if (currentGroup.length > 0) {
    andGroups.push(currentGroup)
  }

  // Calculate total price for each "And" group
  const andGroupTotals = andGroups.map(group => {
    // Calculate total price and price range for the group
    const groupPriceInfo = group.reduce((acc, option) => {
      const price = option.price ?? option.details?.price ?? 0;
      const priceRange = option.priceRange ?? option.details?.priceRange;
      
      // Skip if no valid price or price range is set
      if (price === 0 && !priceRange) {
        return acc;
      }
      
      // Apply promotion discount if exists
      if (option.promotion) {
        const discountAmount = parseFloat(option.promotion.discount.replace(/[^0-9.]/g, ''));
        const isPercentage = option.promotion.discount.includes('%');
        
        if (priceRange) {
          // Apply discount to price range
          const minDiscount = isPercentage 
            ? priceRange.min * (discountAmount / 100)
            : discountAmount;
          const maxDiscount = isPercentage
            ? priceRange.max * (discountAmount / 100)
            : discountAmount;
            
          return {
            total: acc.total + (priceRange.min - minDiscount),
            priceRange: {
              min: (acc.priceRange?.min || 0) + (priceRange.min - minDiscount),
              max: (acc.priceRange?.max || 0) + (priceRange.max - maxDiscount)
            }
          };
        } else {
          // Apply discount to fixed price
          const discount = isPercentage
            ? price * (discountAmount / 100)
            : discountAmount;
          
          return {
            total: acc.total + (price - discount),
            priceRange: acc.priceRange
          };
        }
      }
      
      // No promotion case
      if (priceRange) {
        return {
          total: acc.total + priceRange.min,
          priceRange: {
            min: (acc.priceRange?.min || 0) + priceRange.min,
            max: (acc.priceRange?.max || 0) + priceRange.max
          }
        };
      }
      
      return {
        total: acc.total + price,
        priceRange: acc.priceRange
      };
    }, { total: 0, priceRange: undefined as { min: number; max: number; } | undefined });

    // Only include groups that have a valid total or price range
    if (groupPriceInfo.total > 0 || groupPriceInfo.priceRange) {
      // Find the first financing option in the group (if any exist)
      const firstFinancingOption = group.find(opt => opt.financingOption)?.financingOption;
      
      // Calculate the monthly payment using the financing option details if available
      const monthlyPayment = firstFinancingOption
        ? calculateMonthlyPayment(
            groupPriceInfo.priceRange?.min || groupPriceInfo.total,
            firstFinancingOption.apr,
            firstFinancingOption.termLength
          )
        : calculateMonthlyPayment(groupPriceInfo.priceRange?.min || groupPriceInfo.total);
      
      return {
        options: group,
        total: groupPriceInfo.total,
        priceRange: groupPriceInfo.priceRange,
        monthlyPayment,
        allApproved: group.every(opt => opt.isApproved)
      } as GroupTotal;
    }
    return null;
  }).filter((group): group is GroupTotal => group !== null);

  // Don't render anything if no valid price groups
  if (andGroupTotals.length === 0) {
    return null;
  }

  const handleEditPackage = (index: number) => {
    setEditingPackage(index)
  }

  const handleSavePackage = () => {
    setEditingPackage(null)
  }

  const handleCancelEdit = () => {
    setEditingPackage(null)
  }

  const handlePackageNameChange = (index: number, value: string) => {
    setPackageNames(prev => ({
      ...prev,
      [index]: value
    }))
  }

  const calculateDiscount = (price: number, promotion: { type: string, discount: string }) => {
    const discountAmount = parseFloat(promotion.discount.replace(/[^0-9.]/g, ''))
    const isPercentage = promotion.discount.includes('%')
    
    if (isPercentage) {
      return (price * discountAmount) / 100
    }
    return discountAmount
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Price Summary</CardTitle>
        <button
          onClick={() => {
            const data = {
              options: options.map(opt => ({
                ...opt,
                details: {
                  ...opt.details
                }
              })),
              operators: alignedOperators,
              packageNames
            }
            // Use btoa (base64 encoding) to safely encode the JSON data
            const encodedData = btoa(JSON.stringify(data));
            // Check if window is defined before using it
            if (typeof window !== 'undefined') {
              const link = `${window.location.origin}/public/compare?data=${encodedData}`;
              window.open(link, '_blank', 'noopener,noreferrer');
            }
          }}
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-black text-white hover:bg-gray-900 flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Share
        </button>
      </CardHeader>
      <CardContent className="space-y-8">
        {andGroupTotals.map((group: GroupTotal, index) => (
          <div key={`group-${index}`} className="space-y-6 pb-8 border-b border-gray-200 last:border-0">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">
                    {editingPackage === index ? (
                      <Input
                        value={packageNames[index] || `Package ${index + 1}`}
                        onChange={(e) => handlePackageNameChange(index, e.target.value)}
                        onBlur={handleCancelEdit}
                        className="h-7"
                      />
                    ) : (
                      <span>{packageNames[index] || `Package ${index + 1}`}</span>
                    )}
                  </h3>
                  {editingPackage !== index && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditPackage(index)}
                      className="h-7 w-7 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  {group.options.map((opt, optIndex) => {
                    const originalPrice = opt.price ?? opt.details?.price ?? 0;
                    const hasPromotion = !!opt.promotion;
                    let discountedPrice = originalPrice;
                    let discount = 0;

                    if (hasPromotion) {
                      discount = calculateDiscount(originalPrice, opt.promotion!)
                      discountedPrice = originalPrice - discount
                    }

                    return (
                      <div key={opt.id} className="flex items-center gap-2">
                        <span>{opt.content}</span>
                        {opt.isApproved && (
                          <Badge variant="secondary" className="text-[10px] font-normal bg-green-100 text-green-700 hover:bg-green-100">
                            Approved
                          </Badge>
                        )}
                        {hasPromotion && (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                              {opt.promotion!.type}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {opt.promotion!.discount.includes('%') ? 
                                <>
                                  <span className="line-through">${originalPrice.toLocaleString()}</span>
                                  {' → '}
                                  <span className="font-medium text-gray-700">${discountedPrice.toLocaleString()}</span>
                                  <span className="text-green-600"> ({opt.promotion!.discount} off)</span>
                                </>
                                : 
                                <>
                                  <span className="line-through">${originalPrice.toLocaleString()}</span>
                                  {' → '}
                                  <span className="font-medium text-gray-700">${discountedPrice.toLocaleString()}</span>
                                  <span className="text-green-600"> ({opt.promotion!.discount} off)</span>
                                </>
                              }
                            </span>
                          </div>
                        )}
                        {optIndex < group.options.length - 1 && (
                          <span className="text-gray-400">+</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                {group.priceRange ? (
                  <div className="text-lg font-bold">
                    ${group.priceRange.min.toLocaleString()} - ${group.priceRange.max.toLocaleString()}
                  </div>
                ) : (
                  <>
                    {/* If any option in the group has a promotion, show original price with strikethrough */}
                    {group.options.some(opt => opt.promotion) && (
                      <div className="text-sm text-gray-500 line-through">
                        ${group.options.reduce((sum, opt) => sum + (opt.price ?? opt.details?.price ?? 0), 0).toLocaleString()}
                      </div>
                    )}
                    <div className="text-lg font-bold">${group.total.toLocaleString()}</div>
                  </>
                )}
                {group.options.some(opt => opt.showAsLowAsPrice !== false) && (
                  <div className="text-sm text-gray-500 whitespace-nowrap">
                    As low as ${group.monthlyPayment.toLocaleString()}/month
                    {group.options.find(opt => opt.financingOption) && (
                      <div className="text-xs text-gray-400">
                        {(() => {
                          const financingOpt = group.options.find(opt => opt.financingOption)?.financingOption;
                          if (financingOpt) {
                            return `${financingOpt.apr}% APR for ${financingOpt.termLength} months`;
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Signature Section for each package - Only visible in print view */}
            <div className="hidden print:block bg-gray-50 p-6 rounded-lg space-y-6">
              <div className="text-sm font-medium text-gray-700 mb-4">
                By signing below, I agree to proceed with {packageNames[index] || `Package ${index + 1}`}
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Customer Signature</p>
                  <div className="h-8 border-b border-gray-400"></div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Date</p>
                  <div className="h-8 border-b border-gray-400"></div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Print Name</p>
                <div className="h-8 border-b border-gray-400"></div>
              </div>
            </div>

            {index < andGroupTotals.length - 1 && (
              <div className="text-center text-sm font-medium text-gray-500 pt-4">OR</div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
} 