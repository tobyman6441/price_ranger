'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { calculateMonthlyPayment } from '@/app/utils/calculations'
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Printer } from 'lucide-react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"

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
  beforeImages?: string[]
  afterImages?: string[]
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
    beforeImages?: string[]
    afterImages?: string[]
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
  const [currentImageIndices, setCurrentImageIndices] = useState<{[key: string]: number}>({})

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
        console.log('Parsed comparison data:', data);

        // Ensure we don't have duplicate options
        const uniqueOptions = data.options.filter((opt, index, self) =>
          index === self.findIndex((o) => o.id === opt.id)
        )
        console.log('Unique options:', uniqueOptions);
        
        // Log image data specifically
        uniqueOptions.forEach(opt => {
          console.log(`Option ${opt.id} image data:`, {
            beforeImage: opt.details?.beforeImage,
            beforeImages: opt.details?.beforeImages,
            afterImage: opt.details?.afterImage,
            afterImages: opt.details?.afterImages
          });
        });
        
        setOptions(uniqueOptions.map(opt => ({
          ...opt,
          details: opt.details ? {
            title: opt.details.title || 'Untitled Option',
            description: opt.details.description || 'No description available',
            price: opt.details.price || 0,
            afterImage: opt.details.afterImage || '',
            beforeImage: opt.details.beforeImage || '',
            beforeImages: opt.details.beforeImages || [],
            afterImages: opt.details.afterImages || [],
            materials: opt.details.materials || [],
            sections: opt.details.sections || [],
            ...(opt.details.financeSettings && { financeSettings: opt.details.financeSettings }),
            showAsLowAsPrice: opt.details.showAsLowAsPrice
          } : undefined,
          promotion: opt.promotion
        })))
        setOperators(data.operators.slice(0, uniqueOptions.length - 1))
        setPackageNames(data.packageNames)
        
        // Initialize image indices for each option and type (before/after)
        const initialIndices: {[key: string]: number} = {};
        uniqueOptions.forEach((opt: Option) => {
          initialIndices[`${opt.id}_before`] = 0;
          initialIndices[`${opt.id}_after`] = 0;
        });
        console.log('Initial image indices:', initialIndices);
        setCurrentImageIndices(initialIndices);
      } catch (error) {
        console.error('Error parsing data:', error)
        setTestData();
      }
    } else {
      // If no data parameter is provided, set test data
      setTestData();
    }
    setIsLoading(false)
  }, [])

  // Function to set test data with multiple images for testing
  const setTestData = () => {
    console.log("No data in URL - using test data with multiple images");
    const testOptions: Option[] = [
      {
        id: 1,
        content: "Kitchen Renovation",
        isComplete: true,
        isApproved: true,
        title: "Kitchen Renovation",
        description: "Complete kitchen overhaul with modern fixtures and appliances",
        price: 25000,
        afterImage: "https://images.unsplash.com/photo-1556912173-3bb406ef7e8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80",
        details: {
          title: "Kitchen Renovation",
          description: "Complete kitchen overhaul with modern fixtures and appliances",
          price: 25000,
          afterImage: "https://images.unsplash.com/photo-1556912173-3bb406ef7e8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80",
          beforeImage: "https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80",
          beforeImages: [
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80",
            "https://images.unsplash.com/photo-1556911220-bff31c812dba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1968&q=80",
            "https://images.unsplash.com/photo-1556911220-dabc94bdbf13?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1652&q=80"
          ],
          afterImages: [
            "https://images.unsplash.com/photo-1556912173-3bb406ef7e8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80",
            "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80",
            "https://images.unsplash.com/photo-1588854337236-6889d631faa8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80"
          ],
          materials: [
            { id: 1, title: "Quartz Countertops", description: "Premium quality countertop material" },
            { id: 2, title: "Hardwood Cabinets", description: "Solid oak cabinets with modern finish" },
            { id: 3, title: "Stainless Steel Appliances", description: "Energy efficient appliances" }
          ],
          sections: [
            { id: 1, title: "Demolition", content: "Complete removal of existing cabinets and countertops" },
            { id: 2, title: "Installation", content: "Professional installation of new cabinets, countertops, and appliances" }
          ]
        }
      },
      {
        id: 2,
        content: "Bathroom Remodel",
        isComplete: true,
        isApproved: false,
        title: "Bathroom Remodel",
        description: "Elegant bathroom renovation with new fixtures and tiling",
        price: 15000,
        afterImage: "https://images.unsplash.com/photo-1613545325278-f24b0cae1224?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1160&q=80",
        details: {
          title: "Bathroom Remodel",
          description: "Elegant bathroom renovation with new fixtures and tiling",
          price: 15000,
          afterImage: "https://images.unsplash.com/photo-1613545325278-f24b0cae1224?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1160&q=80",
          beforeImage: "https://images.unsplash.com/photo-1594032198431-9738efc9a499?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1160&q=80",
          beforeImages: [
            "https://images.unsplash.com/photo-1594032198431-9738efc9a499?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1160&q=80",
            "https://images.unsplash.com/photo-1584622650111-993a426ibf0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80"
          ],
          afterImages: [
            "https://images.unsplash.com/photo-1613545325278-f24b0cae1224?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1160&q=80",
            "https://images.unsplash.com/photo-1584622781339-b96220f67e4c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80"
          ],
          materials: [
            { id: 1, title: "Porcelain Tiles", description: "High-quality porcelain tiles for floors and walls" },
            { id: 2, title: "Glass Shower", description: "Custom glass shower enclosure" }
          ],
          sections: [
            { id: 1, title: "Demolition", content: "Removal of existing fixtures and surfaces" },
            { id: 2, title: "Waterproofing", content: "High-quality waterproofing for shower area" }
          ]
        },
        promotion: {
          type: "Summer Special",
          discount: "10%",
          validUntil: "2023-08-31"
        }
      }
    ];

    setOptions(testOptions);
    setOperators([{ id: 1, type: 'and' }]);
    setPackageNames({ 0: "Standard Package", 1: "Premium Package" });
    
    // Initialize image indices for test data
    const initialIndices: {[key: string]: number} = {};
    testOptions.forEach((opt: Option) => {
      initialIndices[`${opt.id}_before`] = 0;
      initialIndices[`${opt.id}_after`] = 0;
    });
    console.log('Initial test image indices:', initialIndices);
    setCurrentImageIndices(initialIndices);
  };

  // Get either before or after images for an option
  const getImagesByType = (option: Option, type: 'before' | 'after') => {
    if (type === 'before') {
      // Return beforeImages array if it exists, otherwise use single beforeImage
      const images = option.details?.beforeImages && option.details.beforeImages.length > 0
        ? option.details.beforeImages
        : option.details?.beforeImage 
          ? [option.details.beforeImage] 
          : [];
      console.log(`Before images for option ${option.id}:`, images);
      return images;
    } else {
      // Return afterImages array if it exists, otherwise use single afterImage
      const images = option.details?.afterImages && option.details.afterImages.length > 0
        ? option.details.afterImages
        : option.details?.afterImage 
          ? [option.details.afterImage] 
          : [];
      console.log(`After images for option ${option.id}:`, images);
      return images;
    }
  };

  // Navigate to next image
  const nextImage = (optionId: number, type: 'before' | 'after') => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log(`Attempting to move to next ${type} image for option ${optionId}`);
      const option = options.find(opt => opt.id === optionId);
      if (!option) {
        console.log(`Option ${optionId} not found`);
        return;
      }
      
      const images = getImagesByType(option, type);
      if (images.length <= 1) {
        console.log(`Only one ${type} image available, skipping navigation`);
        return;
      }
      
      const currentIndex = currentImageIndices[`${optionId}_${type}`] || 0;
      const newIndex = (currentIndex + 1) % images.length;
      console.log(`Moving from index ${currentIndex} to ${newIndex} (of ${images.length} images)`);
      
      setCurrentImageIndices(prev => {
        const updated = {
          ...prev,
          [`${optionId}_${type}`]: newIndex
        };
        console.log('Updated image indices:', updated);
        return updated;
      });
    };
  };

  // Navigate to previous image
  const prevImage = (optionId: number, type: 'before' | 'after') => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log(`Attempting to move to previous ${type} image for option ${optionId}`);
      const option = options.find(opt => opt.id === optionId);
      if (!option) {
        console.log(`Option ${optionId} not found`);
        return;
      }
      
      const images = getImagesByType(option, type);
      if (images.length <= 1) {
        console.log(`Only one ${type} image available, skipping navigation`);
        return;
      }
      
      const currentIndex = currentImageIndices[`${optionId}_${type}`] || 0;
      const newIndex = (currentIndex - 1 + images.length) % images.length;
      console.log(`Moving from index ${currentIndex} to ${newIndex} (of ${images.length} images)`);
      
      setCurrentImageIndices(prev => {
        const updated = {
          ...prev,
          [`${optionId}_${type}`]: newIndex
        };
        console.log('Updated image indices:', updated);
        return updated;
      });
    };
  };

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

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
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
      <div className="max-w-7xl mx-auto px-4 no-print">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Compare Packages</h1>
          <Button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print and sign
          </Button>
        </div>
        
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
                        {/* Before Images */}
                        {(opt.details?.beforeImage || (opt.details?.beforeImages && opt.details.beforeImages.length > 0)) && (
                          <div className="relative aspect-video rounded-lg overflow-hidden">
                            {(() => {
                              const beforeImages = getImagesByType(opt, 'before');
                              const currentBeforeIndex = currentImageIndices[`${opt.id}_before`] || 0;
                              const hasMultipleBeforeImages = beforeImages.length > 1;
                              
                              return (
                                <>
                                  <Image
                                    src={beforeImages[currentBeforeIndex]}
                                    alt={`${opt.details?.title || ''} (Before)`}
                                    fill
                                    className="object-cover"
                                  />
                                  
                                  {/* Image Type Label */}
                                  <div className="absolute top-2 left-2 px-3 py-1.5 rounded-full text-xs font-medium bg-black/60 text-white">
                                    <span className="text-red-300">Before</span>
                                    {hasMultipleBeforeImages && (
                                      <span className="ml-2 text-white/80">
                                        {currentBeforeIndex + 1}/{beforeImages.length}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Navigation Arrows (only show if multiple images) */}
                                  {hasMultipleBeforeImages && (
                                    <>
                                      <button
                                        onClick={prevImage(opt.id, 'before')}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black shadow-md border border-white/20"
                                        aria-label="Previous image"
                                      >
                                        <ChevronLeft className="w-5 h-5" />
                                      </button>
                                      <button
                                        onClick={nextImage(opt.id, 'before')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black shadow-md border border-white/20"
                                        aria-label="Next image"
                                      >
                                        <ChevronRight className="w-5 h-5" />
                                      </button>
                                    </>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}

                        {/* After Images */}
                        {(opt.details?.afterImage || (opt.details?.afterImages && opt.details.afterImages.length > 0)) && (
                          <div className="relative aspect-video rounded-lg overflow-hidden">
                            {(() => {
                              const afterImages = getImagesByType(opt, 'after');
                              const currentAfterIndex = currentImageIndices[`${opt.id}_after`] || 0;
                              const hasMultipleAfterImages = afterImages.length > 1;
                              
                              return (
                                <>
                                  <Image
                                    src={afterImages[currentAfterIndex]}
                                    alt={`${opt.details?.title || ''} (After)`}
                                    fill
                                    className="object-cover"
                                  />
                                  
                                  {/* Image Type Label */}
                                  <div className="absolute top-2 left-2 px-3 py-1.5 rounded-full text-xs font-medium bg-black/60 text-white">
                                    <span className="text-green-300">After</span>
                                    {hasMultipleAfterImages && (
                                      <span className="ml-2 text-white/80">
                                        {currentAfterIndex + 1}/{afterImages.length}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Navigation Arrows (only show if multiple images) */}
                                  {hasMultipleAfterImages && (
                                    <>
                                      <button
                                        onClick={prevImage(opt.id, 'after')}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black shadow-md border border-white/20"
                                        aria-label="Previous image"
                                      >
                                        <ChevronLeft className="w-5 h-5" />
                                      </button>
                                      <button
                                        onClick={nextImage(opt.id, 'after')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black shadow-md border border-white/20"
                                        aria-label="Next image"
                                      >
                                        <ChevronRight className="w-5 h-5" />
                                      </button>
                                    </>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold mb-2">{opt.details?.title || opt.content}</h3>
                            <p className="text-sm text-gray-600">{opt.details?.description || 'No description available'}</p>
                          </div>
                          
                          {/* Display Materials as Tags */}
                          {opt.details?.materials && opt.details.materials.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-medium">Materials</h4>
                              <div className="flex flex-wrap gap-2">
                                {opt.details.materials.map((material) => (
                                  <Badge key={material.id} variant="outline" className="text-xs">
                                    {material.title}
                                  </Badge>
                                ))}
                              </div>
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
                                {/* Before Images */}
                                {(opt.details?.beforeImage || (opt.details?.beforeImages && opt.details.beforeImages.length > 0)) && (
                                  <div className="relative aspect-video rounded-lg overflow-hidden">
                                    {(() => {
                                      const beforeImages = getImagesByType(opt, 'before');
                                      const currentBeforeIndex = currentImageIndices[`${opt.id}_before`] || 0;
                                      const hasMultipleBeforeImages = beforeImages.length > 1;
                                      
                                      return (
                                        <>
                                          <Image
                                            src={beforeImages[currentBeforeIndex]}
                                            alt={`${opt.details?.title || ''} (Before)`}
                                            fill
                                            className="object-cover"
                                          />
                                          
                                          {/* Image Type Label */}
                                          <div className="absolute top-2 left-2 px-3 py-1.5 rounded-full text-xs font-medium bg-black/60 text-white">
                                            <span className="text-red-300">Before</span>
                                            {hasMultipleBeforeImages && (
                                              <span className="ml-2 text-white/80">
                                                {currentBeforeIndex + 1}/{beforeImages.length}
                                              </span>
                                            )}
                                          </div>
                                          
                                          {/* Navigation Arrows (only show if multiple images) */}
                                          {hasMultipleBeforeImages && (
                                            <>
                                              <button
                                                onClick={prevImage(opt.id, 'before')}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black shadow-md border border-white/20"
                                                aria-label="Previous image"
                                              >
                                                <ChevronLeft className="w-5 h-5" />
                                              </button>
                                              <button
                                                onClick={nextImage(opt.id, 'before')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black shadow-md border border-white/20"
                                                aria-label="Next image"
                                              >
                                                <ChevronRight className="w-5 h-5" />
                                              </button>
                                            </>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                )}

                                {/* After Images */}
                                {(opt.details?.afterImage || (opt.details?.afterImages && opt.details.afterImages.length > 0)) && (
                                  <div className="relative aspect-video rounded-lg overflow-hidden">
                                    {(() => {
                                      const afterImages = getImagesByType(opt, 'after');
                                      const currentAfterIndex = currentImageIndices[`${opt.id}_after`] || 0;
                                      const hasMultipleAfterImages = afterImages.length > 1;
                                      
                                      return (
                                        <>
                                          <Image
                                            src={afterImages[currentAfterIndex]}
                                            alt={`${opt.details?.title || ''} (After)`}
                                            fill
                                            className="object-cover"
                                          />
                                          
                                          {/* Image Type Label */}
                                          <div className="absolute top-2 left-2 px-3 py-1.5 rounded-full text-xs font-medium bg-black/60 text-white">
                                            <span className="text-green-300">After</span>
                                            {hasMultipleAfterImages && (
                                              <span className="ml-2 text-white/80">
                                                {currentAfterIndex + 1}/{afterImages.length}
                                              </span>
                                            )}
                                          </div>
                                          
                                          {/* Navigation Arrows (only show if multiple images) */}
                                          {hasMultipleAfterImages && (
                                            <>
                                              <button
                                                onClick={prevImage(opt.id, 'after')}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black shadow-md border border-white/20"
                                                aria-label="Previous image"
                                              >
                                                <ChevronLeft className="w-5 h-5" />
                                              </button>
                                              <button
                                                onClick={nextImage(opt.id, 'after')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black shadow-md border border-white/20"
                                                aria-label="Next image"
                                              >
                                                <ChevronRight className="w-5 h-5" />
                                              </button>
                                            </>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                )}
                                <div className="space-y-4">
                                  <div>
                                    <h3 className="font-semibold mb-2">{opt.details?.title || opt.content}</h3>
                                    <p className="text-sm text-gray-600">{opt.details?.description || 'No description available'}</p>
                                  </div>
                                  
                                  {/* Display Materials as Tags */}
                                  {opt.details?.materials && opt.details.materials.length > 0 && (
                                    <div className="space-y-2">
                                      <h4 className="font-medium">Materials</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {opt.details.materials.map((material) => (
                                          <Badge key={material.id} variant="outline" className="text-xs">
                                            {material.title}
                                          </Badge>
                                        ))}
                                      </div>
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

      {/* Print View - hidden normally, shown when printing */}
      <div className="print-view hidden">
        <div className="print-header">
          <h1>Project Options</h1>
          <p>Compare packages and select your preferred option below.</p>
        </div>

        {andGroupTotals.map((group, index) => (
          <div key={index} className={`print-package ${group.allApproved ? 'print-package-approved' : ''}`}>
            <div className="print-package-header">
              <div className="print-package-title">{packageNames[index] || `Package ${index + 1}`}</div>
              <div>
                <div className="print-initial-box"></div>
                <div className="print-initial-label">Initial here to approve</div>
              </div>
            </div>

            <div className="print-options">
              {group.options.map((opt) => (
                <div key={opt.id} className="print-option">
                  <h3>{opt.details?.title || opt.content}</h3>
                  <p>{opt.details?.description || 'No description available'}</p>

                  {/* Print Before Images */}
                  {(opt.details?.beforeImage || (opt.details?.beforeImages && opt.details.beforeImages.length > 0)) && (
                    <div className="flex justify-center my-4">
                      <div className="relative" style={{ width: '300px', height: '200px', overflow: 'hidden' }}>
                        <img 
                          src={getImagesByType(opt, 'before')[0]} 
                          alt={`${opt.details?.title || ''} (Before)`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                          <span style={{ color: '#FCA5A5' }}>Before</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Print After Images */}
                  {(opt.details?.afterImage || (opt.details?.afterImages && opt.details.afterImages.length > 0)) && (
                    <div className="flex justify-center my-4">
                      <div className="relative" style={{ width: '300px', height: '200px', overflow: 'hidden' }}>
                        <img 
                          src={getImagesByType(opt, 'after')[0]} 
                          alt={`${opt.details?.title || ''} (After)`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                          <span style={{ color: '#86EFAC' }}>After</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Print Materials as Tags */}
                  {opt.details?.materials && opt.details.materials.length > 0 && (
                    <div className="my-3">
                      <h4 className="text-sm font-medium">Materials</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {opt.details.materials.map((material) => (
                          <span key={material.id} style={{ border: '1px solid #e2e8f0', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', display: 'inline-block', margin: '0 3px 3px 0' }}>
                            {material.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {opt.details?.sections && opt.details.sections.length > 0 && (
                    <div className="my-3">
                      <h4 className="text-sm font-medium">Project Details</h4>
                      {opt.details.sections.map((section) => (
                        <div key={section.id} className="my-2">
                          <p className="text-sm font-medium">{section.title}</p>
                          <p className="text-sm">{section.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Option pricing */}
                  {opt.details?.price && (
                    <div className="print-option-price">
                      {opt.promotion ? (
                        <div>
                          <div>
                            <span style={{ textDecoration: 'line-through' }}>${opt.details.price.toLocaleString()}</span>
                            <span className="font-medium ml-2 mr-2">→</span>
                            <span className="font-medium">${(opt.details.price - calculateDiscount(opt.details.price, opt.promotion)).toLocaleString()}</span>
                            <span className="text-green-600 text-xs ml-2">({opt.promotion.discount} off)</span>
                          </div>
                          <div className="text-xs my-1">Valid until {new Date(opt.promotion.validUntil).toLocaleDateString()}</div>
                        </div>
                      ) : (
                        <div className="font-medium">${opt.details.price.toLocaleString()}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="print-price">
              <div className="font-bold text-xl mb-1">Package Total: ${group.total.toLocaleString()}</div>
              {group.options.some(opt => opt.showAsLowAsPrice !== false) && (
                <div className="text-sm">As low as ${group.monthlyPayment.toLocaleString()}/month</div>
              )}
            </div>
          </div>
        ))}

        <div className="print-contract">
          <h2>Terms & Conditions</h2>
          <p className="print-terms">
            By initialing and signing this document, you are agreeing to proceed with the selected package option.
            The pricing provided is valid for 30 days from the date of this proposal. All work will be completed
            according to the specifications detailed in this document. A 50% deposit is required to begin work,
            with the remaining balance due upon completion. Any changes to the scope of work may result in
            additional charges. All materials and workmanship are guaranteed for a period of 1 year from the
            completion date.
          </p>

          <div className="print-signatures mt-8">
            <div>
              <div className="mb-1">Client Signature:</div>
              <div style={{ borderBottom: '1px solid black', height: '30px', width: '250px' }}></div>
            </div>
            <div className="mt-4">
              <div className="mb-1">Date:</div>
              <div style={{ borderBottom: '1px solid black', height: '30px', width: '150px' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 