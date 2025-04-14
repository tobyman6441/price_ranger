import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface MergeOpportunityDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (sourceId: string, targetId: string) => void
  sourceOpportunity: { id: string; title: string } | null
  targetOpportunity: { id: string; title: string } | null
}

export function MergeOpportunityDialog({
  isOpen,
  onClose,
  onConfirm,
  sourceOpportunity,
  targetOpportunity
}: MergeOpportunityDialogProps) {
  if (!sourceOpportunity || !targetOpportunity) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge Opportunities</DialogTitle>
          <DialogDescription>
            Are you sure you want to merge "{sourceOpportunity.title}" into "{targetOpportunity.title}"?
            This will combine all options from both opportunities into one.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm(sourceOpportunity.id, targetOpportunity.id)
              onClose()
            }}
          >
            Merge
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 