export interface Option {
  id: string
  title: string
  content: string
  description: string
  price?: number
  afterImage: string
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
    materials?: string[]
    sections?: string[]
    financeSettings?: {
      apr: number
      termLength: number
    }
  }
}

export interface Operator {
  id: string
  type: 'and' | 'or'
}

export interface FinancingOption {
  id: string
  name: string
  apr: number
  termLength: number
}

export interface Template {
  id: string
  name: string
  data: Opportunity
}

export interface Opportunity {
  id: string
  title: string
  options: Option[]
  operators: Operator[]
  lastUpdated: string
  column: string
  packageNames?: { [key: number]: string }
  promotion?: {
    type: string
    discount: string
    validUntil: string
  }
  financingOption?: FinancingOption
} 