'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast, Toaster } from 'sonner'
import { Template } from '@/app/types'

export default function NewOpportunity() {
  const [templates, setTemplates] = useState<Template[]>([])
  const router = useRouter()

  useEffect(() => {
    // Load templates from localStorage
    const savedTemplates = JSON.parse(localStorage.getItem('templates') || '[]')
    setTemplates(savedTemplates)
  }, [])

  const handleCreateBlankOpportunity = () => {
    const newId = Math.random().toString(36).substr(2, 9)
    const opportunityData = {
      id: newId,
      title: "New Opportunity",
      options: [],
      operators: [],
      lastUpdated: new Date().toISOString(),
      column: "drafts",
      promotion: undefined
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

  const handleCreateFromTemplate = (template: Template) => {
    const newId = Math.random().toString(36).substr(2, 9)
    const opportunityData = {
      ...template.data,
      id: newId,
      title: template.name,
      lastUpdated: new Date().toISOString(),
      column: "drafts",
      promotion: template.data.promotion || undefined
    }

    // Get existing opportunities
    const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]')
    
    // Add new opportunity
    opportunities.push(opportunityData)
    
    // Save to localStorage
    localStorage.setItem('opportunities', JSON.stringify(opportunities))
    
    toast.success('Created from template')
    
    // Replace current history entry instead of pushing new one
    router.replace(`/opportunity/${newId}`)
  }

  const handleDeleteTemplate = (templateId: string) => {
    // Get existing templates
    const updatedTemplates = templates.filter(template => template.id !== templateId)
    
    // Save to localStorage
    localStorage.setItem('templates', JSON.stringify(updatedTemplates))
    
    // Update state
    setTemplates(updatedTemplates)
    
    toast.success('Template deleted')
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 text-foreground">New Sales Opportunity</h1>
          <p className="text-muted-foreground mb-12">Create a new opportunity or start from an existing template</p>

          <div className="bg-card rounded-xl border border-border p-8 mb-12 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold mb-6 text-foreground">Create a blank opportunity</h2>
            <Button 
              onClick={handleCreateBlankOpportunity}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md transition-all px-6 py-5 text-lg font-medium"
            >
              + Create Blank Opportunity
            </Button>
          </div>

          {templates.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
              <h2 className="text-xl font-semibold mb-6 text-foreground">Start from a template</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-card/50 border border-border rounded-lg p-6 hover:border-primary/20 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium text-foreground">{template.name}</h3>
                      <button 
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 hover:bg-muted rounded-full"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-muted-foreground">
                        {template.data.options.length} options
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        Created {new Date(template.data.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                    <Button 
                      onClick={() => handleCreateFromTemplate(template)}
                      variant="outline"
                      className="w-full hover:bg-muted hover:border-primary/20 transition-colors"
                    >
                      Use Template
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Toaster position="top-center" />
    </main>
  )
} 