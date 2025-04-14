import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Opportunity, Option } from '../types'

interface DuplicateOptionDialogProps {
  isOpen: boolean
  onClose: () => void
  onCopyToCurrent: () => void
  onCopyToDifferent: () => void
  onCopyToNew: () => void
  option: Option
  currentOpportunity: Opportunity
}

export function DuplicateOptionDialog({
  isOpen,
  onClose,
  onCopyToCurrent,
  onCopyToDifferent,
  onCopyToNew,
  option,
  currentOpportunity
}: DuplicateOptionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-50 dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle>Duplicate Option</DialogTitle>
          <DialogDescription>
            Choose where you would like to copy "{option.title}" to:
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onCopyToCurrent()
              onClose()
            }}
            className="w-full justify-start bg-white hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
          >
            Copy to this opportunity
          </Button>
          <Button
            variant="outline"
            onClick={onCopyToDifferent}
            className="w-full justify-start bg-white hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
          >
            Copy to a different opportunity
          </Button>
          <Button
            variant="outline"
            onClick={onCopyToNew}
            className="w-full justify-start bg-white hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
          >
            Copy to a new opportunity
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 