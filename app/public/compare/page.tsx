'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { calculateMonthlyPayment } from '@/app/utils/calculations'
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'

interface Option {
  id: number
  content: string
  isComplete: boolean
  isApproved?: boolean
  title: string
  description: string
  price?: number
  afterImage: string
  beforeImage?: string
  materials?: Array<{
    id: number
    title: string
    description: string
  }>
  sections?: Array<{
    id: number
    title: string
    content: string
  }>
  hasCalculations?: boolean
  showAsLowAsPrice?: boolean
  details?: {
    price: number
    title: string
    description: string
    afterImage: string
    beforeImage?: string
    address?: string
    materials?: Array<{
      id: number
      title: string
      description: string
    }>
    sections?: Array<{
      id: number
      title: string
      content: string
    }>
    financeSettings?: {
      apr: number
      termLength: number
    }
    showAsLowAsPrice?: boolean
  }
  promotion?: {
    type: string
    discount: string
    validUntil: string
  }
}

interface Operator {
  id: number
  type: 'and' | 'or'
}

interface ComparisonData {
  options: Option[]
  operators: Operator[]
  packageNames: { [key: number]: string }
}

export default function PublicComparePage() {
  const [options, setOptions] = useState<Option[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [packageNames, setPackageNames] = useState<{ [key: string]: string }>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Add print-specific styles
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @media print {
        @page {
          margin: 1in;
          size: letter portrait;
        }

        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #1a1a1a;
        }

        .no-print {
          display: none !important;
        }

        .print-view {
          display: block !important;
        }

        .print-package {
          break-inside: avoid;
          page-break-inside: avoid;
          margin-bottom: 2rem;
          padding: 2rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          background: white;
        }

        .print-header {
          text-align: center;
          margin-bottom: 3rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid #e5e7eb;
        }

        .print-header h1 {
          font-size: 28px;
          font-weight: bold;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .print-header p {
          font-size: 16px;
          color: #4b5563;
        }

        .print-package-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .print-package-title {
          font-size: 24px;
          font-weight: 600;
          color: #111827;
        }

        .print-initial-box {
          border: 2px solid #000;
          width: 60px;
          height: 40px;
          border-radius: 4px;
          margin-left: 1rem;
        }

        .print-initial-label {
          font-size: 12px;
          color: #6b7280;
          font-style: italic;
          margin-top: 0.25rem;
        }

        .print-option {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px dashed #e5e7eb;
        }

        .print-option:last-child {
          border-bottom: none;
        }

        .print-price {
          margin-top: 2rem;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 0.5rem;
        }

        .print-contract {
          margin-top: 4rem;
          page-break-before: always;
        }

        .print-contract h2 {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }

        .print-terms {
          font-size: 14px;
          color: #374151;
          margin-bottom: 2rem;
        }

        .print-signature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-top: 3rem;
        }

        .print-signature-line {
          border-bottom: 1px solid #000;
          margin-top: 2rem;
          margin-bottom: 0.5rem;
        }

        .print-signature-label {
          font-size: 14px;
          color: #6b7280;
        }
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  useEffect(() => {
    // Get data from URL parameters
    const params = new URLSearchParams(window.location.search)
    const dataParam = params.get('data')
    
    if (dataParam) {
      try {
        // Decode using atob (base64 decoding) instead of decodeURIComponent
        const jsonString = atob(dataParam);
        const data: ComparisonData = JSON.parse(jsonString);

        // Ensure we don't have duplicate options
        const uniqueOptions = data.options.filter((opt, index, self) =>
          index === self.findIndex((o) => o.id === opt.id)
        )
        
        setOptions(uniqueOptions.map(opt => ({
          ...opt,
          details: opt.details ? {
            title: opt.details.title || 'Untitled Option',
            description: opt.details.description || 'No description available',
            price: opt.details.price || 0,
            afterImage: opt.details.afterImage || '',
            beforeImage: opt.details.beforeImage || '',
            materials: opt.details.materials || [],
            sections: opt.details.sections || [],
            ...(opt.details.financeSettings && { financeSettings: opt.details.financeSettings }),
            showAsLowAsPrice: opt.details.showAsLowAsPrice
          } : undefined,
          promotion: opt.promotion
        })))
        setOperators(data.operators.slice(0, uniqueOptions.length - 1))
        setPackageNames(data.packageNames)
      } catch (error) {
        console.error('Error parsing data:', error)
      }
    }
    setIsLoading(false)
  }, [])

  // Ensure operators array is properly aligned with options
  const alignedOperators = options.map((_, index) => {
    if (index < operators.length) {
      return operators[index]
    }
    return { id: index + 1, type: 'and' as const }
  })

  // Group options by "And" relationships
  const andGroups: Option[][] = []
  let currentGroup: Option[] = []

  options.forEach((option, index) => {
    currentGroup.push(option)
    if (index < alignedOperators.length && alignedOperators[index].type === 'or') {
      andGroups.push([...currentGroup])
      currentGroup = []
    }
  })
  if (currentGroup.length > 0) {
    andGroups.push(currentGroup)
  }

  // Remove duplicate groups by converting to string for comparison
  const uniqueGroups = andGroups.filter((group, index, self) => {
    const groupKey = JSON.stringify(group.map(opt => opt.id).sort())
    return index === self.findIndex(g => JSON.stringify(g.map(opt => opt.id).sort()) === groupKey)
  })

  // Calculate total price for each unique "And" group
  const andGroupTotals = uniqueGroups.map((group, index) => {
    const total = group.reduce((sum, option) => {
      let price = option.details?.price || 0;
      
      // Apply promotion discount if exists
      if (option.promotion) {
        const discountAmount = parseFloat(option.promotion.discount.replace(/[^0-9.]/g, ''));
        const isPercentage = option.promotion.discount.includes('%');
        
        if (isPercentage) {
          price = price * (1 - discountAmount / 100);
        } else {
          price = price - discountAmount;
        }
      }
      
      return sum + price;
    }, 0);
    
    return {
      id: `package-${index}`,
      options: group,
      total,
      monthlyPayment: calculateMonthlyPayment(total),
      allApproved: group.every(opt => opt.isApproved),
      showAsLowAsPrice: group.some(opt => opt.details?.showAsLowAsPrice !== false)
    }
  })

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === andGroupTotals.length - 1 ? 0 : prevIndex + 1
    )
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? andGroupTotals.length - 1 : prevIndex - 1
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (options.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Data Available</h1>
          <p className="text-gray-600">The comparison data could not be loaded.</p>
        </div>
      </div>
    )
  }

  // Add this helper function before the return statement
  const calculateDiscount = (price: number, promotion: { type: string, discount: string }) => {
    const discountAmount = parseFloat(promotion.discount.replace(/[^0-9.]/g, ''));
    const isPercentage = promotion.discount.includes('%');
    
    if (isPercentage) {
      return (price * discountAmount) / 100;
    }
    return discountAmount;
  };

  return (
    <div className="min-h-screen bg-background py-12">
      {/* Regular view for screen */}
      <div className="max-w-7xl mx-auto px-4 no-print">
        <h1 className="text-3xl font-bold text-center mb-8">Compare Packages</h1>
        
        <div className="relative">
          {/* Desktop View */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {andGroupTotals.map((group, index) => (
              <Card key={index} className={`${group.allApproved ? 'border-green-500' : ''}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{packageNames[index] || `Package ${index + 1}`}</span>
                    {group.allApproved && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Approved
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {group.options.map((opt) => (
                      <div key={opt.id} className="space-y-4">
                        {opt.details?.afterImage && (
                          <div className="relative aspect-video rounded-lg overflow-hidden">
                            <Image
                              src={opt.details.afterImage}
                              alt={opt.details.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold mb-2">{opt.details?.title || opt.content}</h3>
                            <p className="text-sm text-gray-600">{opt.details?.description || 'No description available'}</p>
                          </div>
                          
                          {opt.details?.materials && opt.details.materials.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-medium">Materials</h4>
                              {opt.details.materials.map((material) => (
                                <div key={material.id} className="space-y-1">
                                  <p className="text-sm font-medium">{material.title}</p>
                                  <p className="text-sm text-gray-600">{material.description}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {opt.details?.sections && opt.details.sections.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-medium">Project Details</h4>
                              {opt.details.sections.map((section) => (
                                <div key={section.id} className="space-y-1">
                                  <p className="text-sm font-medium">{section.title}</p>
                                  <p className="text-sm text-gray-600">{section.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 border-t space-y-2">
                      {group.options.map((opt) => {
                        const originalPrice = opt.details?.price || 0;
                        if (opt.promotion) {
                          const discount = calculateDiscount(originalPrice, opt.promotion);
                          const finalPrice = originalPrice - discount;
                          return (
                            <div key={`price-${opt.id}`} className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{opt.details?.title || opt.content}</span>
                                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                  {opt.promotion.type}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 line-through">${originalPrice.toLocaleString()}</span>
                                <span className="text-sm font-medium">→</span>
                                <span className="text-sm font-medium">${finalPrice.toLocaleString()}</span>
                                <span className="text-xs text-green-600">
                                  ({opt.promotion.discount} off)
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                Valid until {new Date(opt.promotion.validUntil).toLocaleDateString()}
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={`price-${opt.id}`} className="space-y-1">
                            <div className="text-sm font-medium">
                              {opt.details?.title || opt.content}: ${originalPrice.toLocaleString()}
                            </div>
                          </div>
                        );
                      })}
                      <div className="pt-2 border-t mt-4">
                        <div className="text-2xl font-bold">
                          {/* Check if any option has a promotion and show original price */}
                          {group.options.some(opt => opt.promotion) && (
                            <div className="text-lg text-gray-500 line-through">
                              ${group.options.reduce((sum, opt) => sum + (opt.details?.price || 0), 0).toLocaleString()}
                            </div>
                          )}
                          ${group.total.toLocaleString()}
                        </div>
                        {group.options.some(opt => opt.showAsLowAsPrice !== false) && (
                          <div className="text-gray-500">
                            As low as ${group.monthlyPayment.toLocaleString()}/month
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Mobile Carousel View */}
          <div className="md:hidden">
            <div className="relative">
              <div className="overflow-hidden">
                <div 
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  {andGroupTotals.map((group, index) => (
                    <div key={index} className="w-full flex-shrink-0">
                      <Card className={`${group.allApproved ? 'border-green-500' : ''}`}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{packageNames[index] || `Package ${index + 1}`}</span>
                            {group.allApproved && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                Approved
                              </Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {group.options.map((opt) => (
                              <div key={opt.id} className="space-y-4">
                                {opt.details?.afterImage && (
                                  <div className="relative aspect-video rounded-lg overflow-hidden">
                                    <Image
                                      src={opt.details.afterImage}
                                      alt={opt.details.title}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                                <div className="space-y-4">
                                  <div>
                                    <h3 className="font-semibold mb-2">{opt.details?.title || opt.content}</h3>
                                    <p className="text-sm text-gray-600">{opt.details?.description || 'No description available'}</p>
                                  </div>
                                  
                                  {opt.details?.materials && opt.details.materials.length > 0 && (
                                    <div className="space-y-2">
                                      <h4 className="font-medium">Materials</h4>
                                      {opt.details.materials.map((material) => (
                                        <div key={material.id} className="space-y-1">
                                          <p className="text-sm font-medium">{material.title}</p>
                                          <p className="text-sm text-gray-600">{material.description}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {opt.details?.sections && opt.details.sections.length > 0 && (
                                    <div className="space-y-2">
                                      <h4 className="font-medium">Project Details</h4>
                                      {opt.details.sections.map((section) => (
                                        <div key={section.id} className="space-y-1">
                                          <p className="text-sm font-medium">{section.title}</p>
                                          <p className="text-sm text-gray-600">{section.content}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            <div className="pt-4 border-t space-y-2">
                              {group.options.map((opt) => {
                                const originalPrice = opt.details?.price || 0;
                                if (opt.promotion) {
                                  const discount = calculateDiscount(originalPrice, opt.promotion);
                                  const finalPrice = originalPrice - discount;
                                  return (
                                    <div key={`price-${opt.id}`} className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{opt.details?.title || opt.content}</span>
                                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                          {opt.promotion.type}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500 line-through">${originalPrice.toLocaleString()}</span>
                                        <span className="text-sm font-medium">→</span>
                                        <span className="text-sm font-medium">${finalPrice.toLocaleString()}</span>
                                        <span className="text-xs text-green-600">
                                          ({opt.promotion.discount} off)
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Valid until {new Date(opt.promotion.validUntil).toLocaleDateString()}
                                      </div>
                                    </div>
                                  );
                                }
                                return (
                                  <div key={`price-${opt.id}`} className="space-y-1">
                                    <div className="text-sm font-medium">
                                      {opt.details?.title || opt.content}: ${originalPrice.toLocaleString()}
                                    </div>
                                  </div>
                                );
                              })}
                              <div className="pt-2 border-t mt-4">
                                <div className="text-2xl font-bold">
                                  {/* Check if any option has a promotion and show original price */}
                                  {group.options.some(opt => opt.promotion) && (
                                    <div className="text-lg text-gray-500 line-through">
                                      ${group.options.reduce((sum, opt) => sum + (opt.details?.price || 0), 0).toLocaleString()}
                                    </div>
                                  )}
                                  ${group.total.toLocaleString()}
                                </div>
                                {group.options.some(opt => opt.showAsLowAsPrice !== false) && (
                                  <div className="text-gray-500">
                                    As low as ${group.monthlyPayment.toLocaleString()}/month
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
              {/* Navigation controls */}
              <div className="mt-6 flex flex-col items-center gap-4">
                <div className="flex items-center justify-between w-full px-4 max-w-sm mx-auto">
                  <button 
                    onClick={prevSlide}
                    className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6 text-white/60" />
                  </button>
                  <div className="flex gap-2">
                    {andGroupTotals.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentIndex ? 'bg-white' : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                  <button 
                    onClick={nextSlide}
                    className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-6 h-6 text-white/60" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print view */}
      <div className="hidden print-view">
        <div className="print-header">
          <h1>Package Selection Proposal</h1>
          <p>Please review the packages below and initial next to your selection.</p>
        </div>

        {andGroupTotals.map((group, index) => (
          <div key={group.id} className="print-package">
            <div className="print-package-header">
              <div>
                <h2 className="print-package-title">
                  {packageNames[index] || `Package ${index + 1}`}
                </h2>
                {group.allApproved && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Approved
                  </Badge>
                )}
              </div>
              <div className="text-center">
                <div className="print-initial-box"></div>
                <div className="print-initial-label">Initial here to select</div>
              </div>
            </div>

            {group.options.map((opt) => (
              <div key={opt.id} className="print-option">
                <h3 className="font-semibold mb-2">
                  {opt.details?.title || opt.content}
                </h3>
                <p className="text-gray-600">
                  {opt.details?.description || 'No description available'}
                </p>

                {opt.details?.materials && opt.details.materials.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Materials</h4>
                    {opt.details.materials.map((material) => (
                      <div key={material.id} className="mb-2">
                        <p className="font-medium">{material.title}</p>
                        <p className="text-gray-600">{material.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {opt.details?.sections && opt.details.sections.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Project Details</h4>
                    {opt.details.sections.map((section) => (
                      <div key={section.id} className="mb-2">
                        <p className="font-medium">{section.title}</p>
                        <p className="text-gray-600">{section.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="print-price">
              {group.options.map((opt) => {
                const originalPrice = opt.details?.price || 0;
                if (opt.promotion) {
                  const discount = calculateDiscount(originalPrice, opt.promotion);
                  const finalPrice = originalPrice - discount;
                  return (
                    <div key={`price-${opt.id}`} className="mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{opt.details?.title || opt.content}</span>
                        <span className="text-purple-700 font-medium">{opt.promotion.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 line-through">${originalPrice.toLocaleString()}</span>
                        <span className="font-medium">→</span>
                        <span className="font-medium">${finalPrice.toLocaleString()}</span>
                        <span className="text-green-600 text-sm">
                          ({opt.promotion.discount} off)
                        </span>
                      </div>
                      <div className="text-gray-500 text-sm">
                        Valid until {new Date(opt.promotion.validUntil).toLocaleDateString()}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={`price-${opt.id}`} className="mb-2">
                    <div className="font-medium">
                      {opt.details?.title || opt.content}: ${originalPrice.toLocaleString()}
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 border-t mt-4">
                <div className="text-2xl font-bold">
                  {/* Check if any option has a promotion and show original price */}
                  {group.options.some(opt => opt.promotion) && (
                    <div className="text-lg text-gray-500 line-through">
                      ${group.options.reduce((sum, opt) => sum + (opt.details?.price || 0), 0).toLocaleString()}
                    </div>
                  )}
                  ${group.total.toLocaleString()}
                </div>
                {group.options.some(opt => opt.showAsLowAsPrice !== false) && (
                  <div className="text-gray-500">
                    As low as ${group.monthlyPayment.toLocaleString()}/month
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        <div className="print-contract">
          <h2>Terms and Conditions</h2>
          <div className="print-terms">
            <p className="mb-4">
              1. Acceptance of Proposal: The above prices, specifications, and conditions are satisfactory and are hereby accepted. You are authorized to perform the work as specified.
            </p>
            <p className="mb-4">
              2. Payment Terms: Payment will be made according to the terms specified in the selected package. Monthly payment options are subject to credit approval and may vary based on creditworthiness.
            </p>
            <p className="mb-4">
              3. Project Timeline: Work will commence within 30 days of contract signing, weather and material availability permitting. Estimated completion times will be provided upon project initiation.
            </p>
            <p className="mb-4">
              4. Changes & Modifications: Any alterations or deviations from the above specifications involving extra costs will be executed only upon written orders and will become an extra charge over and above the estimate.
            </p>
            <p>
              5. Warranty: All work is guaranteed for quality of craftsmanship for a period of one year from completion date, unless otherwise specified in writing.
            </p>
          </div>

          <div className="print-signature-grid">
            <div>
              <div className="print-signature-line"></div>
              <div className="print-signature-label">Customer Signature</div>
            </div>
            <div>
              <div className="print-signature-line"></div>
              <div className="print-signature-label">Date</div>
            </div>
          </div>

          <div className="mt-8">
            <div className="print-signature-line"></div>
            <div className="print-signature-label">Print Name</div>
          </div>
        </div>
      </div>
    </div>
  )
} 