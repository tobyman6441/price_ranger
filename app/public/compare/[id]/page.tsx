"use client";

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { calculateMonthlyPayment } from '@/app/utils/calculations'
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from "@/components/ui/carousel"

interface Option {
  id: number
  content: string
  isComplete: boolean
  isApproved?: boolean
  details?: {
    title: string
    description: string
    price: number
    afterImage: string
    beforeImage?: string
    beforeImages?: string[]
    afterImages?: string[]
    materials?: {
      id: number
      title: string
      description: string
    }[]
    sections?: {
      id: number
      title: string
      content: string
    }[]
  }
}

interface Operator {
  id: number
  type: 'and' | 'or'
}

export default function PublicComparePage() {
  const [options, setOptions] = useState<Option[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [currentImageIndices, setCurrentImageIndices] = useState<Record<string, number>>({})

  useEffect(() => {
    // In design mode, we'll use mock data
    const mockOptions: Option[] = [
      {
        id: 1,
        content: "Basic Package",
        isComplete: true,
        isApproved: true,
        details: {
          title: "Basic Package",
          description: "Essential home improvements including basic repairs, painting, and minor upgrades",
          price: 15000,
          afterImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop",
          materials: [
            {
              id: 1,
              title: "Standard Paint",
              description: "High-quality interior paint for walls and ceilings"
            },
            {
              id: 2,
              title: "Basic Fixtures",
              description: "Standard lighting fixtures and hardware"
            }
          ],
          sections: [
            {
              id: 1,
              title: "Scope of Work",
              content: "Includes basic repairs, interior painting, and standard fixture installation"
            },
            {
              id: 2,
              title: "Timeline",
              content: "Estimated completion time: 2-3 weeks"
            }
          ]
        }
      },
      {
        id: 2,
        content: "Premium Package",
        isComplete: true,
        isApproved: true,
        details: {
          title: "Premium Package",
          description: "Comprehensive home renovation with high-end materials and custom finishes",
          price: 35000,
          afterImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1000&auto=format&fit=crop",
          materials: [
            {
              id: 1,
              title: "Premium Paint",
              description: "Luxury-grade interior and exterior paint with extended warranty"
            },
            {
              id: 2,
              title: "Custom Fixtures",
              description: "Designer lighting fixtures and custom hardware"
            }
          ],
          sections: [
            {
              id: 1,
              title: "Scope of Work",
              content: "Includes full renovation, custom finishes, and premium material installation"
            },
            {
              id: 2,
              title: "Timeline",
              content: "Estimated completion time: 4-6 weeks"
            }
          ]
        }
      },
      {
        id: 3,
        content: "Luxury Package",
        isComplete: true,
        isApproved: false,
        details: {
          title: "Luxury Package",
          description: "Ultimate home transformation with luxury materials and bespoke design elements",
          price: 65000,
          afterImage: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1000&auto=format&fit=crop",
          materials: [
            {
              id: 1,
              title: "Luxury Paint",
              description: "Premium designer paint with custom color matching"
            },
            {
              id: 2,
              title: "High-End Fixtures",
              description: "Luxury designer fixtures and custom hardware"
            }
          ],
          sections: [
            {
              id: 1,
              title: "Scope of Work",
              content: "Includes complete home transformation, luxury finishes, and custom design elements"
            },
            {
              id: 2,
              title: "Timeline",
              content: "Estimated completion time: 6-8 weeks"
            }
          ]
        }
      }
    ]

    const mockOperators: Operator[] = [
      { id: 1, type: 'or' },
      { id: 2, type: 'or' }
    ]

    setOptions(mockOptions)
    setOperators(mockOperators)
    setIsLoading(false)
  }, [])

  // Set up the event listeners for the carousel
  useEffect(() => {
    if (!carouselApi) return

    const handleSelect = () => {
      setCurrentIndex(carouselApi.selectedScrollSnap())
    }

    carouselApi.on("select", handleSelect)
    return () => {
      carouselApi.off("select", handleSelect)
    }
  }, [carouselApi])

  // Group options by "And" relationships
  const andGroups: Option[][] = []
  let currentGroup: Option[] = []

  options.forEach((option, index) => {
    currentGroup.push(option)
    if (index < operators.length && operators[index].type === 'or') {
      andGroups.push([...currentGroup])
      currentGroup = []
    }
  })
  if (currentGroup.length > 0) {
    andGroups.push(currentGroup)
  }

  // Calculate total price for each "And" group
  const andGroupTotals = andGroups.map(group => {
    const total = group.reduce((sum, option) => {
      return sum + (option.details?.price || 0)
    }, 0)
    return {
      options: group,
      total,
      monthlyPayment: calculateMonthlyPayment(total),
      allApproved: group.every(opt => opt.isApproved)
    }
  })

  // Get either before or after images for an option
  const getImagesByType = (option: Option, type: 'before' | 'after') => {
    if (type === 'before') {
      // Return beforeImages array if it exists, otherwise use single beforeImage
      return option.details?.beforeImages && option.details.beforeImages.length > 0
        ? option.details.beforeImages
        : option.details?.beforeImage 
          ? [option.details.beforeImage] 
          : [];
    } else {
      // Return afterImages array if it exists, otherwise use single afterImage
      return option.details?.afterImages && option.details.afterImages.length > 0
        ? option.details.afterImages
        : option.details?.afterImage 
          ? [option.details.afterImage] 
          : [];
    }
  };

  // Navigate to next image
  const nextImage = (optionId: number, type: 'before' | 'after') => {
    const images = getImagesByType(options.find(opt => opt.id === optionId)!, type);
    if (images.length <= 1) return;
    
    setCurrentImageIndices(prev => ({
      ...prev,
      [`${optionId}_${type}`]: (prev[`${optionId}_${type}`] || 0 + 1) % images.length
    }));
  };

  // Navigate to previous image
  const prevImage = (optionId: number, type: 'before' | 'after') => {
    const images = getImagesByType(options.find(opt => opt.id === optionId)!, type);
    if (images.length <= 1) return;
    
    setCurrentImageIndices(prev => ({
      ...prev,
      [`${optionId}_${type}`]: (prev[`${optionId}_${type}`] || 0 - 1 + images.length) % images.length
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Compare Packages</h1>
        
        <div className="relative">
          {/* Desktop View */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {andGroupTotals.map((group, index) => (
              <Card key={index} className={`${group.allApproved ? 'border-green-500' : ''}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Package {index + 1}</span>
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
                      <div key={opt.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{opt.content}</span>
                          {opt.isApproved && (
                            <Badge variant="secondary" className="text-[10px] font-normal bg-green-100 text-green-700">
                              Approved
                            </Badge>
                          )}
                        </div>
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
                                    <span className="text-blue-300">Before</span>
                                    {hasMultipleBeforeImages && (
                                      <span className="ml-2 text-white/80">
                                        {currentBeforeIndex + 1}/{beforeImages.length}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Navigation Arrows */}
                                  {hasMultipleBeforeImages && (
                                    <>
                                      <button
                                        onClick={() => prevImage(opt.id, 'before')}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                                        aria-label="Previous image"
                                      >
                                        ←
                                      </button>
                                      <button
                                        onClick={() => nextImage(opt.id, 'before')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                                        aria-label="Next image"
                                      >
                                        →
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
                                  
                                  {/* Navigation Arrows */}
                                  {hasMultipleAfterImages && (
                                    <>
                                      <button
                                        onClick={() => prevImage(opt.id, 'after')}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                                        aria-label="Previous image"
                                      >
                                        ←
                                      </button>
                                      <button
                                        onClick={() => nextImage(opt.id, 'after')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                                        aria-label="Next image"
                                      >
                                        →
                                      </button>
                                    </>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                        <p className="text-sm text-gray-600">{opt.details?.description}</p>
                      </div>
                    ))}
                    <div className="pt-4 border-t">
                      <div className="text-2xl font-bold">${group.total.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">
                        As low as ${group.monthlyPayment.toLocaleString()}/month
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Mobile Carousel View with Swipe */}
          <div className="md:hidden">
            <div className="relative overflow-hidden">
              <Carousel 
                opts={{
                  align: "start",
                  loop: true,
                  skipSnaps: false,
                  dragFree: false
                }}
                setApi={setCarouselApi}
                className="w-full"
              >
                <CarouselContent className="!-ml-0">
                  {andGroupTotals.map((group, index) => (
                    <CarouselItem key={index} className="!pl-0">
                      <div className="px-1">
                        <Card className={`${group.allApproved ? 'border-green-500 border-2' : ''} h-full`}>
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              <span>Package {index + 1}</span>
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
                                <div key={opt.id} className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{opt.content}</span>
                                    {opt.isApproved && (
                                      <Badge variant="secondary" className="text-[10px] font-normal bg-green-100 text-green-700">
                                        Approved
                                      </Badge>
                                    )}
                                  </div>
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
                                              <span className="text-blue-300">Before</span>
                                              {hasMultipleBeforeImages && (
                                                <span className="ml-2 text-white/80">
                                                  {currentBeforeIndex + 1}/{beforeImages.length}
                                                </span>
                                              )}
                                            </div>
                                            
                                            {/* Navigation Arrows */}
                                            {hasMultipleBeforeImages && (
                                              <>
                                                <button
                                                  onClick={() => prevImage(opt.id, 'before')}
                                                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                                                  aria-label="Previous image"
                                                >
                                                  ←
                                                </button>
                                                <button
                                                  onClick={() => nextImage(opt.id, 'before')}
                                                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                                                  aria-label="Next image"
                                                >
                                                  →
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
                                            
                                            {/* Navigation Arrows */}
                                            {hasMultipleAfterImages && (
                                              <>
                                                <button
                                                  onClick={() => prevImage(opt.id, 'after')}
                                                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                                                  aria-label="Previous image"
                                                >
                                                  ←
                                                </button>
                                                <button
                                                  onClick={() => nextImage(opt.id, 'after')}
                                                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                                                  aria-label="Next image"
                                                >
                                                  →
                                                </button>
                                              </>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  )}
                                  <p className="text-sm text-gray-600">{opt.details?.description}</p>
                                </div>
                              ))}
                              <div className="pt-4 border-t">
                                <div className="text-2xl font-bold">${group.total.toLocaleString()}</div>
                                <div className="text-sm text-gray-500">
                                  As low as ${group.monthlyPayment.toLocaleString()}/month
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>

            {/* Navigation controls below the carousel */}
            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="flex items-center justify-between w-full px-4 max-w-sm mx-auto">
                <button 
                  onClick={() => carouselApi?.scrollPrev()}
                  className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex gap-2">
                  {andGroupTotals.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        carouselApi?.scrollTo(index)
                        setCurrentIndex(index)
                      }}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentIndex ? 'bg-gray-900' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <button 
                  onClick={() => carouselApi?.scrollNext()}
                  className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 