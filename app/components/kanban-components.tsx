import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Trash2 } from 'lucide-react'
import Image from 'next/image'
import { calculateMonthlyPayment } from '@/app/utils/calculations'

interface DroppableColumnProps {
  id: string
  children: React.ReactNode
  title: string
  opportunities: {
    options: Option[]
    operators: Operator[]
    promotion?: {
      type: string
      discount: string
      validUntil: string
    }
  }[]
  onTitleClick?: () => void
  onDeleteClick?: () => void
  isEditing?: boolean
  editComponent?: React.ReactNode
}

interface DraggableOpportunityProps {
  id: string
  children: React.ReactElement<OpportunityCardProps>
}

interface Option {
  id: number
  content: string
  isComplete: boolean
  isApproved?: boolean
  title?: string
  description?: string
  price?: number
  finalPrice?: number
  afterImage?: string
  hasCalculations?: boolean
  showAsLowAsPrice?: boolean
  promotion?: {
    type: string
    discount: string
    validUntil: string
  }
  details?: {
    title: string
    description: string
    price: number
    finalPrice?: number
    afterImage: string
    address?: string
    priceRange?: {
      min: number
      max: number
    }
  }
}

interface Operator {
  id: number
  type: 'and' | 'or'
}

type DragHandleProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listeners: any
}

interface OpportunityCardProps {
  id: string
  title: string
  options: Option[]
  operators: Operator[]
  lastUpdated: string
  column: string
  onDelete: (id: string) => void
  isDraggable?: boolean
  dragHandleProps?: DragHandleProps
  packageNames?: { [key: number]: string }
  promotion?: {
    type: string
    discount: string
    validUntil: string
  }
}

export function DroppableColumn({ 
  id, 
  title, 
  opportunities, 
  isEditing, 
  editComponent, 
  onTitleClick, 
  onDeleteClick, 
  children 
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'column',
      column: id,
      opportunities
    }
  })

  const getColumnPriceRange = () => {
    if (!opportunities || opportunities.length === 0) return null

    let totalApprovedAmount = 0
    let totalMinPrice = 0
    let totalMaxPrice = 0
    let hasAnyOptions = false
    let hasOnlyApprovedOptions = true
    let hasAnyApprovedOptions = false
    let hasAnyDiscounts = false

    // Calculate total for each opportunity
    opportunities.forEach(opp => {
      const optionsWithPrices = opp.options.filter(option => {
        const hasPrice = option.details?.price || option.price;
        const hasFinalPrice = option.details?.finalPrice || option.finalPrice;
        return hasPrice || hasFinalPrice;
      })
      
      if (optionsWithPrices.length > 0) {
        hasAnyOptions = true
      }
      
      // Calculate discount if promotion exists
      const getDiscountedPrice = (option: Option) => {
        // First check if there's a finalPrice set
        if (option.finalPrice !== undefined) {
          hasAnyDiscounts = true;
          return option.finalPrice;
        }
        if (option.details?.finalPrice !== undefined) {
          hasAnyDiscounts = true;
          return option.details.finalPrice;
        }
        
        // Get the base price
        const basePrice = option.price || option.details?.price || 0;
        
        // Apply promotion discount if available
        if (opp.promotion) {
          hasAnyDiscounts = true;
          const discountValue = parseFloat(opp.promotion.discount.replace(/[^0-9.]/g, ''));
          const isPercentage = opp.promotion.discount.includes('%');
          if (isPercentage) {
            return basePrice * (1 - discountValue / 100);
          } else {
            return basePrice - discountValue;
          }
        }
        
        // Check for option-level promotion
        if (option.promotion) {
          hasAnyDiscounts = true;
          const discountValue = parseFloat(option.promotion.discount.replace(/[^0-9.]/g, ''));
          const isPercentage = option.promotion.discount.includes('%');
          if (isPercentage) {
            return basePrice * (1 - discountValue / 100);
          } else {
            return basePrice - discountValue;
          }
        }
        
        return basePrice;
      }
      
      // Get approved options
      const approvedOptions = optionsWithPrices.filter(option => option.isApproved)
      const approvedTotal = approvedOptions.reduce((sum, option) => sum + getDiscountedPrice(option), 0)
      
      // If this opportunity has any approved options
      if (approvedOptions.length > 0) {
        hasAnyApprovedOptions = true
        totalApprovedAmount += approvedTotal
        totalMinPrice += approvedTotal
        totalMaxPrice += approvedTotal
        return // Skip processing non-approved options for this opportunity
      }
      
      // If we get here, this opportunity has no approved options
      hasOnlyApprovedOptions = false
      
      // Process non-approved options
      const nonApprovedOptions = optionsWithPrices.filter(option => !option.isApproved)
      
      if (nonApprovedOptions.length > 0) {
        const andGroups: Option[][] = []
        let currentGroup: Option[] = []

        nonApprovedOptions.forEach((option, index) => {
          currentGroup.push(option)
          if (index < opp.operators.length && opp.operators[index]?.type === 'or') {
            andGroups.push([...currentGroup])
            currentGroup = []
          }
        })
        if (currentGroup.length > 0) {
          andGroups.push(currentGroup)
        }

        const andGroupTotals = andGroups.map(group => {
          return group.reduce((sum, option) => sum + getDiscountedPrice(option), 0)
        })

        const minGroupTotal = Math.min(...andGroupTotals)
        const maxGroupTotal = Math.max(...andGroupTotals)
        
        totalMinPrice += minGroupTotal
        totalMaxPrice += maxGroupTotal
      }
    })

    if (!hasAnyOptions) return null

    // Format the display strings
    const formatPrice = (price: number) => `$${Math.round(price).toLocaleString()}`

    // If all opportunities with prices have approved options, only show the approved amount in the main display
    if (hasOnlyApprovedOptions && hasAnyApprovedOptions) {
      return {
        mainDisplay: formatPrice(totalApprovedAmount),
        originalDisplay: hasAnyDiscounts ? formatPrice(totalApprovedAmount / 0.9) : null,
        hasDiscount: hasAnyDiscounts
      }
    }

    // Return both displays for mixed approved/non-approved scenarios
    return {
      mainDisplay: totalMinPrice === totalMaxPrice 
        ? formatPrice(totalMinPrice)
        : `${formatPrice(totalMinPrice)} - ${formatPrice(totalMaxPrice)}`,
      originalDisplay: hasAnyDiscounts ? (totalMinPrice === totalMaxPrice 
        ? formatPrice(totalMinPrice / 0.9)
        : `${formatPrice(totalMinPrice / 0.9)} - ${formatPrice(totalMaxPrice / 0.9)}`) : null,
      hasDiscount: hasAnyDiscounts
    }
  }

  const priceRange = getColumnPriceRange()

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col h-full rounded-lg p-4",
        "bg-card",
        isOver && "bg-muted"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isEditing ? (
            editComponent
          ) : (
            <h3 
              className="text-sm font-medium text-foreground cursor-pointer hover:text-muted-foreground"
              onClick={onTitleClick}
            >
              {title}
            </h3>
          )}
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {opportunities.length}
          </span>
        </div>
        {onDeleteClick && (
          <button
            onClick={onDeleteClick}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {priceRange && (
        <div className={cn(
          "text-sm font-medium mb-4 flex flex-col items-end",
          title === "In Progress" && "text-green-600"
        )}>
          {priceRange.originalDisplay && (
            <span className="text-xs text-muted-foreground line-through">
              {priceRange.originalDisplay}
            </span>
          )}
          <span className="text-foreground">
            {priceRange.mainDisplay}
          </span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

export function DraggableOpportunity({ id, children }: DraggableOpportunityProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver
  } = useSortable({
    id,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 1 : 0
  }

  return (
    <div ref={setNodeRef} style={style}>
      {isOver && (
        <div className="absolute inset-0 bg-muted border-2 border-accent rounded-lg pointer-events-none" />
      )}
      <div className={`${isDragging ? 'shadow-lg' : ''}`}>
        {React.cloneElement(children, {
          dragHandleProps: { attributes, listeners }
        })}
      </div>
    </div>
  )
}

export function OpportunityCard({ 
  id, 
  title, 
  options,
  operators,
  lastUpdated, 
  column, 
  onDelete,
  isDraggable = false,
  dragHandleProps,
  packageNames,
  promotion
}: OpportunityCardProps) {
  const router = useRouter()

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    router.push(`/opportunity/${id}`)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete(id)
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/opportunity/${id}`)
  }

  // Calculate days in stage
  const calculateDaysInStage = () => {
    const lastUpdatedDate = new Date(lastUpdated)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - lastUpdatedDate.getTime()) / (1000 * 60 * 60 * 24))
    return diffInDays
  }

  // Get unique packages and their prices
  const packages = options.reduce((acc: { name: string; price: number; finalPrice: number; isApproved: boolean }[], option) => {
    const price = option.price || option.details?.price || 0;
    const title = option.title || option.details?.title || '';
    
    if (price && title) {
      // Calculate the discounted price if promotion exists
      let finalPrice = option.finalPrice;
      if (finalPrice === undefined) {
        finalPrice = option.details?.finalPrice;
      }
      
      // If no finalPrice is set but we have a promotion, calculate it
      if (finalPrice === undefined && promotion) {
        const basePrice = price;
        const discountValue = parseFloat(promotion.discount.replace(/[^0-9.]/g, ''));
        const isPercentage = promotion.discount.includes('%');
        finalPrice = isPercentage 
          ? basePrice * (1 - discountValue / 100)
          : basePrice - discountValue;
      } else if (finalPrice === undefined) {
        finalPrice = price;
      }

      acc.push({
        name: title,
        price,
        finalPrice,
        isApproved: option.isApproved || false
      });
    }
    return acc;
  }, []);

  // Calculate price range and total approved
  const getPriceInfo = () => {
    if (packages.length === 0) return null

    const approvedPackages = packages.filter(pkg => pkg.isApproved)
    
    // Make sure to use finalPrice which already has discounts applied
    const approvedTotal = approvedPackages.reduce((sum, pkg) => sum + pkg.finalPrice, 0)

    if (approvedPackages.length > 0) {
      return {
        display: `$${Math.round(approvedTotal).toLocaleString()}`,
        originalDisplay: promotion ? `$${Math.round(approvedPackages.reduce((sum, pkg) => sum + pkg.price, 0)).toLocaleString()}` : null,
        isApproved: true,
        hasDiscount: !!promotion
      }
    }

    // For non-approved packages, use finalPrice which already includes any discounts
    const prices = packages.map(pkg => pkg.finalPrice)
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
    
    // Get original prices for strikethrough display
    const originalPrices = packages.map(pkg => pkg.price)
    const originalMinPrice = originalPrices.length > 0 ? Math.min(...originalPrices) : 0
    const originalMaxPrice = originalPrices.length > 0 ? Math.max(...originalPrices) : 0
    
    return {
      display: minPrice === maxPrice 
        ? `$${Math.round(minPrice).toLocaleString()}`
        : `$${Math.round(minPrice).toLocaleString()} - $${Math.round(maxPrice).toLocaleString()}`,
      originalDisplay: promotion ? (originalMinPrice === originalMaxPrice
        ? `$${Math.round(originalMinPrice).toLocaleString()}`
        : `$${Math.round(originalMinPrice).toLocaleString()} - $${Math.round(originalMaxPrice).toLocaleString()}`
      ) : null,
      isApproved: false,
      hasDiscount: !!promotion
    }
  }

  const priceInfo = getPriceInfo()

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      className={`group relative rounded-lg border p-4 transition-all ${
        isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${dragHandleProps?.listeners ? 'touch-none' : ''}
      bg-card shadow-sm hover:shadow-md border-border/40 hover:border-border/60`}
      {...(isDraggable && dragHandleProps ? {
        ...dragHandleProps.attributes,
        ...dragHandleProps.listeners,
        onPointerDown: (e: React.PointerEvent) => {
          if ((e.target as HTMLElement).closest('.action-button')) {
            return
          }
          dragHandleProps.listeners.onPointerDown(e)
        }
      } : {})}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-foreground truncate">
            {title}
          </h3>
          <div className="mt-1 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-medium bg-muted/50">
                {column}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Last updated {new Date(lastUpdated).toLocaleDateString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Days in stage: {calculateDaysInStage()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleEditClick}
            className="action-button text-foreground/50 hover:text-blue-500 transition-colors p-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={handleDeleteClick}
            className="action-button text-foreground/50 hover:text-red-500 transition-colors p-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      {options.length > 0 ? (
        <div className="mt-3 space-y-3">
          {/* Package Information */}
          {options.map((option, index) => (
            <div key={option.id} className={cn(
              "flex items-center justify-between text-sm",
              index > 0 && "pt-2 border-t border-border/40"
            )}>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium truncate flex items-center gap-2">
                  {option.details?.title || option.content || `Package ${index + 1}`}
                  {option.isApproved && (
                    <Badge variant="secondary" className="text-[10px] font-normal bg-green-100 text-green-700">
                      Approved
                    </Badge>
                  )}
                  {option.promotion && (
                    <Badge variant="secondary" className="text-[10px] font-normal bg-purple-100 text-purple-700">
                      {option.promotion.type}
                    </Badge>
                  )}
                </h3>
              </div>
              <div className="flex-shrink-0 text-right">
                {option.promotion ? (
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground line-through">
                      ${(option.price || option.details?.price || 0).toLocaleString()}
                    </span>
                    <div className="text-sm font-medium">
                      ${Math.round(
                        option.finalPrice || 
                        option.details?.finalPrice || 
                        calculateDiscountedPrice(option)
                      ).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm font-medium">
                    ${(option.price || option.details?.price || 0).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Price Range - Only show if there's more than one option */}
          {options.length > 1 && (
            <div className="flex items-center justify-between text-sm pt-2 border-t border-border/40">
              <span className="text-muted-foreground">Price Range</span>
              <div className="text-right">
                {(() => {
                  const prices = options.map(opt => 
                    opt.finalPrice || 
                    opt.details?.finalPrice || 
                    (opt.promotion ? calculateDiscountedPrice(opt) : (opt.price || opt.details?.price || 0))
                  );
                  const minPrice = Math.min(...prices);
                  const maxPrice = Math.max(...prices);
                  
                  return (
                    <div className="font-medium">
                      {minPrice === maxPrice ? (
                        `$${minPrice.toLocaleString()}`
                      ) : (
                        `$${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}`
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-2 text-xs text-foreground/60 italic">No packages added</p>
      )}
    </div>
  )
}

// Helper function to calculate discounted price
function calculateDiscountedPrice(option: Option): number {
  const basePrice = option.price || option.details?.price || 0;
  if (!option.promotion) return basePrice;

  const discountValue = parseFloat(option.promotion.discount.replace(/[^0-9.]/g, ''));
  const isPercentage = option.promotion.discount.includes('%');
  
  return isPercentage 
    ? basePrice * (1 - discountValue / 100)
    : basePrice - discountValue;
} 