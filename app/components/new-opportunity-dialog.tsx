import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

interface NewOpportunityDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (title: string) => void
}

export function NewOpportunityDialog({
  isOpen,
  onClose,
  onCreate
}: NewOpportunityDialogProps) {
  const [title, setTitle] = useState('')

  const handleCreate = () => {
    if (title.trim()) {
      onCreate(title)
      setTitle('')  // Reset the input field after creating
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-50 dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle>New Opportunity</DialogTitle>
          <DialogDescription>
            Enter a name for the new opportunity:
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3 bg-white dark:bg-gray-700"
              placeholder="Enter opportunity name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreate()
                }
              }}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={handleCreate}
            className="bg-primary hover:bg-primary/90 text-black"
          >
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 