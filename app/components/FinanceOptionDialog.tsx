"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { calculateMonthlyPayment } from "@/app/utils/calculations";
import { X, Check, Trash2 } from "lucide-react";

interface FinancingOption {
  id: string;
  name: string;
  apr: number;
  termLength: number;
}

interface FinanceOptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: any) => void;
  price: number;
  initialApr?: number;
  initialTermLength?: number;
  activeTemplateId?: string;
}

export function FinanceOptionDialog({
  isOpen,
  onClose,
  onSave,
  price,
  initialApr = 6.99,
  initialTermLength = 60,
  activeTemplateId
}: FinanceOptionDialogProps) {
  const [apr, setApr] = useState(initialApr);
  const [termLength, setTermLength] = useState(initialTermLength);
  const [showAsLowAsPrice, setShowAsLowAsPrice] = useState(true);
  
  // Save template dialog
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [financingOptionName, setFinancingOptionName] = useState("");
  const [savedOptions, setSavedOptions] = useState<FinancingOption[]>([]);
  
  // Success message
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Load saved financing options from localStorage
  useEffect(() => {
    const savedOptions = localStorage.getItem('financingOptions');
    if (savedOptions) {
      try {
        setSavedOptions(JSON.parse(savedOptions));
      } catch (error) {
        console.error('Failed to parse saved financing options:', error);
      }
    }
  }, []);
  
  // Update local state when props change
  useEffect(() => {
    setApr(initialApr);
    setTermLength(initialTermLength);
  }, [initialApr, initialTermLength]);
  
  // Monthly payment calculation
  const monthlyPayment = calculateMonthlyPayment(price, apr, termLength);

  // Save financing option to library
  const handleSaveFinancingOption = () => {
    if (!financingOptionName) return;
    
    const newOption: FinancingOption = {
      id: Date.now().toString(),
      name: financingOptionName,
      apr,
      termLength,
    };
    
    // Update local state
    const updatedOptions = [...savedOptions, newOption];
    setSavedOptions(updatedOptions);
    
    // Save to localStorage
    localStorage.setItem('financingOptions', JSON.stringify(updatedOptions));
    
    // Show success message
    setSuccessMessage(`"${newOption.name}" added to financing options library`);
    setShowSuccessMessage(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
    
    // Close save dialog
    setIsSaveDialogOpen(false);
    setFinancingOptionName("");
  };

  // Delete a saved financing option
  const handleDeleteOption = (id: string) => {
    // Find the template to show in success message
    const templateToDelete = savedOptions.find(option => option.id === id);
    
    // Remove template from savedOptions
    const updatedOptions = savedOptions.filter(option => option.id !== id);
    setSavedOptions(updatedOptions);
    
    // Update localStorage
    localStorage.setItem('financingOptions', JSON.stringify(updatedOptions));
    
    // Show success message
    if (templateToDelete) {
      setSuccessMessage(`"${templateToDelete.name}" removed from financing options library`);
      setShowSuccessMessage(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    }
  };

  // Save the main dialog settings
  const handleSaveSettings = () => {
    onSave({
      price,
      showAsLowAsPrice,
      financingOption: {
        apr,
        termLength
      }
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-zinc-800 border-zinc-700">
        <DialogTitle>Financing Options</DialogTitle>
        
        {/* Success notification */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{successMessage}</span>
            </div>
          </div>
        )}
        
        <div className="py-4 space-y-4">
          {/* "As Low As" Price Toggle */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-700">
            <div className="flex items-center gap-3">
              <Switch
                checked={showAsLowAsPrice}
                onCheckedChange={setShowAsLowAsPrice}
              />
              <Label className="text-sm font-medium">Apply Financing</Label>
            </div>
            
            {showAsLowAsPrice && (
              <div className="text-sm text-gray-300" key={`monthly-payment-${apr}-${termLength}`}>
                As low as ${monthlyPayment.toLocaleString('en-US', { maximumFractionDigits: 0 })}/month
              </div>
            )}
          </div>
          
          {showAsLowAsPrice && (
            <>
              {/* Saved Financing Templates Section */}
              {savedOptions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium border-b pb-2">Saved Templates</h3>
                  <div className="space-y-2">
                    {savedOptions.map((option) => (
                      <div
                        key={option.id}
                        className="flex justify-between items-center p-2 border border-zinc-700 rounded-lg bg-zinc-900 hover:bg-zinc-700/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-200">{option.name}</p>
                          <p className="text-sm text-gray-400">
                            {option.apr}% APR for {option.termLength} months
                          </p>
                          <p className="text-sm text-gray-400">
                            As low as ${calculateMonthlyPayment(price, option.apr, option.termLength).toLocaleString('en-US', { maximumFractionDigits: 0 })}/month
                          </p>
                          {activeTemplateId === option.id && (
                            <p className="text-xs text-green-500 mt-1 font-medium">Currently Applied</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOption(option.id)}
                            className="text-gray-400 hover:text-gray-200"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setApr(option.apr);
                              setTermLength(option.termLength);
                              // Auto-apply this template
                              onSave({
                                price,
                                showAsLowAsPrice,
                                financingOption: {
                                  id: option.id,
                                  name: option.name,
                                  apr: option.apr,
                                  termLength: option.termLength
                                }
                              });
                              onClose();
                            }}
                            className="text-gray-200 hover:text-white border-zinc-700 hover:border-zinc-600"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-sm font-medium border-b border-zinc-700 pb-2">Configure Financing</h3>
                <p className="text-xs text-gray-400 mb-2">These settings determine the monthly payment calculation for "As low as" pricing.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="apr">APR %</Label>
                    <Input
                      id="apr"
                      type="number"
                      value={apr}
                      onChange={(e) => {
                        const newApr = Number(e.target.value);
                        setApr(newApr);
                      }}
                      placeholder="Enter APR %"
                      step="0.01"
                      className="bg-zinc-900 border-zinc-700"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="termLength">Term Length</Label>
                    <Input
                      id="termLength"
                      type="number"
                      value={termLength}
                      onChange={(e) => {
                        const newTermLength = Number(e.target.value);
                        setTermLength(newTermLength);
                      }}
                      placeholder="Enter term length"
                      className="bg-zinc-900 border-zinc-700"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsSaveDialogOpen(true)} className="border-zinc-700 hover:bg-zinc-800">
                  Save to Library
                </Button>
                <Button variant="outline" onClick={onClose} className="border-zinc-700 hover:bg-zinc-800">
                  Cancel
                </Button>
                <Button onClick={handleSaveSettings}>
                  Apply Settings
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Save Template Dialog */}
        <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
          <DialogContent className="sm:max-w-md bg-zinc-800 border-zinc-700">
            <DialogTitle>Save Financing Option</DialogTitle>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="optionName">Financing Option Name</Label>
                <Input
                  id="optionName"
                  value={financingOptionName}
                  onChange={(e) => setFinancingOptionName(e.target.value)}
                  placeholder="Enter a name for this financing option"
                  className="bg-zinc-900 border-zinc-700"
                />
              </div>
              
              <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-md space-y-2">
                <p className="text-sm font-medium text-gray-200">Settings</p>
                <p className="text-sm text-gray-400">APR: {apr}%</p>
                <p className="text-sm text-gray-400">Term Length: {termLength} months</p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsSaveDialogOpen(false)}
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveFinancingOption} 
                  disabled={!financingOptionName}
                >
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
} 