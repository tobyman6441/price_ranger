const handleSaveEstimate = (details: {
  title: string;
  description: string;
  price: number;
  afterImage: string;
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
    profitMargin: number;
    totalPrice: number;
  };
  _preventClose?: boolean;
}) => {
  const opportunityId = window.location.pathname.split('/').pop();
  
  // Update options with new details
  const updatedOptions = options.map(opt => 
    opt.id === activeDetailsOptionId ? {
      ...opt,
      title: details.title,
      description: details.description,
      price: details.price,
      afterImage: details.afterImage,
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
      details: {
        title: details.title,
        description: details.description,
        price: details.price,
        afterImage: details.afterImage,
        financingOption: details.financingOption,
        materials: details.materials || [],
        sections: details.sections || []
      }
    } : opt
  );
} 