'use client'

import { Button } from './button'
import { Loader2 } from 'lucide-react'

interface StickySaveBarProps {
  isDirty: boolean
  isFormValid: boolean
  isSaving?: boolean
  onSave: () => void
  onDiscard: () => void
}

export default function StickySaveBar({
  isDirty,
  isFormValid,
  isSaving = false,
  onSave,
  onDiscard,
}: StickySaveBarProps) {
  if (!isDirty) {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/80 p-4 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
      <div className="container mx-auto flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isSaving ? 'Saving your changes...' : 'You have unsaved changes.'}
        </p>
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={onDiscard}
            disabled={isSaving}
          >
            Discard
          </Button>
          <Button 
            onClick={onSave} 
            disabled={!isFormValid || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
