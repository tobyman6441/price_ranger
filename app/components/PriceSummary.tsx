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
  };
  isApproved?: boolean;
  showAsLowAsPrice?: boolean;
  promotion?: Promotion;
}

interface Operator {
  id: number
  type: 'and' | 'or'
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
    const total = group.reduce((sum, option) => {
      let price = option.price ?? option.details?.price ?? 0;
      let priceRange = option.priceRange ?? option.details?.priceRange;
      
      // Apply promotion discount if exists
      if (option.promotion) {
        const discountAmount = parseFloat(option.promotion.discount.replace(/[^0-9.]/g, ''))
        const isPercentage = option.promotion.discount.includes('%')
        
        if (isPercentage) {
          if (priceRange) {
            price = priceRange.min * (1 - discountAmount / 100);
          } else {
            price = price * (1 - discountAmount / 100);
          }
        } else {
          if (priceRange) {
            price = priceRange.min - discountAmount;
          } else {
            price = price - discountAmount;
          }
        }
      }
      
      return sum + price;
    }, 0);

    return {
      options: group,
      total,
      priceRange: group[0].priceRange ?? group[0].details?.priceRange,
      monthlyPayment: calculateMonthlyPayment(total),
      allApproved: group.every(opt => opt.isApproved)
    };
  })

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
            const link = `${window.location.origin}/public/compare?data=${encodedData}`;
            window.open(link, '_blank', 'noopener,noreferrer');
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
        {andGroupTotals.map((group, index) => (
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
                            <Badge variant="secondary" className="text-[10px] font-normal bg-purple-100 text-purple-700 hover:bg-purple-100">
                              {opt.promotion!.type}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              (${originalPrice.toLocaleString()} → ${discountedPrice.toLocaleString()})
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
                  <div className="text-lg font-bold">${group.total.toLocaleString()}</div>
                )}
                {group.options.some(opt => opt.showAsLowAsPrice !== false) && (
                  <div className="text-sm text-gray-500 whitespace-nowrap">
                    As low as ${group.monthlyPayment.toLocaleString()}/month
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