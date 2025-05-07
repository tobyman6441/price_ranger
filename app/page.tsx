'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import Image from "next/image"
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { DroppableColumn, DraggableOpportunity, OpportunityCard } from './components/kanban-components'
import { ColumnDeleteDialog } from './components/column-delete-dialog'
import { OpportunityDeleteDialog } from './components/opportunity-delete-dialog'
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Filter } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { SaveTemplateDialog } from './components/save-template-dialog'
import type { OpportunityCardProps } from '@/app/components/OpportunityCard'
import { MergeOpportunityDialog } from './components/merge-opportunity-dialog'

interface Column {
  id: string
  title: string
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

interface Opportunity {
  id: string
  title: string
  options: Option[]
  operators: Operator[]
  lastUpdated: string
  column: string
  promotion?: {
    type: string
    discount: string
    validUntil: string
  }
  packageNames: string[]
}

const initialColumns: Column[] = [
  { id: 'drafts', title: 'Drafts' },
  { id: 'presented', title: 'Presented' },
  { id: 'approved', title: 'Approved' }
]

export default function KanbanView() {
  const router = useRouter()
  const [columns, setColumns] = useState<Column[]>(initialColumns)
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState("")
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
  const [editingColumnName, setEditingColumnName] = useState("")
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [viewMode, setViewMode] = useState<'kanban' | 'grid'>('kanban')
  const [columnToDelete, setColumnToDelete] = useState<{ id: string; title: string } | null>(null)
  const [opportunityToDelete, setOpportunityToDelete] = useState<{ id: string; title: string } | null>(null)
  const [activeDraggedOpportunity, setActiveDraggedOpportunity] = useState<Opportunity | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({})
  const [filters, setFilters] = useState<{ status: string[]; lastUpdated: string; options: { min?: number; max?: number } }>({
    status: [],
    lastUpdated: 'today',
    options: {}
  })
  const [sortBy, setSortBy] = useState('price-asc')
  const [isAddingOpportunity, setIsAddingOpportunity] = useState(false)
  const [isEditingOpportunity, setIsEditingOpportunity] = useState<string | null>(null)
  const [templates, setTemplates] = useState<{ id: string; name: string; data: Opportunity }[]>([])
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false)
  const [sourceOpportunity, setSourceOpportunity] = useState<{ id: string; title: string } | null>(null)
  const [targetOpportunity, setTargetOpportunity] = useState<{ id: string; title: string } | null>(null)
  const [isMergeMode, setIsMergeMode] = useState(false)

  useEffect(() => {
    // Check if we're on a mobile device
    const isMobile = window.innerWidth < 640 // 640px is the sm breakpoint in Tailwind
    if (isMobile) {
      setViewMode('grid')
    }
  }, [])

  // Filter opportunities based on search query
  const filteredOpportunities = opportunities.filter(opportunity => {
    // Search query filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = (
        opportunity.title.toLowerCase().includes(searchLower) ||
        opportunity.options.some(option => 
          option.content.toLowerCase().includes(searchLower) ||
          option.details?.title.toLowerCase().includes(searchLower) ||
          option.details?.description.toLowerCase().includes(searchLower) ||
          option.details?.address?.toLowerCase().includes(searchLower)
        ) ||
        opportunity.column.toLowerCase().includes(searchLower)
      )
      if (!matchesSearch) return false
    }

    // Price range filter
    if (priceRange.min !== undefined || priceRange.max !== undefined) {
      // Apply promotion to price if available
      const applyPromotion = (price: number, promotion: any) => {
        if (!promotion) return price;
        const discountValue = parseFloat(promotion.discount.replace(/[^0-9.]/g, ''));
        const isPercentage = promotion.discount.includes('%');
        return isPercentage ? price * (1 - discountValue / 100) : price - discountValue;
      }
      
      const opportunityPrice = opportunity.options.reduce((sum, option) => {
        if (option.isApproved) {
          let price = option.finalPrice || option.details?.finalPrice || option.details?.price || option.price || 0;
          // Apply promotion discount if no finalPrice is set
          if (option.finalPrice === undefined && option.details?.finalPrice === undefined && opportunity.promotion) {
            price = applyPromotion(price, opportunity.promotion);
          }
          return sum + price;
        }
        return sum;
      }, 0)

      if (priceRange.min !== undefined && opportunityPrice < priceRange.min) return false
      if (priceRange.max !== undefined && opportunityPrice > priceRange.max) return false
    }

    // Status filter
    if (filters.status.length > 0) {
      const hasApproved = opportunity.options.some(opt => opt.isApproved)
      const hasPending = opportunity.options.some(opt => !opt.isApproved && opt.isComplete)
      
      if (filters.status.includes('approved') && !hasApproved) return false
      if (filters.status.includes('pending') && !hasPending) return false
    }

    // Last updated filter
    if (filters.lastUpdated !== 'all') {
      const lastUpdated = new Date(opportunity.lastUpdated)
      const now = new Date()
      const diffInDays = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24))

      switch (filters.lastUpdated) {
        case 'today':
          if (diffInDays > 1) return false
          break
        case 'week':
          if (diffInDays > 7) return false
          break
        case 'month':
          if (diffInDays > 30) return false
          break
      }
    }

    // Number of options filter
    if (filters.options.min !== undefined && opportunity.options.length < filters.options.min) return false
    if (filters.options.max !== undefined && opportunity.options.length > filters.options.max) return false

    return true
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-asc': {
        const priceA = a.options.reduce((sum, opt) => {
          const price = opt.finalPrice || opt.details?.finalPrice || opt.details?.price || opt.price || 0;
          return sum + price;
        }, 0)
        const priceB = b.options.reduce((sum, opt) => {
          const price = opt.finalPrice || opt.details?.finalPrice || opt.details?.price || opt.price || 0;
          return sum + price;
        }, 0)
        return priceA - priceB
      }
      case 'price-desc': {
        const priceA = a.options.reduce((sum, opt) => {
          const price = opt.finalPrice || opt.details?.finalPrice || opt.details?.price || opt.price || 0;
          return sum + price;
        }, 0)
        const priceB = b.options.reduce((sum, opt) => {
          const price = opt.finalPrice || opt.details?.finalPrice || opt.details?.price || opt.price || 0;
          return sum + price;
        }, 0)
        return priceB - priceA
      }
      case 'date-asc':
        return new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()
      case 'date-desc':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      case 'options-asc':
        return a.options.length - b.options.length
      case 'options-desc':
        return b.options.length - a.options.length
      default:
        return 0
    }
  })

  useEffect(() => {
    // Load opportunities from localStorage when the component mounts
    const loadedOpportunities = JSON.parse(localStorage.getItem('opportunities') || '[]')
    setOpportunities(loadedOpportunities)

    // Load columns from localStorage, fallback to initialColumns if none exist
    const savedColumns = localStorage.getItem('columns')
    if (savedColumns) {
      const parsedColumns = JSON.parse(savedColumns)
      
      // Fix for "Presented to customer" -> "Presented"
      const updatedColumns = parsedColumns.map((col: Column) => {
        if (col.id === 'presented' && col.title !== 'Presented') {
          return { ...col, title: 'Presented' }
        }
        return col
      })
      
      // Check if we made any changes
      if (JSON.stringify(parsedColumns) !== JSON.stringify(updatedColumns)) {
        localStorage.setItem('columns', JSON.stringify(updatedColumns))
      }
      
      setColumns(updatedColumns)
    } else {
      // If no columns exist in localStorage, save initialColumns
      localStorage.setItem('columns', JSON.stringify(initialColumns))
    }
  }, [])

  // Apply promotion discounts to ALL opportunities in the state
  useEffect(() => {
    if (opportunities.length > 0) {
      const updatedOpportunities = opportunities.map(opportunity => {
        // Get the options with calculated finalPrice based on promotion
        const updatedOptions = opportunity.options.map(option => {
          const basePrice = option.price || option.details?.price || 0;
          
          // If there's no base price, just return the original option
          if (basePrice <= 0) return option;
          
          // If there's a promotion, calculate the discounted price
          if (opportunity.promotion) {
            const discountValue = parseFloat(opportunity.promotion.discount.replace(/[^0-9.]/g, ''));
            const isPercentage = opportunity.promotion.discount.includes('%');
            const discountedPrice = isPercentage 
              ? basePrice * (1 - discountValue / 100)
              : basePrice - discountValue;
            
            return {
              ...option,
              finalPrice: discountedPrice,
              details: option.details ? {
                ...option.details,
                finalPrice: option.details.price ? 
                  (isPercentage ? option.details.price * (1 - discountValue / 100) : option.details.price - discountValue) : 
                  undefined
              } : option.details
            };
          } 
          // If there's no promotion but finalPrice exists, it might be from a removed promotion
          // Ensure we clear finalPrice if there's no promotion
          else if (option.finalPrice !== undefined || (option.details?.finalPrice !== undefined)) {
            return {
              ...option,
              finalPrice: undefined,
              details: option.details ? {
                ...option.details,
                finalPrice: undefined
              } : option.details
            };
          }
          
          // Otherwise return the original option
          return option;
        });
        
        return {
          ...opportunity,
          options: updatedOptions
        };
      });
      
      setOpportunities(updatedOpportunities);
    }
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const draggedOpportunity = opportunities.find(opp => opp.id === active.id)
    if (draggedOpportunity) {
      setActiveDraggedOpportunity(draggedOpportunity)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const activeOpportunity = opportunities.find(opp => opp.id === active.id)
    if (!activeOpportunity) return

    // Check if dropping into a column
    const overData = over.data?.current
    if (overData?.type === 'column') {
      const targetColumnId = overData.column
      if (activeOpportunity.column !== targetColumnId) {
        const updatedOpportunities = opportunities.map(opp => 
          opp.id === active.id 
            ? { ...opp, column: targetColumnId }
            : opp
        )
        setOpportunities(updatedOpportunities)
        localStorage.setItem('opportunities', JSON.stringify(updatedOpportunities))
      }
      return
    }

    // Handle sorting within the same column
    if (active.id !== over.id) {
      const oldIndex = opportunities.findIndex(opp => opp.id === active.id)
      const newIndex = opportunities.findIndex(opp => opp.id === over.id)
      
      const updatedOpportunities = arrayMove(opportunities, oldIndex, newIndex)
      setOpportunities(updatedOpportunities)
      localStorage.setItem('opportunities', JSON.stringify(updatedOpportunities))
    }
  }

  const handleColumnRename = (columnId: string, newTitle: string) => {
    const updatedColumns = columns.map(col =>
      col.id === columnId
        ? { ...col, title: newTitle }
        : col
    )
    setColumns(updatedColumns)
    // Save to localStorage
    localStorage.setItem('columns', JSON.stringify(updatedColumns))
    toast.success('Column renamed')
  }

  function handleAddColumn() {
    if (newColumnName.trim()) {
      const newColumn: Column = {
        id: newColumnName.trim().toLowerCase().replace(/\s+/g, '-'),
        title: newColumnName.trim()
      }
      const updatedColumns = [...columns, newColumn]
      setColumns(updatedColumns)
      // Save to localStorage
      localStorage.setItem('columns', JSON.stringify(updatedColumns))
      setNewColumnName("")
      setIsAddingColumn(false)
      toast.success('Column added')
    }
  }

  function handleDeleteColumn(columnId: string) {
    const column = columns.find(col => col.id === columnId)
    if (column) {
      setColumnToDelete({ id: columnId, title: column.title })
    }
  }

  function confirmDeleteColumn() {
    if (columnToDelete) {
      const updatedColumns = columns.filter(col => col.id !== columnToDelete.id)
      setColumns(updatedColumns)
      // Save to localStorage
      localStorage.setItem('columns', JSON.stringify(updatedColumns))
      
      // Update any opportunities in the deleted column to move to 'drafts'
      const updatedOpportunities = opportunities.map(opp => 
        opp.column === columnToDelete.id 
          ? { ...opp, column: 'drafts' }
          : opp
      )
      setOpportunities(updatedOpportunities)
      localStorage.setItem('opportunities', JSON.stringify(updatedOpportunities))
      
      setColumnToDelete(null)
      toast.success('Column deleted')
    }
  }

  function handleKeyPress(e: React.KeyboardEvent, type: 'add' | 'edit') {
    if (e.key === 'Enter') {
      if (type === 'add') {
        handleAddColumn()
      }
    } else if (e.key === 'Escape') {
      if (type === 'add') {
        setIsAddingColumn(false)
        setNewColumnName("")
      }
    }
  }

  const handleAddOpportunity = () => {
    router.push('/new-opportunity')
  }

  const handleDeleteOpportunity = (id: string) => {
    const opportunity = opportunities.find(opp => opp.id === id)
    if (opportunity) {
      setOpportunityToDelete({ id, title: opportunity.title })
    }
  }

  const confirmDeleteOpportunity = () => {
    if (opportunityToDelete) {
      const updatedOpportunities = opportunities.filter(opp => opp.id !== opportunityToDelete.id)
      setOpportunities(updatedOpportunities)
      localStorage.setItem('opportunities', JSON.stringify(updatedOpportunities))
      setOpportunityToDelete(null)
      toast.success('Opportunity deleted')
    }
  }

  const handleCreateBlankOpportunity = () => {
    const newId = Math.random().toString(36).substr(2, 9)
    const opportunityData = {
      id: newId,
      title: "New Opportunity",
      options: [],
      operators: [],
      lastUpdated: new Date().toISOString(),
      column: "drafts",
      packageNames: []
    }

    // Get existing opportunities
    const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]')
    
    // Add new opportunity
    opportunities.push(opportunityData)
    
    // Save to localStorage
    localStorage.setItem('opportunities', JSON.stringify(opportunities))
    
    // Navigate to the opportunity page
    router.push(`/opportunity/${newId}`)
  }

  const handleGuidedEstimateWithHover = () => {
    // Create a new opportunity
    const newId = Math.random().toString(36).substr(2, 9)
    const opportunityData = {
      id: newId,
      title: "Guided Hover Estimate",
      options: [],
      operators: [],
      lastUpdated: new Date().toISOString(),
      column: "drafts",
      packageNames: []
    }

    // Get existing opportunities
    const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]')
    
    // Add new opportunity
    opportunities.push(opportunityData)
    
    // Save to localStorage
    localStorage.setItem('opportunities', JSON.stringify(opportunities))
    
    // Navigate to the guided estimate workflow with the opportunity ID
    router.push(`/guided-estimate?id=${newId}`)
  }

  const handleSaveTemplate = (templateName: string, opportunity: Opportunity, existingTemplateId?: string) => {
    if (existingTemplateId) {
      // Update existing template
      const updatedTemplates = templates.map(template => 
        template.id === existingTemplateId
          ? { ...template, name: templateName, data: opportunity }
          : template
      )
      setTemplates(updatedTemplates)
      toast.success('Template updated successfully')
    } else {
      // Create new template
      const newTemplate = {
        id: Math.random().toString(36).substr(2, 9),
        name: templateName,
        data: opportunity
      }
      setTemplates([...templates, newTemplate])
      toast.success('Template saved successfully')
    }
  }

  const handleCreateFromTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    const newId = Math.random().toString(36).substr(2, 9)
    const opportunityData = {
      ...template.data,
      id: newId,
      title: `New ${template.name}`,
      lastUpdated: new Date().toISOString(),
      column: "drafts",
      packageNames: []
    }

    // Get existing opportunities
    const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]')
    
    // Add new opportunity
    opportunities.push(opportunityData)
    
    // Save to localStorage
    localStorage.setItem('opportunities', JSON.stringify(opportunities))
    
    // Navigate to the opportunity page
    router.push(`/opportunity/${newId}`)
  }

  const handleSignOut = () => {
    try {
      localStorage.removeItem('user')
      toast.success('Successfully logged out')
      // router.push('/login')
      // router.refresh()
    } catch (error) {
      toast.error('Error signing out')
      console.error('Error:', error)
    }
  }

  const handleMergeOpportunity = (id: string) => {
    const opportunity = opportunities.find(opp => opp.id === id)
    if (!opportunity) return

    if (!sourceOpportunity) {
      setSourceOpportunity({ id: opportunity.id, title: opportunity.title })
      toast.success('Select the opportunity to merge into')
    } else {
      setTargetOpportunity({ id: opportunity.id, title: opportunity.title })
      setMergeDialogOpen(true)
    }
  }

  const handleMergeConfirm = (sourceId: string, targetId: string) => {
    const sourceOpp = opportunities.find(opp => opp.id === sourceId)
    const targetOpp = opportunities.find(opp => opp.id === targetId)

    if (!sourceOpp || !targetOpp) return

    // Merge options from source into target
    const mergedOptions = [...targetOpp.options, ...sourceOpp.options]
    
    // Merge operators from source into target
    const mergedOperators = [...new Set([...targetOpp.operators, ...sourceOpp.operators])]
    
    // Merge package names from source into target
    const mergedPackageNames = {
      ...targetOpp.packageNames,
      ...sourceOpp.packageNames
    }

    // Create merged opportunity
    const mergedOpportunity = {
      ...targetOpp,
      options: mergedOptions,
      operators: mergedOperators,
      packageNames: mergedPackageNames,
      lastUpdated: new Date().toISOString()
    }

    // Update opportunities
    const updatedOpportunities = opportunities
      .filter(opp => opp.id !== sourceId && opp.id !== targetId)
      .concat(mergedOpportunity)

    setOpportunities(updatedOpportunities)
    localStorage.setItem('opportunities', JSON.stringify(updatedOpportunities))

    // Reset merge state
    setSourceOpportunity(null)
    setTargetOpportunity(null)
    setMergeDialogOpen(false)
    setIsMergeMode(false)

    toast.success('Opportunities merged successfully')
  }

  return (
    <main className={`container mx-auto p-4 h-screen flex flex-col`}>
      <nav className="flex flex-row items-center justify-end mb-4 sm:mb-8 gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-accent flex items-center justify-center hover:bg-accent/80 transition-colors">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => router.push('/team')}>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Manage team
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/connect-hover')}>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Connect Hover account
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <span className="flex items-center gap-2 text-red-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log out
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-8 gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 w-full sm:w-auto">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Kanban View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setIsMergeMode(!isMergeMode)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                isMergeMode
                  ? 'bg-purple-500 text-white hover:bg-purple-600'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {isMergeMode ? 'Cancel Merge' : 'Merge Opportunities'}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 text-xs sm:text-sm">
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                  Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Price Range</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={priceRange.min || ''}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value ? Number(e.target.value) : undefined }))}
                        className="w-24 sm:w-24"
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={priceRange.max || ''}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value ? Number(e.target.value) : undefined }))}
                        className="w-24 sm:w-24"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="approved"
                          checked={filters.status.includes('approved')}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              status: checked
                                ? [...prev.status, 'approved']
                                : prev.status.filter(s => s !== 'approved')
                            }))
                          }}
                        />
                        <Label htmlFor="approved" className="text-xs sm:text-sm">Approved</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="pending"
                          checked={filters.status.includes('pending')}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              status: checked
                                ? [...prev.status, 'pending']
                                : prev.status.filter(s => s !== 'pending')
                            }))
                          }}
                        />
                        <Label htmlFor="pending" className="text-xs sm:text-sm">Pending</Label>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Last Updated</Label>
                    <Select
                      value={filters.lastUpdated}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, lastUpdated: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select time range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Last 7 days</SelectItem>
                        <SelectItem value="month">Last 30 days</SelectItem>
                        <SelectItem value="all">All time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Number of Options</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.options.min || ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          options: { ...prev.options, min: e.target.value ? Number(e.target.value) : undefined }
                        }))}
                        className="w-24 sm:w-24"
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.options.max || ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          options: { ...prev.options, max: e.target.value ? Number(e.target.value) : undefined }
                        }))}
                        className="w-24 sm:w-24"
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Select
              value={sortBy}
              onValueChange={setSortBy}
            >
              <SelectTrigger className="w-[180px] sm:w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="date-asc">Date: Oldest First</SelectItem>
                <SelectItem value="date-desc">Date: Newest First</SelectItem>
                <SelectItem value="options-asc">Options: Low to High</SelectItem>
                <SelectItem value="options-desc">Options: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="px-3 sm:px-4 py-2 bg-accent text-accent-foreground text-xs sm:text-sm font-medium rounded-lg hover:bg-accent/80 transition-colors inline-flex items-center gap-2 w-full sm:w-auto justify-center"
              ref={(node) => {
                if (node) {
                  node.addEventListener('click', () => {
                    document.documentElement.style.setProperty('--trigger-width', `${node.getBoundingClientRect().width}px`);
                  });
                }
              }}
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Opportunity</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" sideOffset={5} className="w-[var(--trigger-width)]">
            <DropdownMenuItem onClick={handleCreateBlankOpportunity}>
              + Blank opportunity
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/new-opportunity')}>
              Select from template
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleGuidedEstimateWithHover}>
              Guided estimate with Hover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {viewMode === 'kanban' ? (
        <DndContext 
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd} 
        >
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 overflow-x-auto sm:overflow-x-auto overflow-y-auto sm:overflow-y-hidden h-[calc(100vh-16rem)] sm:h-[calc(100vh-12rem)]">
            {columns.map((column) => (
              <div key={column.id} className="flex-shrink-0 w-full sm:w-[280px] sm:w-[300px]">
                <DroppableColumn 
                  id={column.id}
                  title={column.title}
                  opportunities={filteredOpportunities.filter(opp => opp.column === column.id)}
                  isEditing={editingColumnId === column.id}
                  editComponent={
                    <input
                      type="text"
                      value={editingColumnName}
                      onChange={(e) => setEditingColumnName(e.target.value)}
                      onBlur={() => {
                        if (editingColumnName.trim()) {
                          handleColumnRename(column.id, editingColumnName.trim())
                        }
                        setEditingColumnId(null)
                        setEditingColumnName('')
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && editingColumnName.trim()) {
                          handleColumnRename(column.id, editingColumnName.trim())
                          setEditingColumnId(null)
                          setEditingColumnName('')
                        }
                      }}
                      className="text-xs sm:text-sm font-medium bg-transparent border-b-2 border-gray-200 focus:border-gray-400 outline-none px-1"
                      autoFocus
                    />
                  }
                  onTitleClick={() => {
                    setEditingColumnId(column.id)
                    setEditingColumnName(column.title)
                  }}
                  onDeleteClick={() => handleDeleteColumn(column.id)}
                >
                  <div className="space-y-2 sm:space-y-4">
                    <SortableContext 
                      items={filteredOpportunities.filter(opp => opp.column === column.id).map(opp => opp.id)} 
                      strategy={verticalListSortingStrategy}
                    >
                      {filteredOpportunities
                        .filter(opportunity => opportunity.column === column.id)
                        .map((opportunity) => {
                          return (
                            <DraggableOpportunity key={opportunity.id} id={opportunity.id}>
                              <OpportunityCard
                                id={opportunity.id}
                                title={opportunity.title}
                                options={opportunity.options}
                                operators={opportunity.operators}
                                lastUpdated={opportunity.lastUpdated}
                                column={column.title}
                                onDelete={handleDeleteOpportunity}
                                onMerge={isMergeMode ? handleMergeOpportunity : undefined}
                                isDraggable={!isMergeMode}
                                promotion={opportunity.promotion}
                                packageNames={opportunity.packageNames}
                                isSelected={isMergeMode && (sourceOpportunity?.id === opportunity.id || targetOpportunity?.id === opportunity.id)}
                              />
                            </DraggableOpportunity>
                          )
                        })}
                    </SortableContext>
                  </div>
                </DroppableColumn>
              </div>
            ))}

            <div className="flex-shrink-0 w-full sm:w-[280px] sm:w-[300px]">
              {isAddingColumn ? (
                <div className="flex flex-col h-full rounded-lg p-4 bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <input
                      type="text"
                      placeholder="Enter column name..."
                      className="h-7 w-full px-2 rounded border border-border focus:outline-none focus:ring-2 focus:ring-accent font-medium text-xs sm:text-sm bg-muted"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      onKeyDown={(e) => handleKeyPress(e, 'add')}
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddColumn}
                      className="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-xs"
                    >
                      Add Column
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingColumn(false)
                        setNewColumnName("")
                      }}
                      className="px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingColumn(true)}
                  className="flex flex-col h-full rounded-lg p-4 bg-card border border-border hover:border-border/80 transition-colors w-full items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <span className="flex items-center gap-1.5 text-xs font-medium">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Column
                  </span>
                </button>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeDraggedOpportunity && (
              <div className="transform scale-105 shadow-lg">
                <OpportunityCard
                  id={activeDraggedOpportunity.id}
                  title={activeDraggedOpportunity.title}
                  options={activeDraggedOpportunity.options}
                  operators={activeDraggedOpportunity.operators}
                  lastUpdated={activeDraggedOpportunity.lastUpdated}
                  column={columns.find(col => col.id === activeDraggedOpportunity.column)?.title || ''}
                  onDelete={handleDeleteOpportunity}
                  onMerge={isMergeMode ? handleMergeOpportunity : undefined}
                  isDraggable={!isMergeMode}
                  promotion={activeDraggedOpportunity.promotion}
                  packageNames={activeDraggedOpportunity.packageNames}
                  isSelected={isMergeMode && (sourceOpportunity?.id === activeDraggedOpportunity.id || targetOpportunity?.id === activeDraggedOpportunity.id)}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          {filteredOpportunities.map(opportunity => {
            const column = columns.find(col => col.id === opportunity.column)
            
            return (
              <OpportunityCard
                key={opportunity.id}
                id={opportunity.id}
                title={opportunity.title}
                options={opportunity.options}
                operators={opportunity.operators}
                lastUpdated={opportunity.lastUpdated}
                column={column?.title || opportunity.column}
                onDelete={handleDeleteOpportunity}
                isDraggable={false}
                promotion={opportunity.promotion}
                packageNames={opportunity.packageNames}
              />
            )
          })}

          {filteredOpportunities.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-8 sm:py-12 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mb-4 rounded-full bg-accent flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-foreground">No opportunities yet</h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Get started by creating a new sales opportunity.</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="mt-4 px-3 sm:px-4 py-2 bg-accent text-accent-foreground text-xs sm:text-sm font-medium rounded-lg hover:bg-accent/80 transition-colors inline-flex items-center gap-2 w-full sm:w-auto justify-center"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>New Opportunity</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleCreateBlankOpportunity}>
                    + Blank opportunity
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/new-opportunity')}>
                    Select from template
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleGuidedEstimateWithHover}>
                    Guided estimate with Hover
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      )}

      <ColumnDeleteDialog
        isOpen={!!columnToDelete}
        onClose={() => setColumnToDelete(null)}
        onConfirm={confirmDeleteColumn}
        columnTitle={columnToDelete?.title || ''}
      />

      <OpportunityDeleteDialog
        isOpen={!!opportunityToDelete}
        onClose={() => setOpportunityToDelete(null)}
        onConfirm={confirmDeleteOpportunity}
        opportunityTitle={opportunityToDelete?.title || ''}
      />

      <MergeOpportunityDialog
        isOpen={mergeDialogOpen}
        onClose={() => {
          setMergeDialogOpen(false)
          setSourceOpportunity(null)
          setTargetOpportunity(null)
          setIsMergeMode(false)
        }}
        onConfirm={handleMergeConfirm}
        sourceOpportunity={sourceOpportunity}
        targetOpportunity={targetOpportunity}
      />
    </main>
  )
}
