import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Opportunity, Option } from '../types'
import { useRouter } from 'next/navigation'

interface SelectOpportunityDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (opportunityId: string) => void
  currentOpportunityId: string
  opportunities: Opportunity[]
}

export function SelectOpportunityDialog({
  isOpen,
  onClose,
  onSelect,
  currentOpportunityId,
  opportunities
}: SelectOpportunityDialogProps) {
  const router = useRouter()
  const filteredOpportunities = opportunities.filter(opp => opp.id !== currentOpportunityId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-50 dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle>Select Opportunity</DialogTitle>
          <DialogDescription>
            Choose which opportunity you would like to copy the option to:
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
          {filteredOpportunities.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No other opportunities found
            </div>
          ) : (
            filteredOpportunities.map((opportunity) => (
              <Button
                key={opportunity.id}
                variant="outline"
                onClick={() => onSelect(opportunity.id)}
                className="w-full justify-start bg-white hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
              >
                {opportunity.title}
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 