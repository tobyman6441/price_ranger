'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import Image from 'next/image'
import { Switch } from '@/components/ui/switch'

export default function GuidedEstimateScreen() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null)
  const [opportunityId, setOpportunityId] = useState<string | null>(null)
  const [showLinePrices, setShowLinePrices] = useState(true)
  
  // Price calculation state
  const [materialCost, setMaterialCost] = useState(35000)
  const [materialTax, setMaterialTax] = useState(0)
  const [laborCost, setLaborCost] = useState(25000)
  const [laborTax, setLaborTax] = useState(0)
  const [otherCost, setOtherCost] = useState(5000)
  const [otherTax, setOtherTax] = useState(0)
  const [profitMargin, setProfitMargin] = useState(75)
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null)
  
  // Calculated values
  const totalCost = materialCost + laborCost + otherCost
  const totalTax = 
    (materialCost * (materialTax / 100)) + 
    (laborCost * (laborTax / 100)) + 
    (otherCost * (otherTax / 100))
  const totalPrice = (totalCost * (1 + (profitMargin / 100))) + totalTax
  
  // Reset price calculator to defaults
  const resetPriceCalculator = () => {
    setMaterialCost(35000)
    setMaterialTax(0)
    setLaborCost(25000)
    setLaborTax(0)
    setOtherCost(5000)
    setOtherTax(0)
    setProfitMargin(75)
  }
  
  // Apply calculated price to the estimate
  const applyCalculatedPrice = () => {
    setCalculatedPrice(totalPrice)
    toast.success('Price applied to estimate')
  }

  // Mock data for demonstration
  const jobs = [
    { id: 'job1', address: '123 Main St, Anytown, USA', date: '2023-10-15' },
    { id: 'job2', address: '456 Oak Ave, Somewhere, USA', date: '2023-11-02' },
    { id: 'job3', address: '789 Pine Rd, Nowhere, USA', date: '2023-11-20' },
  ]

  const models = [
    { id: 'model1', name: 'Main house', thumbnail: '/2-bay-view.jpg' },
    { id: 'model2', name: 'Garage', thumbnail: '/garage.jpg' },
    { id: 'model4', name: 'Main house - floor 1', thumbnail: '/first-floor.jpg' },
    { id: 'model5', name: 'Main house - floor 2', thumbnail: '/2nd-floor.jpg' },
    { id: 'model6', name: 'Basement', thumbnail: '/basement.jpg' },
    { id: 'model7', name: 'Bunkroom', thumbnail: '/garage-bunkroom.jpg' },
    { id: 'model8', name: 'Garage interior', thumbnail: '/garage-floorplan.jpg' },
  ]

  const materials = [
    { id: 'material1', name: 'Premium Package', description: 'High-end materials with extended warranties' },
    { id: 'material2', name: 'Standard Package', description: 'Quality materials with standard warranties' },
    { id: 'material3', name: 'Value Package', description: 'Cost-effective materials with basic warranties' },
  ]

  // Line items data
  const lineItems = [
    { name: 'GAF Timberline HDZ Shingles', quantity: '30 squares', unitPrice: 350, total: 10500 },
    { name: 'James Hardie Artisan Siding', quantity: '2,400 sq ft', unitPrice: 9.5, total: 22800 },
    { name: 'Weather Barrier', quantity: '2,600 sq ft', unitPrice: 0.65, total: 1690 }
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    } else {
      completeEstimate()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      router.back()
    }
  }

  const completeEstimate = () => {
    // Create a new option in the opportunity with the estimated costs
    const newId = Math.random().toString(36).substr(2, 9)
    
    // Get the stored opportunity
    const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]')
    const existingOpportunity = opportunities.find((opp: any) => opp.id === opportunityId)
    
    if (existingOpportunity) {
      // Create a new option with the information from the guided workflow
      const jobDetails = jobs.find(job => job.id === selectedJob)
      const modelDetails = models.find(model => model.id === selectedModel)
      const materialDetails = materials.find(material => material.id === selectedMaterial)
      
      // Get the name and description from the input fields
      const optionName = document.getElementById('option-name') as HTMLInputElement
      const optionDescription = document.getElementById('option-description') as HTMLTextAreaElement
      
      // Format line items as text to append to description
      let lineItemsText = '\n\nMaterials:\n'
      lineItems.forEach(item => {
        if (showLinePrices) {
          lineItemsText += `${item.name} (${item.quantity}) - $${item.unitPrice.toFixed(2)} - $${item.total.toLocaleString()}\n`
        } else {
          lineItemsText += `${item.name} (${item.quantity})\n`
        }
      })
      
      // Build the full description
      const baseDescription = optionDescription?.value || `Estimate created using Hover 3D model: ${modelDetails?.name} with ${materialDetails?.name}.`
      const fullDescription = baseDescription + lineItemsText
      
      const newOption = {
        id: Math.random().toString(36).substr(2, 9),
        title: optionName?.value || `${materialDetails?.name} for ${jobDetails?.address}`,
        description: fullDescription,
        price: Math.round(totalPrice * 100) / 100,
        afterImage: modelDetails?.thumbnail || '/model-preview.jpg',
        content: optionName?.value || `${materialDetails?.name} for ${jobDetails?.address}`,
        isComplete: true,
        materials: [],
        sections: [],
        showAsLowAsPrice: true,
        hasCalculations: true,
        details: {
          title: optionName?.value || `${materialDetails?.name} for ${jobDetails?.address}`,
          description: fullDescription,
          price: Math.round(totalPrice * 100) / 100,
          afterImage: modelDetails?.thumbnail || '/model-preview.jpg',
          materials: [],
          sections: []
        },
        promotion: undefined,
        isApproved: false,
        costBreakdown: {
          materialCost,
          laborCost,
          otherCost,
          materialTax,
          laborTax,
          otherTax,
          profitMargin,
          totalCost,
          totalTax,
          totalPrice,
          showPrices: showLinePrices
        }
      }
      
      // Add the new option to the opportunity
      existingOpportunity.options.push(newOption)
      
      // Update the localStorage
      localStorage.setItem('opportunities', JSON.stringify(opportunities))
      
      // Navigate to the opportunity page
      toast.success('Estimate created successfully')
      router.push(`/opportunity/${opportunityId}`)
    } else {
      toast.error('Opportunity not found')
      router.push('/')
    }
  }

  const selectJob = (jobId: string) => {
    setSelectedJob(jobId)
  }

  const selectModel = (modelId: string) => {
    setSelectedModel(modelId)
  }

  const selectMaterial = (materialId: string) => {
    setSelectedMaterial(materialId)
  }

  const openHoverDesignStudio = () => {
    window.open('https://hover.to/design-studio/15273950/model/15271361', '_blank')
  }

  // Extract opportunity ID from URL on component mount
  useEffect(() => {
    // Get the opportunity ID from the URL or storage
    const urlParams = new URLSearchParams(window.location.search)
    const id = urlParams.get('id')
    if (id) {
      setOpportunityId(id)
    }
  }, [])

  // Function to toggle price visibility
  const togglePriceVisibility = () => {
    console.log("Current state:", showLinePrices)
    setShowLinePrices(prevState => !prevState)
  }

  // Force React to see table updates
  const tableKey = showLinePrices ? 'with-prices' : 'without-prices'

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button 
            onClick={handleBack} 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-2 text-foreground">Guided Estimate with Hover</h1>
        <p className="text-muted-foreground mb-8">Follow these steps to create a detailed 3D estimate for your customer.</p>

        {/* Progress Steps */}
        <div className="flex justify-between mb-12 relative">
          <div className="absolute top-5 left-0 right-0 h-1 bg-border z-0"></div>
          
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex flex-col items-center relative z-10">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  step < currentStep 
                    ? 'bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 hover:ring-2 hover:ring-primary/50 hover:ring-offset-1 transition-all' 
                    : step === currentStep
                    ? 'bg-primary/90 text-primary-foreground cursor-pointer ring-2 ring-primary/30 ring-offset-1'
                    : 'bg-muted text-muted-foreground'
                }`}
                onClick={() => {
                  // Only allow navigation to steps that have been completed or are current
                  if (step <= currentStep) {
                    setCurrentStep(step);
                  }
                }}
                role={step <= currentStep ? "button" : undefined}
                aria-label={step <= currentStep ? `Go to ${
                  step === 1 ? 'Select Job' : 
                  step === 2 ? 'Select Model' : 
                  step === 3 ? 'Calculate Costs' : 
                  'Save Estimate'
                } step` : undefined}
              >
                {step < currentStep ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span>{step}</span>
                )}
              </div>
              <span 
                className={`text-sm font-medium ${
                  step <= currentStep 
                    ? 'text-foreground cursor-pointer hover:text-primary transition-colors' 
                    : 'text-muted-foreground'
                }`}
                onClick={() => {
                  if (step <= currentStep) {
                    setCurrentStep(step);
                  }
                }}
              >
                {step === 1 && 'Select Job'}
                {step === 2 && 'Select Model'}
                {step === 3 && 'Calculate Costs'}
                {step === 4 && 'Save Estimate'}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Select Job */}
        {currentStep === 1 && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Select a Job</h2>
              <p className="text-muted-foreground mb-6">Choose the property you want to create an estimate for:</p>
              
              <div className="grid grid-cols-1 gap-4">
                {jobs.map((job) => (
                  <div 
                    key={job.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedJob === job.id 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => selectJob(job.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{job.address}</h3>
                        <p className="text-sm text-muted-foreground">Captured on {job.date}</p>
                      </div>
                      {selectedJob === job.id && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => window.open('https://hover.to/capture', '_blank')}
                >
                  + Capture a new property
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Model */}
        {currentStep === 2 && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Select a 3D Model</h2>
              <p className="text-muted-foreground mb-6">Choose a model or create a new one in Hover:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {models.map((model) => (
                  <div 
                    key={model.id}
                    className={`border rounded-lg cursor-pointer transition-all overflow-hidden ${
                      selectedModel === model.id 
                        ? 'border-primary' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => selectModel(model.id)}
                  >
                    <div className="aspect-[4/3] relative">
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        {model.thumbnail ? (
                          <Image
                            src={model.thumbnail}
                            alt={model.name}
                            width={320}
                            height={240}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-muted-foreground">No preview</div>
                        )}
                      </div>
                      {selectedModel === model.id && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="w-5 h-5 text-primary bg-background rounded-full" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium">{model.name}</h3>
                    </div>
                  </div>
                ))}

                <div
                  className="border border-dashed rounded-lg cursor-pointer transition-all overflow-hidden border-border hover:border-primary/50 flex flex-col items-center justify-center p-8"
                  onClick={openHoverDesignStudio}
                >
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-center">Create New Model</h3>
                  <p className="text-sm text-muted-foreground text-center mt-1">Open Hover Design Studio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Calculate Costs */}
        {currentStep === 3 && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Calculate Costs</h2>
              
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select an existing material list and(or) work order for {jobs.find(job => job.id === selectedJob)?.address} - {models.find(model => model.id === selectedModel)?.name}
                  </p>
                  
                  <div className="grid grid-cols-1 gap-4 mb-8">
                    {selectedModel && materials.map((material) => (
                      <div 
                        key={material.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedMaterial === material.id 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => selectMaterial(material.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">
                              {models.find(model => model.id === selectedModel)?.name}: {material.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">{material.description}</p>
                          </div>
                          {selectedMaterial === material.id && (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t mb-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a new material list and(or) work order for {jobs.find(job => job.id === selectedJob)?.address} - {models.find(model => model.id === selectedModel)?.name}
                  </p>
                  
                  <Button 
                    className="w-auto"
                    onClick={openHoverDesignStudio}
                  >
                    Calculate new costs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Save Estimate */}
        {currentStep === 4 && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Save Estimate</h2>
              <p className="text-muted-foreground mb-6">Customize your estimate details and pricing:</p>
              
              <div className="space-y-8">
                {/* Basic Info Section */}
                <div>
                  <h3 className="text-base font-medium mb-4">Estimate Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Job</label>
                      <div className="p-2 bg-muted/50 rounded border border-border">
                        {jobs.find(job => job.id === selectedJob)?.address || 'No job selected'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Model</label>
                      <div className="p-2 bg-muted/50 rounded border border-border">
                        {models.find(model => model.id === selectedModel)?.name || 'No model selected'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Option Name & Description */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="option-name" className="text-sm font-medium">Option Name</label>
                    <input 
                      id="option-name" 
                      type="text" 
                      className="w-full p-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                      defaultValue={`${materials.find(material => material.id === selectedMaterial)?.name || ''} for ${jobs.find(job => job.id === selectedJob)?.address || ''}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="option-description" className="text-sm font-medium">Description</label>
                    <textarea 
                      id="option-description" 
                      rows={3}
                      className="w-full p-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      defaultValue={`Estimate created using Hover 3D model: ${models.find(model => model.id === selectedModel)?.name || ''} with ${materials.find(material => material.id === selectedMaterial)?.name || ''}.`}
                    />
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium">Cost Breakdown</h3>
                  
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-zinc-800">
                      <h4 className="font-medium text-lg">Calculate Price</h4>
                    </div>
                    
                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label htmlFor="material-cost" className="block text-sm font-medium">Material Cost</label>
                          <div className="flex">
                            <input 
                              id="material-cost" 
                              type="number" 
                              className="w-full p-2 rounded-md border border-zinc-700 bg-zinc-900 focus:outline-none"
                              value={materialCost}
                              onChange={(e) => setMaterialCost(Number(e.target.value))}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="material-tax" className="block text-sm font-medium">Material Tax (%)</label>
                          <input 
                            id="material-tax" 
                            type="number" 
                            className="w-full p-2 rounded-md border border-zinc-700 bg-zinc-900 focus:outline-none"
                            value={materialTax}
                            onChange={(e) => setMaterialTax(Number(e.target.value))}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="labor-cost" className="block text-sm font-medium">Labor Cost</label>
                          <input 
                            id="labor-cost" 
                            type="number" 
                            className="w-full p-2 rounded-md border border-zinc-700 bg-zinc-900 focus:outline-none"
                            value={laborCost}
                            onChange={(e) => setLaborCost(Number(e.target.value))}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="labor-tax" className="block text-sm font-medium">Labor Tax (%)</label>
                          <input 
                            id="labor-tax" 
                            type="number" 
                            className="w-full p-2 rounded-md border border-zinc-700 bg-zinc-900 focus:outline-none"
                            value={laborTax}
                            onChange={(e) => setLaborTax(Number(e.target.value))}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="other-cost" className="block text-sm font-medium">Other Cost</label>
                          <input 
                            id="other-cost" 
                            type="number" 
                            className="w-full p-2 rounded-md border border-zinc-700 bg-zinc-900 focus:outline-none"
                            value={otherCost}
                            onChange={(e) => setOtherCost(Number(e.target.value))}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="other-tax" className="block text-sm font-medium">Other Tax (%)</label>
                          <input 
                            id="other-tax" 
                            type="number" 
                            className="w-full p-2 rounded-md border border-zinc-700 bg-zinc-900 focus:outline-none"
                            value={otherTax}
                            onChange={(e) => setOtherTax(Number(e.target.value))}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <label htmlFor="profit-margin" className="block text-sm font-medium">Profit Margin</label>
                          <span className="text-sm font-medium">{profitMargin}%</span>
                        </div>
                        <input 
                          id="profit-margin" 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={profitMargin}
                          onChange={(e) => setProfitMargin(Number(e.target.value))}
                          className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      
                      <div className="border-t border-zinc-800 pt-6 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Total Cost:</span>
                          <span className="text-sm font-medium">${totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Total Tax:</span>
                          <span className="text-sm font-medium">${totalTax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-lg font-bold">Total Price:</span>
                          <span className="text-lg font-bold">${totalPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Line Items */}
                <div className="pt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-medium">Line Items</h3>
                    <div className="flex items-center">
                      <label className="text-sm mr-3 cursor-pointer">
                        Show prices on estimate
                      </label>
                      <Switch
                        checked={showLinePrices}
                        onCheckedChange={(value) => {
                          console.log("Toggle clicked, current state:", value);
                          setShowLinePrices(value);
                        }}
                      />
                    </div>
                  </div>
                  <div key={`container-${showLinePrices ? 'with-prices' : 'without-prices'}`} className="border border-border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted/50">
                        <tr key={`header-${tableKey}`}>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tracking-wider">Item</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tracking-wider">Quantity</th>
                          {showLinePrices && (
                            <>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tracking-wider">Unit Price</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tracking-wider">Total</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-background divide-y divide-border">
                        {
                          [
                            {
                              name: 'GAF Timberline HDZ Shingles',
                              quantity: '30 squares',
                              unitPrice: 350,
                              total: 10500
                            },
                            {
                              name: 'James Hardie Artisan Siding',
                              quantity: '2,400 sq ft',
                              unitPrice: 9.5,
                              total: 22800
                            },
                            {
                              name: 'Weather Barrier',
                              quantity: '2,600 sq ft',
                              unitPrice: 0.65,
                              total: 1690
                            }
                          ].map((item, index) => (
                            <tr key={`item-${index}-${tableKey}`}>
                              <td className="px-4 py-3 text-sm">{item.name}</td>
                              <td className="px-4 py-3 text-sm">{item.quantity}</td>
                              {showLinePrices && (
                                <>
                                  <td className="px-4 py-3 text-sm">${item.unitPrice.toFixed(2)}</td>
                                  <td className="px-4 py-3 text-sm font-medium">${item.total.toLocaleString()}</td>
                                </>
                              )}
                            </tr>
                          ))
                        }
                        <tr>
                          <td colSpan={showLinePrices ? 4 : 2} className="px-4 py-3 text-sm">
                            <Button variant="outline" size="sm" className="h-7 px-2 text-primary">
                              Edit material list
                            </Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleBack}
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={
              (currentStep === 1 && !selectedJob) ||
              (currentStep === 2 && !selectedModel) ||
              (currentStep === 3 && !selectedMaterial)
            }
          >
            {currentStep < 4 ? 'Continue' : 'Save Estimate'}
          </Button>
        </div>
      </div>
      
      <Toaster position="top-center" />
    </main>
  )
} 