'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import Image from 'next/image'
import { Search, Filter, PlusCircle, X, AlignJustify, ChevronLeft, ChevronRight, Check, Edit, Trash2, Copy, Flag, Clipboard, ChevronDown, SlidersHorizontal, History } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast, Toaster } from 'sonner'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { defaultColumns } from '@/app/config/columns'
import { PriceSummary } from '@/app/components/PriceSummary'
import { calculateMonthlyPayment } from '@/app/utils/calculations'
import { EstimateDetails } from '@/app/components/EstimateDetails'
import { OpportunitySaveTemplateDialog } from '../../components/opportunity-save-template-dialog'
import { Operator, Opportunity, Template } from '@/app/types'
import { DuplicateOptionDialog } from '@/app/components/duplicate-option-dialog'
import { SelectOpportunityDialog } from '@/app/components/select-opportunity-dialog'
import { NewOpportunityDialog } from '@/app/components/new-opportunity-dialog'

// Extended Option interface with image arrays for cycling
interface Option {
  id: string
  title: string
  content: string
  description: string
  price?: number
  afterImage: string
  beforeImage?: string // Added for image cycling
  afterImages?: string[] // Added for image cycling
  beforeImages?: string[] // Added for image cycling
  isComplete: boolean
  materials?: string[]
  sections?: string[]
  showAsLowAsPrice?: boolean
  hasCalculations?: boolean
  isApproved?: boolean
  promotion?: {
    type: string
    discount: string
    validUntil: string
  }
  details?: {
    title: string
    description: string
    price: number
    afterImage: string
    beforeImage?: string // Added for image cycling
    afterImages?: string[] // Added for image cycling
    beforeImages?: string[] // Added for image cycling
    materials?: string[]
    sections?: string[]
    financeSettings?: {
      apr: number
      termLength: number
    }
  }
  calculatedPriceDetails?: {
    materialCost: number
    laborCost: number
    otherCost: number
    materialTax: number
    laborTax: number
    otherTax: number
    totalTax: number
    profitMargin: number
    totalPrice: number
  }
}

interface Job {
  id: string
  thumbnail: string
  name: string
  address: string
  measurementType: string
  status: string
}

interface HistoryState {
  options: Option[]
  operators: Operator[]
}

const jobs: Job[] = [
  {
    id: '1',
    thumbnail: '/2-bay-view.jpg',
    name: 'Main house exterior',
    address: '225 Bush St, San Francisco, CA 94104',
    measurementType: 'Full exterior',
    status: 'Complete'
  },
  {
    id: '2',
    thumbnail: '/first-floor.jpg',
    name: 'Main house first floor',
    address: '225 Bush St, San Francisco, CA 94104',
    measurementType: 'Interior floor plan',
    status: 'Complete'
  },
  {
    id: '3',
    thumbnail: '/2nd-floor.jpg',
    name: 'Main house second floor',
    address: '225 Bush St, San Francisco, CA 94104',
    measurementType: 'Interior floor plan',
    status: 'Complete'
  },
  {
    id: '4',
    thumbnail: '/basement.jpg',
    name: 'Main house basement',
    address: '225 Bush St, San Francisco, CA 94104',
    measurementType: 'Interior floor plan',
    status: 'Processing'
  },
  {
    id: '5',
    thumbnail: '/garage.jpg',
    name: 'Detached garage',
    address: '225 Bush St, San Francisco, CA 94104',
    measurementType: 'Roof only',
    status: 'Complete'
  },
  {
    id: '6',
    thumbnail: '/garage-floorplan.jpg',
    name: 'Garage floorplan',
    address: '225 Bush St, San Francisco, CA 94104',
    measurementType: 'Interior floor plan',
    status: 'Processing'
  },
  {
    id: '7',
    thumbnail: '/garage-bunkroom.jpg',
    name: 'Garage bunkroom',
    address: '225 Bush St, San Francisco, CA 94104',
    measurementType: 'Interior floor plan',
    status: 'Processing'
  }
]

const calculateDiscountedPrice = (price: number, promotion: { type: string; discount: string; validUntil: string }) => {
  const discountAmount = parseFloat(promotion.discount.replace(/[^0-9.]/g, ''))
  const isPercentage = promotion.discount.includes('%')
  
  if (isPercentage) {
    return price * (1 - discountAmount / 100)
  }
  return price - discountAmount
}

// First, add the missing adapter functions back
const adaptOptionsToPriceSummary = (options: Option[]): any[] => {
  return options.map(option => ({
    ...option,
    promotion: option.promotion ? {
      ...option.promotion,
      id: Math.random().toString(36).substr(2, 9)
    } : undefined,
  }));
};

const adaptOperatorsToPriceSummary = (operators: Operator[]): any[] => {
  return operators.map((op, index) => ({
    ...op,
    id: parseInt(op.id.toString()) || index + 1
  }));
};

const adaptOptionToEstimateDetails = (option: Option | undefined): any => {
  if (!option) return undefined;
  
  return {
    ...option,
    options: [],
    hasCalculations: option.hasCalculations ?? false,
    showAsLowAsPrice: option.showAsLowAsPrice ?? false,
    promotion: option.promotion ? {
      ...option.promotion,
      id: Math.random().toString(36).substr(2, 9)
    } : undefined
  };
};

export default function OpportunityPage() {
  const router = useRouter()
  const params = useParams()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const columnsRef = useRef<string>('')
  
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState('')
  const [column, setColumn] = useState('todo')
  const [options, setOptions] = useState<Option[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [showCalculator, setShowCalculator] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedOption, setSelectedOption] = useState<Option | null>(null)
  const [opportunityId, setOpportunityId] = useState<string | null>(null)
  const [historyStack, setHistoryStack] = useState<HistoryState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [history, setHistory] = useState<HistoryState[]>([])
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1)
  const [isJobSelectorOpen, setIsJobSelectorOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedMeasurementTypes, setSelectedMeasurementTypes] = useState<string[]>([])
  const [jobData, setJobData] = useState<Job[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [promotion, setPromotion] = useState<{ type: string; discount: string; validUntil: string } | undefined>(undefined)
  const [isPromotionOpen, setIsPromotionOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false)
  const [currentImageIndices, setCurrentImageIndices] = useState<{[key: string]: number}>({})
  const [selectedJobs, setSelectedJobs] = useState<Job[]>([])
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [columns, setColumns] = useState<{id: string, title: string}[]>([])
  const [templates, setTemplates] = useState<{ id: string; name: string; data: Opportunity }[]>([])
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [optionToDuplicate, setOptionToDuplicate] = useState<Option | null>(null)
  const [showSelectOpportunityDialog, setShowSelectOpportunityDialog] = useState(false)
  const [showNewOpportunityDialog, setShowNewOpportunityDialog] = useState(false)

  // Load columns from localStorage
  useEffect(() => {
    const loadColumns = () => {
      const savedColumns = JSON.parse(localStorage.getItem('columns') || '[]')
      if (savedColumns.length > 0) {
        setColumns(savedColumns)
      } else {
        // Use defaultColumns as fallback if no columns in localStorage
        setColumns(defaultColumns)
        // Save defaultColumns to localStorage if it's empty
        localStorage.setItem('columns', JSON.stringify(defaultColumns))
      }
    }

    // Initial load
    loadColumns()

    // Set up storage event listener for changes in other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'columns') {
        loadColumns()
      }
    }

    // Set up interval to check for changes in the same tab
    const checkInterval = setInterval(() => {
      const savedColumns = localStorage.getItem('columns')
      if (savedColumns && savedColumns !== columnsRef.current) {
        columnsRef.current = savedColumns
        loadColumns()
      }
    }, 1000) // Check every second

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(checkInterval)
    }
  }, []) // Remove columns from dependencies

  // Load existing opportunity data when the component mounts
  useEffect(() => {
    const opportunityId = params?.id as string
    const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]') as Opportunity[]
    const existingOpportunity = opportunities.find((opp: Opportunity) => opp.id === opportunityId)

    if (existingOpportunity) {
      setTitle(existingOpportunity.title)
      setOptions(existingOpportunity.options || [])
      setOperators(existingOpportunity.operators || [])
      setColumn(existingOpportunity.column || 'todo')
      setPromotion(existingOpportunity.promotion)
      // Initialize history with the current state
      setHistory([{ options: existingOpportunity.options || [], operators: existingOpportunity.operators || [] }])
      setCurrentHistoryIndex(0)
    } else {
      // Initialize new options with all required fields
      const initialOptions: Option[] = [
        {
          id: Math.random().toString(36).substr(2, 9),
          title: "Option name",
          content: "Option name",
          description: "This is a description of this deal.",
          price: 0,
          afterImage: "",
          isComplete: false,
          materials: [],
          sections: [],
          showAsLowAsPrice: false,
          hasCalculations: false,
          isApproved: false,
          promotion: undefined,
          details: {
            title: "Option name",
            description: "This is a description of this deal.",
            price: 0,
            afterImage: "",
            materials: [],
            sections: []
          }
        }
      ];
      setOptions(initialOptions)
      const defaultColumn = columns[0]?.id || 'todo'
      setColumn(defaultColumn)
      // Initialize history with the initial state
      setHistory([{ options: initialOptions, operators: [] }])
      setCurrentHistoryIndex(0)
    }
  }, [columns]) // Re-run when columns change

  // Load templates when component mounts
  useEffect(() => {
    const savedTemplates = JSON.parse(localStorage.getItem('templates') || '[]')
    setTemplates(savedTemplates)
  }, [])

  const saveToHistory = (newOptions: Option[], newOperators: Operator[]) => {
    const newHistory = history.slice(0, currentHistoryIndex + 1)
    newHistory.push({ options: newOptions, operators: newOperators })
    setHistory(newHistory)
    setCurrentHistoryIndex(newHistory.length - 1)
  }

  const handleUndo = () => {
    if (currentHistoryIndex > 0) {
      const previousState = history[currentHistoryIndex - 1]
      setOptions(previousState.options)
      setOperators(previousState.operators)
      setCurrentHistoryIndex(currentHistoryIndex - 1)
      
      // Save to localStorage
      const opportunityId = params?.id as string
      const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]') as Opportunity[]
      const existingIndex = opportunities.findIndex((opp: Opportunity) => opp.id === opportunityId)
      
      if (existingIndex >= 0) {
        opportunities[existingIndex] = {
          ...opportunities[existingIndex],
          options: previousState.options,
          operators: previousState.operators,
          lastUpdated: new Date().toISOString()
        }
        localStorage.setItem('opportunities', JSON.stringify(opportunities))
      }
    }
  }

  const handleRedo = () => {
    if (currentHistoryIndex < history.length - 1) {
      const nextState = history[currentHistoryIndex + 1]
      setOptions(nextState.options)
      setOperators(nextState.operators)
      setCurrentHistoryIndex(currentHistoryIndex + 1)
      
      // Save to localStorage
      const opportunityId = params?.id as string
      const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]') as Opportunity[]
      const existingIndex = opportunities.findIndex((opp: Opportunity) => opp.id === opportunityId)
      
      if (existingIndex >= 0) {
        opportunities[existingIndex] = {
          ...opportunities[existingIndex],
          options: nextState.options,
          operators: nextState.operators,
          lastUpdated: new Date().toISOString()
        }
        localStorage.setItem('opportunities', JSON.stringify(opportunities))
      }
    }
  }

  const handleAddOption = () => {
    // Create a completely independent new option with default empty values
    const newOption: Option = {
      id: Math.random().toString(36).substr(2, 9), // Use random ID instead of sequential to avoid any collisions
      title: "Option name",
      description: "This is a description of this deal.",
      price: 0,
      afterImage: "",
      content: "Option name",
      isComplete: false,
      materials: [],
      sections: [],
      showAsLowAsPrice: false,
      hasCalculations: false,
      details: {
        title: "Option name",
        description: "This is a description of this deal.",
        price: 0,
        afterImage: "",
        materials: [],
        sections: []
      },
      // Explicitly set promotion to undefined to avoid inheritance
      promotion: undefined,
      isApproved: false
    };
    
    const newOperator: Operator = {
      id: Math.random().toString(36).substr(2, 9), // Use random ID
      type: 'or'
    };
    
    const updatedOptions = [...options, newOption];
    const updatedOperators = [...operators, newOperator];
    
    setOptions(updatedOptions);
    setOperators(updatedOperators);
    saveToHistory(updatedOptions, updatedOperators);
    
    // Save to localStorage immediately
    const opportunityId = params?.id as string
    const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]') as Opportunity[];
    const existingIndex = opportunities.findIndex((opp: Opportunity) => opp.id === opportunityId);
    
    if (existingIndex >= 0) {
      opportunities[existingIndex] = {
        ...opportunities[existingIndex],
        options: updatedOptions,
        operators: updatedOperators,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('opportunities', JSON.stringify(opportunities));
    }
  };

  const handleDeleteOption = (optionId: string) => {
    const optionIndex = options.findIndex(opt => opt.id === optionId);
    
    // Remove the option
    const updatedOptions = options.filter(opt => opt.id !== optionId);
    
    // Remove the operator at the same index, or the previous operator if it's the last option
    let updatedOperators = [...operators];
    if (optionIndex === options.length - 1 && operators.length > 0) {
      // If deleting the last option, remove the last operator
      updatedOperators = operators.slice(0, -1);
    } else {
      // Otherwise remove the operator at the same index
      updatedOperators = operators.filter((_, index) => index !== optionIndex);
    }
    
    setOptions(updatedOptions);
    setOperators(updatedOperators);
    saveToHistory(updatedOptions, updatedOperators);
    
    // Save to localStorage immediately
    const opportunityId = params?.id as string
    const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]') as Opportunity[];
    const existingIndex = opportunities.findIndex((opp: Opportunity) => opp.id === opportunityId);
    
    if (existingIndex >= 0) {
      opportunities[existingIndex] = {
        ...opportunities[existingIndex],
        options: updatedOptions,
        operators: updatedOperators,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('opportunities', JSON.stringify(opportunities));
    }
    
    toast.success('Auto saved');
  };

  const handleDuplicateOption = (option: Option) => {
    setOptionToDuplicate(option)
    setShowDuplicateDialog(true)
  }

  const handleCopyToCurrent = () => {
    if (!optionToDuplicate) return

    // Create a deep copy to avoid reference issues
    const duplicatedOption = JSON.parse(JSON.stringify(optionToDuplicate))
    
    // Create new option with proper initialization of calculatedPriceDetails
    const newOption: Option = {
      ...duplicatedOption,
      id: Math.random().toString(36).substr(2, 9), // Generate random ID
      title: `${duplicatedOption.title} (Copy)`,
      content: `${duplicatedOption.content} (Copy)`,
      calculatedPriceDetails: duplicatedOption.calculatedPriceDetails ? {
        ...duplicatedOption.calculatedPriceDetails,
        // Ensure the totalPrice matches the current price
        totalPrice: duplicatedOption.price || 0,
        // Keep the existing costs and margin
        materialCost: duplicatedOption.calculatedPriceDetails.materialCost || 0,
        laborCost: duplicatedOption.calculatedPriceDetails.laborCost || 0,
        otherCost: duplicatedOption.calculatedPriceDetails.otherCost || 0,
        materialTax: duplicatedOption.calculatedPriceDetails.materialTax || 0,
        laborTax: duplicatedOption.calculatedPriceDetails.laborTax || 0,
        otherTax: duplicatedOption.calculatedPriceDetails.otherTax || 0,
        totalTax: duplicatedOption.calculatedPriceDetails.totalTax || 0,
        profitMargin: duplicatedOption.calculatedPriceDetails.profitMargin || 75
      } : undefined
    }
    
    // Find the index of the original option
    const originalIndex = options.findIndex(opt => opt.id === optionToDuplicate.id)
    
    // Insert the new option after the original option
    const updatedOptions = [
      ...options.slice(0, originalIndex + 1),
      newOption,
      ...options.slice(originalIndex + 1)
    ]
    
    // Create a new operator for the duplicated option
    const newOperator: Operator = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'or'
    }
    
    // Insert the new operator at the same position
    const updatedOperators = [
      ...operators.slice(0, originalIndex + 1),
      newOperator,
      ...operators.slice(originalIndex + 1)
    ]
    
    setOptions(updatedOptions)
    setOperators(updatedOperators)
    saveToHistory(updatedOptions, updatedOperators)
    
    // Save to localStorage immediately
    const opportunityId = params?.id as string
    const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]') as Opportunity[]
    const existingIndex = opportunities.findIndex((opp: Opportunity) => opp.id === opportunityId)
    
    if (existingIndex >= 0) {
      opportunities[existingIndex] = {
        ...opportunities[existingIndex],
        options: updatedOptions,
        operators: updatedOperators,
        lastUpdated: new Date().toISOString()
      }
      localStorage.setItem('opportunities', JSON.stringify(opportunities))
    }
    
    toast.success('Option duplicated')
  }

  const handleCopyToDifferent = () => {
    if (!optionToDuplicate) return
    setShowDuplicateDialog(false)
    setShowSelectOpportunityDialog(true)
  }

  const handleSelectOpportunity = (targetOpportunityId: string) => {
    if (!optionToDuplicate) return

    // Get all opportunities
    const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]') as Opportunity[]
    
    // Find the target opportunity
    const targetOpportunityIndex = opportunities.findIndex(opp => opp.id === targetOpportunityId)
    if (targetOpportunityIndex === -1) return

    // Create a deep copy of the option
    const duplicatedOption = JSON.parse(JSON.stringify(optionToDuplicate))
    
    // Create new option with proper initialization
    const newOption: Option = {
      ...duplicatedOption,
      id: Math.random().toString(36).substr(2, 9), // Generate random ID
      title: `${duplicatedOption.title} (Copy)`,
      content: `${duplicatedOption.content} (Copy)`,
      calculatedPriceDetails: duplicatedOption.calculatedPriceDetails ? {
        ...duplicatedOption.calculatedPriceDetails,
        totalPrice: duplicatedOption.price || 0,
        materialCost: duplicatedOption.calculatedPriceDetails.materialCost || 0,
        laborCost: duplicatedOption.calculatedPriceDetails.laborCost || 0,
        otherCost: duplicatedOption.calculatedPriceDetails.otherCost || 0,
        materialTax: duplicatedOption.calculatedPriceDetails.materialTax || 0,
        laborTax: duplicatedOption.calculatedPriceDetails.laborTax || 0,
        otherTax: duplicatedOption.calculatedPriceDetails.otherTax || 0,
        totalTax: duplicatedOption.calculatedPriceDetails.totalTax || 0,
        profitMargin: duplicatedOption.calculatedPriceDetails.profitMargin || 75
      } : undefined
    }

    // Add the new option to the target opportunity
    const targetOpportunity = opportunities[targetOpportunityIndex]
    const updatedOptions = [...targetOpportunity.options, newOption]
    
    // Create a new operator for the duplicated option
    const newOperator: Operator = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'or'
    }
    
    const updatedOperators = [...targetOpportunity.operators, newOperator]
    
    // Update the target opportunity
    opportunities[targetOpportunityIndex] = {
      ...targetOpportunity,
      options: updatedOptions,
      operators: updatedOperators,
      lastUpdated: new Date().toISOString()
    }
    
    // Save to localStorage
    localStorage.setItem('opportunities', JSON.stringify(opportunities))
    
    // Clear the duplicate option state after the operation
    setOptionToDuplicate(null)
    setShowSelectOpportunityDialog(false)
    
    toast.success('Option copied to selected opportunity')
  }

  const handleCopyToNew = () => {
    if (!optionToDuplicate) return
    setShowDuplicateDialog(false)
    setShowNewOpportunityDialog(true)
  }

  const handleCreateNewOpportunity = (title: string) => {
    if (!optionToDuplicate) return

    // Create a deep copy of the option
    const duplicatedOption = JSON.parse(JSON.stringify(optionToDuplicate))
    
    // Create new option with proper initialization
    const newOption: Option = {
      ...duplicatedOption,
      id: Math.random().toString(36).substr(2, 9), // Generate random ID
      title: `${duplicatedOption.title} (Copy)`,
      content: `${duplicatedOption.content} (Copy)`,
      calculatedPriceDetails: duplicatedOption.calculatedPriceDetails ? {
        ...duplicatedOption.calculatedPriceDetails,
        totalPrice: duplicatedOption.price || 0,
        materialCost: duplicatedOption.calculatedPriceDetails.materialCost || 0,
        laborCost: duplicatedOption.calculatedPriceDetails.laborCost || 0,
        otherCost: duplicatedOption.calculatedPriceDetails.otherCost || 0,
        materialTax: duplicatedOption.calculatedPriceDetails.materialTax || 0,
        laborTax: duplicatedOption.calculatedPriceDetails.laborTax || 0,
        otherTax: duplicatedOption.calculatedPriceDetails.otherTax || 0,
        totalTax: duplicatedOption.calculatedPriceDetails.totalTax || 0,
        profitMargin: duplicatedOption.calculatedPriceDetails.profitMargin || 75
      } : undefined
    }

    // Create a new operator for the duplicated option
    const newOperator: Operator = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'or'
    }

    // Create new opportunity
    const newOpportunity: Opportunity = {
      id: Math.random().toString(36).substr(2, 9),
      title: title,
      options: [newOption],
      operators: [newOperator],
      lastUpdated: new Date().toISOString(),
      column: 'drafts',
      packageNames: {}
    }

    // Get existing opportunities
    const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]') as Opportunity[]
    
    // Add new opportunity
    opportunities.push(newOpportunity)
    
    // Save to localStorage
    localStorage.setItem('opportunities', JSON.stringify(opportunities))
    
    // Clear the duplicate option state after the operation
    setOptionToDuplicate(null)
    setShowNewOpportunityDialog(false)
    
    // Navigate to the new opportunity
    router.push(`/opportunity/${newOpportunity.id}`)
    
    toast.success('Option copied to new opportunity')
  }

  const handleOperatorChange = (operatorId: string, newType: 'and' | 'or') => {
    const updatedOperators = operators.map(op => 
      op.id === operatorId ? { ...op, type: newType } : op
    );
    setOperators(updatedOperators);
    saveToHistory(options, updatedOperators);
    
    // Save to localStorage immediately
    const opportunityId = params?.id as string
    const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]') as Opportunity[];
    const existingIndex = opportunities.findIndex((opp: Opportunity) => opp.id === opportunityId);
    
    if (existingIndex >= 0) {
      opportunities[existingIndex] = {
        ...opportunities[existingIndex],
        operators: updatedOperators,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('opportunities', JSON.stringify(opportunities));
    }
    
    toast.success('Auto saved');
  };

  const handleOptionClick = (optionId: string) => {
    setSelectedOptionId(optionId);
  };

  const handleJobSelect = (job: Job) => {
    setSelectedJobs(prev => {
      const isSelected = prev.some(j => j.id === job.id)
      if (isSelected) {
        return prev.filter(j => j.id !== job.id)
      }
      const newSelection = [...prev, job]
      if (newSelection.length > 1) {
        setShowErrorDialog(true)
        return prev
      }
      return newSelection
    })
  }

  const handleCalculate = (optionId: string) => {
    setSelectedOptionId(optionId);
    setIsJobSelectorOpen(true);
  };

  const handleCreateEstimate = () => {
    // Open design studio in new tab
    window.open('https://hover.to/design-studio/15273950/model/15271361', '_blank');
    
    // Close job selector
    setIsJobSelectorOpen(false);
    
    // Update option with pre-populated info
    const updatedOptions = options.map(opt => {
      if (opt.id === selectedOptionId) {
        const title = 'GAF Timberline HDZ roof and Hardie® Artisan® V Groove Siding';
        return {
          ...opt,
          title,
          description: `Shingles from GAF. The American Harvest® Collection with Advanced Protection® Shingle Technology will give you the modern architectural style you want, at a price you can afford, with rugged, dependable performance that only a Timberline® roof can offer.

Primed offers the classic charm of tongue-and-groove siding with the lasting durability of James Hardie's proprietary fiber cement. Featuring deep V-groove lines and precise craftsmanship, it delivers a timeless, elegant appearance ready for customization with your choice of paint. This siding is primed and engineered for superior weather resistance and dimensional stability.`,
          price: 156799,
          afterImage: "/after2.png",
          materials: [],
          sections: [],
          hasCalculations: false,
          isApproved: false,
          content: title,
          showAsLowAsPrice: true,
          id: opt.id // Preserve the string ID
        };
      }
      return opt;
    });
    setOptions(updatedOptions);

    // Save to localStorage
    const opportunityId = params?.id as string
    const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]') as Opportunity[];
    const existingIndex = opportunities.findIndex((opp: Opportunity) => opp.id === opportunityId);

    if (existingIndex !== -1) {
      opportunities[existingIndex] = {
        ...opportunities[existingIndex],
        options: updatedOptions,
        promotion
      };
    } else {
      opportunities.push({
        id: opportunityId || '',
        title: 'New Opportunity',
        options: updatedOptions,
        operators: operators.map(op => ({ ...op, id: op.id.toString() })), // Convert operator IDs to strings
        lastUpdated: new Date().toISOString(),
        column: 'todo',
        promotion
      });
    }

    localStorage.setItem('opportunities', JSON.stringify(opportunities));
  };

  const handleFeedback = () => {
    toast.success('Thank you for your feedback')
    setShowErrorDialog(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingTitle(false)
      toast.success('Auto saved')
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef?.current) return
    
    const container = scrollContainerRef.current
    const scrollAmount = 300
    const targetScroll = container.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount)
    
    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    })
  }

  const measurementTypes = useMemo(() => 
    Array.from(new Set(jobData.map(job => job.measurementType))),
    [jobData]
  )

  const statuses = useMemo(() => 
    Array.from(new Set(jobData.map(job => job.status))),
    [jobData]
  )

  const filteredJobs = useMemo(() => {
    return jobData.filter(job => {
      const matchesSearch = job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.measurementType.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(job.status)
      const matchesMeasurementType = selectedMeasurementTypes.length === 0 || selectedMeasurementTypes.includes(job.measurementType)

      return matchesSearch && matchesStatus && matchesMeasurementType
    });
  }, [jobData, searchQuery, selectedStatuses, selectedMeasurementTypes]);

  const handleStatusChange = (status: string) => {
    // Handle column changes
    setColumn(status)
    
    // Save to localStorage immediately
    const opportunityId = params?.id as string
    const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]') as Opportunity[]
    const existingIndex = opportunities.findIndex((opp: Opportunity) => opp.id === opportunityId)
    
    if (existingIndex >= 0) {
      opportunities[existingIndex] = {
        ...opportunities[existingIndex],
        column: status,
        lastUpdated: new Date().toISOString()
      }
      localStorage.setItem('opportunities', JSON.stringify(opportunities))
    }
    
    toast.success(`Moved to ${columns.find(col => col.id === status)?.title || status}`)
  }

  const handleStatusFilterChange = (status: string) => {
    setSelectedStatuses(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status)
      }
      return [...prev, status]
    })
  }

  const handleMeasurementTypeChange = (value: string) => {
    setSelectedMeasurementTypes(prev => {
      if (prev.includes(value)) {
        return prev.filter(type => type !== value)
      }
      return [...prev, value]
    })
  }

  const handleMoveOption = (index: number, direction: 'left' | 'right') => {
    if (
      (direction === 'left' && index === 0) || 
      (direction === 'right' && index === options.length - 1)
    ) {
      return
    }

    const newIndex = direction === 'left' ? index - 1 : index + 1
    const newOptions = [...options]
    const newOperators = [...operators]

    // Swap options
    const tempOption = newOptions[index]
    newOptions[index] = newOptions[newIndex]
    newOptions[newIndex] = tempOption

    // Swap operators
    const tempOperator = newOperators[index]
    newOperators[index] = newOperators[newIndex]
    newOperators[newIndex] = tempOperator

    setOptions(newOptions)
    setOperators(newOperators)
    saveToHistory(newOptions, newOperators)

    // Save to localStorage immediately
    const opportunityId = params?.id as string
    const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]') as Opportunity[]
    const existingIndex = opportunities.findIndex((opp: Opportunity) => opp.id === opportunityId)
    
    if (existingIndex >= 0) {
      opportunities[existingIndex] = {
        ...opportunities[existingIndex],
        options: newOptions,
        operators: newOperators,
        lastUpdated: new Date().toISOString()
      }
      localStorage.setItem('opportunities', JSON.stringify(opportunities))
    }
    
    toast.success('Auto saved')
  }

  const handleBackClick = () => {
    const completedOptions = options.filter(opt => opt.hasCalculations)
    const opportunityData: Opportunity = {
      id: params?.id as string || '',
      title,
      options: completedOptions,
      operators: operators,
      lastUpdated: new Date().toISOString(),
      column: column,
      promotion
    }

    saveOpportunity(opportunityData)
    toast.success('Auto saved')
    router.back()
  }

  const handleDeleteOpportunity = () => {
    const opportunityId = params?.id as string
    const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]') as Opportunity[]
    const updatedOpportunities = opportunities.filter((opp: Opportunity) => opp.id !== opportunityId)
    localStorage.setItem('opportunities', JSON.stringify(updatedOpportunities))
    toast.success('Opportunity deleted')
    router.push('/')
  }

  const handleToggleApproval = (optionId: string) => {
    const updatedOptions = options.map(opt => 
      opt.id === optionId ? { ...opt, isApproved: !opt.isApproved } : opt
    )
    setOptions(updatedOptions)
    saveToHistory(updatedOptions, operators)
  }

  const handleShowDetails = (optionId: string) => {
    setSelectedOptionId(optionId)
    setIsDetailsOpen(true)
    
    // Initialize blank details if none exist
    const option = options.find(opt => opt.id === optionId)
    if (option && !option.hasCalculations) {
      const updatedOptions = options.map(opt => 
        opt.id === optionId ? { 
          ...opt, 
          hasCalculations: false,
          title: opt.content || "", // Initialize title from content if it exists
          description: "",
          price: 0,
          afterImage: "",
          materials: [],
          sections: [],
          content: opt.content || "", // Keep existing content or use empty string
          showAsLowAsPrice: false,
          promotion: undefined,
          isApproved: false,
          // Initialize calculatedPriceDetails with default values
          calculatedPriceDetails: {
            materialCost: 0,
            laborCost: 0,
            otherCost: 0,
            materialTax: 0,
            laborTax: 0,
            otherTax: 0,
            totalTax: 0,
            profitMargin: 75, // Default profit margin
            totalPrice: 0
          }
        } : opt
      )
      setOptions(updatedOptions)
      
      // Save to localStorage immediately
      const opportunityId = params?.id as string
      const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]') as Opportunity[]
      const existingIndex = opportunities.findIndex((opp: Opportunity) => opp.id === opportunityId)
      
      if (existingIndex >= 0) {
        opportunities[existingIndex] = {
          ...opportunities[existingIndex],
          options: updatedOptions,
          lastUpdated: new Date().toISOString()
        }
        localStorage.setItem('opportunities', JSON.stringify(opportunities))
      }
    }
  }

  const saveOpportunity = (opportunityData: Opportunity) => {
    const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]') as Opportunity[]
    const existingIndex = opportunities.findIndex((opp: Opportunity) => opp.id === opportunityData.id)
    
    // If opportunityData has a promotion, calculate finalPrice for each option
    if (opportunityData.promotion) {
      const discountValue = parseFloat(opportunityData.promotion.discount.replace(/[^0-9.]/g, ''));
      const isPercentage = opportunityData.promotion.discount.includes('%');
      
      opportunityData.options = opportunityData.options.map(option => {
        const basePrice = option.price || option.details?.price || 0;
        if (basePrice > 0) {
          const finalPrice = isPercentage 
            ? basePrice * (1 - discountValue / 100)
            : basePrice - discountValue;
          
          return {
            ...option,
            finalPrice,
            details: option.details ? {
              ...option.details,
              finalPrice: option.details.price ? 
                (isPercentage ? option.details.price * (1 - discountValue / 100) : option.details.price - discountValue) : 
                undefined
            } : option.details
          };
        }
        return option;
      });
    }
    
    if (existingIndex >= 0) {
      opportunities[existingIndex] = {
        ...opportunities[existingIndex],
        ...opportunityData,
        promotion: opportunityData.promotion
      }
    } else {
      opportunities.push(opportunityData)
    }
    
    localStorage.setItem('opportunities', JSON.stringify(opportunities))
  }

  const handleSaveTemplate = (templateName: string, opportunity: Opportunity, existingTemplateId?: string) => {
    const opportunityToSave = {
      ...opportunity,
      options,
      operators,
      title,
      lastUpdated: new Date().toISOString()
    }

    if (existingTemplateId) {
      // Update existing template
      const updatedTemplates = templates.map(template => 
        template.id === existingTemplateId
          ? { ...template, name: templateName, data: opportunityToSave }
          : template
      )
      setTemplates(updatedTemplates)
      localStorage.setItem('templates', JSON.stringify(updatedTemplates))
      toast.success('Template updated successfully')
    } else {
      // Create new template
      const newTemplate = {
        id: Math.random().toString(36).substr(2, 9),
        name: templateName,
        data: opportunityToSave
      }
      const newTemplates = [...templates, newTemplate]
      setTemplates(newTemplates)
      localStorage.setItem('templates', JSON.stringify(newTemplates))
      toast.success('Template saved successfully')
    }
  }

  const handleSaveNewTemplate = (templateName: string, opportunity: Opportunity) => {
    const opportunityToSave = {
      ...opportunity,
      options,
      operators,
      title,
      lastUpdated: new Date().toISOString()
    }

    const newTemplate = {
      id: Math.random().toString(36).substr(2, 9),
      name: templateName,
      data: opportunityToSave
    }
    const newTemplates = [...templates, newTemplate]
    setTemplates(newTemplates)
    localStorage.setItem('templates', JSON.stringify(newTemplates))
    toast.success('Template saved successfully')
  }

  const handleSaveEstimate = (details: {
    title: string;
    description: string;
    price: number;
    afterImage: string;
    afterImages?: string[];
    materials?: string[];
    sections?: string[];
    hasCalculations?: boolean;
    isApproved?: boolean;
    showAsLowAsPrice?: boolean;
    promotion?: {
      type: string;
      discount: string;
      validUntil: string;
      id: string;
    };
    financingOption?: {
      id: string;
      name: string;
      apr: number;
      termLength: number;
    };
    options?: any[];
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
    _preventClose?: boolean;
  }) => {
    const opportunityId = params?.id as string;
    
    // If the details include a promotion, update the opportunity-level promotion first
    if (details.promotion) {
      const opportunityPromotion = {
        type: details.promotion.type,
        discount: details.promotion.discount,
        validUntil: details.promotion.validUntil
      };
      setPromotion(opportunityPromotion);
    } else if (details.promotion === undefined && selectedOptionId) {
      // Clear the promotion if explicitly set to undefined
      setPromotion(undefined);
    }
    
    // Update options with new details
    const updatedOptions = options.map(opt => 
      opt.id === selectedOptionId ? {
        ...opt,
        title: details.title,
        description: details.description,
        price: details.price,
        afterImage: details.afterImage,
        afterImages: details.afterImages || [],
        content: details.title,
        isComplete: true,
        hasCalculations: true,
        isApproved: details.isApproved ?? false,
        showAsLowAsPrice: details.showAsLowAsPrice ?? false,
        promotion: details.promotion ? {
          type: details.promotion.type,
          discount: details.promotion.discount,
          validUntil: details.promotion.validUntil
        } : undefined,
        financingOption: details.financingOption,
        materials: details.materials || [],
        sections: details.sections || [],
        // Preserve existing calculatedPriceDetails if they exist, otherwise use new ones
        calculatedPriceDetails: details.calculatedPriceDetails || opt.calculatedPriceDetails || {
          materialCost: 0,
          laborCost: 0,
          otherCost: 0,
          materialTax: 0,
          laborTax: 0,
          otherTax: 0,
          totalTax: 0,
          profitMargin: 75,
          totalPrice: details.price
        },
        details: {
          title: details.title,
          description: details.description,
          price: details.price,
          afterImage: details.afterImage,
          afterImages: details.afterImages || [],
          financingOption: details.financingOption,
          materials: details.materials || [],
          sections: details.sections || []
        }
      } : opt
    );
    
    setOptions(updatedOptions);
    saveToHistory(updatedOptions, operators);

    // Save to localStorage with packageNames and promotion
    const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]') as Opportunity[];
    const existingIndex = opportunities.findIndex((opp: Opportunity) => opp.id === opportunityId);
    
    // The current promotion state that should be saved
    const currentPromotion = details.promotion ? {
      type: details.promotion.type,
      discount: details.promotion.discount,
      validUntil: details.promotion.validUntil
    } : undefined;
    
    if (existingIndex !== -1) {
      opportunities[existingIndex] = {
        ...opportunities[existingIndex],
        options: updatedOptions,
        lastUpdated: new Date().toISOString(),
        packageNames: updatedOptions.reduce((acc, opt, index) => ({
          ...acc,
          [index]: `Package ${index + 1}`
        }), {}),
        promotion: currentPromotion
      };
      localStorage.setItem('opportunities', JSON.stringify(opportunities));
    }

    // Only close the dialog if _preventClose is not set
    if (!details._preventClose) {
      setIsDetailsOpen(false);
    }
  };

  const opportunity: {
    id: string
    title: string
    options: Option[]
    operators: Operator[]
    lastUpdated: string
    column: string
  } = {
    id: params?.id as string || '',
    title,
    options,
    operators,
    lastUpdated: new Date().toISOString(),
    column: column
  }

  // Modify the getImagesByType function to handle all image types
  const getImagesByType = (option: Option, type: 'before' | 'after' | 'all') => {
    if (type === 'before') {
      // Return beforeImages array if it exists, otherwise use single beforeImage
      return option.beforeImages && option.beforeImages.length > 0
        ? option.beforeImages
        : option.beforeImage 
          ? [option.beforeImage] 
          : [];
    } else if (type === 'after') {
      // Return afterImages array if it exists, otherwise use single afterImage
      return option.afterImages && option.afterImages.length > 0
        ? option.afterImages
        : option.afterImage 
          ? [option.afterImage] 
          : [];
    } else {
      // Combine all images for the 'all' type
      const allImages = [];
      
      // Add afterImages
      if (option.afterImages && option.afterImages.length > 0) {
        allImages.push(...option.afterImages);
      } else if (option.afterImage) {
        allImages.push(option.afterImage);
      }
      
      // Add beforeImages
      if (option.beforeImages && option.beforeImages.length > 0) {
        allImages.push(...option.beforeImages);
      } else if (option.beforeImage) {
        allImages.push(option.beforeImage);
      }
      
      return allImages;
    }
  };

  // Update the nextImage and prevImage functions to handle 'all' type
  const nextImage = (optionId: string, type: 'before' | 'after' | 'all') => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const option = options.find(opt => opt.id === optionId);
      if (!option) return;
      
      const images = getImagesByType(option, type);
      if (images.length <= 1) return;
      
      const currentIndex = currentImageIndices[`${optionId}_${type}`] || 0;
      const newIndex = (currentIndex + 1) % images.length;
      
      setCurrentImageIndices(prev => ({
        ...prev,
        [`${optionId}_${type}`]: newIndex
      }));
    };
  };

  const prevImage = (optionId: string, type: 'before' | 'after' | 'all') => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const option = options.find(opt => opt.id === optionId);
      if (!option) return;
      
      const images = getImagesByType(option, type);
      if (images.length <= 1) return;
      
      const currentIndex = currentImageIndices[`${optionId}_${type}`] || 0;
      const newIndex = (currentIndex - 1 + images.length) % images.length;
      
      setCurrentImageIndices(prev => ({
        ...prev,
        [`${optionId}_${type}`]: newIndex
      }));
    };
  };
  
  // Initialize image indices for each option and image type
  useEffect(() => {
    const initialIndices: {[key: string]: number} = {};
    options.forEach((opt) => {
      initialIndices[`${opt.id}_before`] = 0;
      initialIndices[`${opt.id}_after`] = 0;
      initialIndices[`${opt.id}_all`] = 0;
    });
    setCurrentImageIndices(initialIndices);
  }, [options.length]);

  // Update the assignment of jobData with the default jobs data 
  useEffect(() => {
    // Set the initial job data from the mock data
    setJobData(jobs);
  }, []);

  return (
    <main className="container mx-auto p-4 min-h-screen">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={handleBackClick}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18" />
              </svg>
            </button>
            <div className="flex items-center gap-2 sm:gap-4 ml-2 sm:ml-4">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={handleTitleKeyDown}
                  className="text-lg sm:text-xl font-semibold bg-transparent border-b-2 border-border focus:border-border/80 outline-none px-1 text-foreground"
                  autoFocus
                />
              ) : (
                <h1 
                  onClick={() => setIsEditingTitle(true)}
                  className="text-lg sm:text-xl font-semibold cursor-pointer text-foreground hover:text-muted-foreground transition-colors"
                >
                  {title}
                </h1>
              )}
              <Select
                value={column}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="h-6 px-1 sm:px-2">
                  <Badge variant="outline" shape="rectangle" className="text-xs font-normal">
                    {columns.find(col => col.id === column)?.title || 'No Status'}
                  </Badge>
                </SelectTrigger>
                <SelectContent>
                  {columns.map(column => (
                    <SelectItem key={column.id} value={column.id}>
                      {column.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <OpportunitySaveTemplateDialog
              opportunity={opportunity}
              existingTemplates={templates}
              onSaveTemplate={handleSaveTemplate}
              onSaveNewTemplate={handleSaveNewTemplate}
            />
            <button
              onClick={handleUndo}
              disabled={currentHistoryIndex <= 0}
              className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                currentHistoryIndex <= 0 
                  ? 'text-muted-foreground/50 cursor-not-allowed' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18" />
              </svg>
            </button>
            <button
              onClick={handleRedo}
              disabled={currentHistoryIndex >= history.length - 1}
              className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                currentHistoryIndex >= history.length - 1
                  ? 'text-muted-foreground/50 cursor-not-allowed'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18" />
              </svg>
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="p-1.5 sm:p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="relative w-full">
            <div 
              ref={scrollContainerRef}
              className="flex items-start gap-4 overflow-x-auto pb-4 px-4 scrollbar-hide"
            >
              <div className="flex items-start gap-4 mx-auto">
                {options.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-4">
                    <div className="group relative">
                      <div
                        onClick={() => handleOptionClick(option.id)}
                        className={`${option.hasCalculations ? 'h-[500px]' : 'aspect-square'} w-[280px] rounded-lg border-2 ${
                          option.isApproved 
                            ? 'border-green-500 bg-green-50/20' 
                            : 'border-border/40 hover:border-border'
                        } transition-colors flex flex-col items-center justify-center text-muted-foreground hover:text-foreground bg-card shadow-sm hover:shadow-md flex-shrink-0 snap-center cursor-pointer relative`}
                      >
                        <div className="absolute top-2 left-2 text-xs font-medium text-muted-foreground">
                          Option {index + 1}
                        </div>
                        {/* Option Management Buttons */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          {index > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMoveOption(index, 'left')
                              }}
                              className="p-1 hover:bg-gray-100 rounded-full"
                            >
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                          )}
                          {index < options.length - 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMoveOption(index, 'right')
                              }}
                              className="p-1 hover:bg-gray-100 rounded-full"
                            >
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDuplicateOption(option)
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteOption(option.id)
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        {/* Main Content */}
                        <div className="w-full h-full flex flex-col">
                          {option.hasCalculations && (
                            <>
                              <div className="relative w-full h-[200px]">
                                {(() => {
                                  const afterImages = getImagesByType(option, 'after');
                                  const currentAfterIndex = currentImageIndices[`${option.id}_after`] || 0;
                                  const hasMultipleAfterImages = afterImages.length > 1;
                                  
                                  if (afterImages.length === 0) return null;
                                  
                                  return (
                                    <>
                                      <Image
                                        src={afterImages[currentAfterIndex]}
                                        alt={option.title || 'Option Image'}
                                        fill
                                        className="object-cover rounded-t-lg"
                                      />
                                      
                                      {/* Image Type Label */}
                                      <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
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
                                            onClick={prevImage(option.id, 'after')}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black shadow-md border border-white/20 z-10"
                                            aria-label="Previous image"
                                          >
                                            <ChevronLeft className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={nextImage(option.id, 'after')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black shadow-md border border-white/20 z-10"
                                            aria-label="Next image"
                                          >
                                            <ChevronRight className="w-4 h-4" />
                                          </button>
                                        </>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                              <div className="flex-1 w-full p-4 flex flex-col gap-3">
                                <span className="text-sm font-medium text-foreground whitespace-pre-wrap">{option.title}</span>
                                <div className="flex flex-col gap-1">
                                  {option.promotion ? (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                          {option.promotion.type}
                                        </Badge>
                                        <span className="text-xs text-purple-700">
                                          {option.promotion.discount.includes('%') ? 
                                            `${parseFloat(option.promotion.discount.replace(/[^0-9.]/g, ''))}%` : 
                                            `$${parseFloat(option.promotion.discount.replace(/[^0-9.]/g, '')).toLocaleString('en-US')}`
                                          }
                                        </span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground line-through">
                                          ${option.price?.toLocaleString()}
                                        </span>
                                        <span className="text-lg font-bold text-foreground">
                                          ${calculateDiscountedPrice(option.price || 0, option.promotion).toLocaleString()}
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    <span className="text-lg font-bold text-foreground">
                                      ${option.price?.toLocaleString()}
                                    </span>
                                  )}
                                  {option.showAsLowAsPrice !== false && (
                                    <span className="text-xs text-muted-foreground">
                                      As low as ${calculateMonthlyPayment(
                                        option.promotion 
                                          ? calculateDiscountedPrice(option.price || 0, option.promotion)
                                          : option.price || 0
                                      ).toLocaleString()}/month
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  <div className="whitespace-pre-wrap line-clamp-3">{option.description}</div>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Action Buttons */}
                          <div className="w-full p-4 flex flex-col gap-2 mt-auto">
                            {option.hasCalculations && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToggleApproval(option.id)
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer text-center ${
                                  option.isApproved
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                              >
                                {option.isApproved ? 'Approved ✓' : 'Mark as Approved'}
                              </div>
                            )}
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                handleShowDetails(option.id)
                              }}
                              className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit details
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < options.length - 1 && (
                      <Select
                        value={operators[index]?.type || 'and'}
                        onValueChange={(value: 'and' | 'or') => {
                          // If no operator exists at this index, create one
                          if (!operators[index]) {
                            const newOperator = {
                              id: (operators.length + 1).toString(),
                              type: value
                            };
                            const newOperators = [...operators];
                            newOperators[index] = newOperator;
                            setOperators(newOperators);
                            saveToHistory(options, newOperators);
                          } else {
                            handleOperatorChange(operators[index].id, value);
                          }
                        }}
                      >
                        <SelectTrigger className="w-[80px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="and">And</SelectItem>
                          <SelectItem value="or">Or</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
                
                <button
                  onClick={handleAddOption}
                  className={`${options.length === 0 ? 'w-28 h-28' : 'w-10 h-10'} rounded-full border-2 border-dashed border-border/40 hover:border-border transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground bg-card shadow-sm hover:shadow-md flex-shrink-0`}
                >
                  <svg className={`${options.length === 0 ? 'w-12 h-12' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Add PriceSummary component */}
            {options.length > 0 && (
              <div className="mt-8 px-4 max-w-4xl mx-auto">
                <PriceSummary 
                  options={adaptOptionsToPriceSummary(options)} 
                  operators={adaptOperatorsToPriceSummary(operators)} 
                  opportunityPromotion={promotion}
                />
              </div>
            )}

            {options.length > 1 && (
              <>
                <button
                  onClick={() => scroll('left')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors z-10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => scroll('right')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors z-10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        <Dialog open={isJobSelectorOpen} onOpenChange={setIsJobSelectorOpen}>
          <DialogContent className="max-w-[1400px] w-[95vw] h-[80vh] flex flex-col">
            <div className="flex-none pb-6 border-b">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Select a job</DialogTitle>
                <div className="mt-4 space-y-3">
                  <div className="relative w-full">
                    <input
                      type="text"
                      placeholder="Search jobs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          selectedStatuses.length > 0
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-gray-200 bg-gray-100 text-gray-900 hover:bg-gray-200'
                        }`}>
                          <Filter className="w-3 h-3" />
                          Status {selectedStatuses.length > 0 && `(${selectedStatuses.length})`}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2" side="bottom" align="start">
                        <div className="space-y-1">
                          {statuses.map((status) => (
                            <button
                              key={status}
                              onClick={() => handleStatusFilterChange(status)}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${
                                selectedStatuses.includes(status)
                                  ? 'bg-emerald-50 text-emerald-900'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <span>{status}</span>
                              {selectedStatuses.includes(status) && (
                                <svg className="w-4 h-4 ml-auto" viewBox="0 0 24 24" fill="none">
                                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          selectedMeasurementTypes.length > 0
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-gray-200 bg-gray-100 text-gray-900 hover:bg-gray-200'
                        }`}>
                          <Filter className="w-3 h-3" />
                          Type {selectedMeasurementTypes.length > 0 && `(${selectedMeasurementTypes.length})`}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2" side="bottom" align="start">
                        <div className="space-y-1">
                          {measurementTypes.map((type) => (
                            <button
                              key={type}
                              onClick={() => handleMeasurementTypeChange(type)}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${
                                selectedMeasurementTypes.includes(type)
                                  ? 'bg-emerald-50 text-emerald-900'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <span>{type}</span>
                              {selectedMeasurementTypes.includes(type) && (
                                <svg className="w-4 h-4 ml-auto" viewBox="0 0 24 24" fill="none">
                                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-1 gap-4 p-6">
                {filteredJobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => handleJobSelect(job)}
                    className={`relative flex items-start gap-6 p-5 rounded-lg transition-colors text-left group ${
                      selectedJobs.some(j => j.id === job.id)
                        ? 'bg-blue-50 hover:bg-blue-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                      <Image
                        src={job.thumbnail}
                        alt={job.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 pr-24">
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                        {job.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 truncate">
                        {job.address}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {job.measurementType}
                      </p>
                    </div>
                    <div className="absolute top-5 right-5">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                        job.status === 'Complete' 
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-gray-200 bg-gray-100 text-gray-900'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedJobs.length === 1 && (
              <div className="flex-none p-4 border-t bg-white">
                <button
                  onClick={handleCreateEstimate}
                  className="w-full py-2.5 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Create estimate
                </button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Multiple Selection Not Available</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>Combining jobs into a single material list, work order, and(or) estimate is not available. If this feature would help you, please click the thumbs up below.</p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleFeedback()}
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <ThumbsUp className="w-5 h-5" />
                    <span>This would help</span>
                  </button>
                  <button
                    onClick={() => handleFeedback()}
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <ThumbsDown className="w-5 h-5" />
                    <span>No thanks</span>
                  </button>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Opportunity</DialogTitle>
              <DialogDescription>
                Are you sure you would like to delete this opportunity? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteOpportunity}
              >
                Yes, please delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <EstimateDetails
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          onCalculate={() => handleCalculate(selectedOptionId!)}
          optionDetails={adaptOptionToEstimateDetails(options.find(opt => opt.id === selectedOptionId))}
          onSave={handleSaveEstimate}
        />

        {optionToDuplicate && (
          <DuplicateOptionDialog
            isOpen={showDuplicateDialog}
            onClose={() => {
              setShowDuplicateDialog(false)
              setOptionToDuplicate(null)
            }}
            onCopyToCurrent={handleCopyToCurrent}
            onCopyToDifferent={handleCopyToDifferent}
            onCopyToNew={handleCopyToNew}
            option={optionToDuplicate}
            currentOpportunity={{
              id: params?.id as string,
              title: opportunity?.title || '',
              options: options,
              operators: operators,
              lastUpdated: new Date().toISOString(),
              column: opportunity?.column || 'drafts',
              packageNames: opportunity?.packageNames || {}
            }}
          />
        )}

        {optionToDuplicate && (
          <SelectOpportunityDialog
            isOpen={showSelectOpportunityDialog}
            onClose={() => {
              setShowSelectOpportunityDialog(false)
              setOptionToDuplicate(null)
            }}
            onSelect={handleSelectOpportunity}
            currentOpportunityId={params?.id as string}
            opportunities={JSON.parse(localStorage.getItem('opportunities') || '[]') as Opportunity[]}
          />
        )}

        {optionToDuplicate && (
          <NewOpportunityDialog
            isOpen={showNewOpportunityDialog}
            onClose={() => {
              setShowNewOpportunityDialog(false)
              setOptionToDuplicate(null)
            }}
            onCreate={handleCreateNewOpportunity}
          />
        )}

        <Toaster position="top-center" />
      </div>

      <style jsx global>{`
        @media print {
          .print-only {
            display: block;
          }
          .no-print {
            display: none;
          }
        }
        @media screen {
          .print-only {
            display: none;
          }
        }
      `}</style>
    </main>
  )
} 