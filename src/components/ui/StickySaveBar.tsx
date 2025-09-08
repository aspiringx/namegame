'use client'

import { Button } from './button'

interface StickySaveBarProps {
  isDirty: boolean
  isFormValid: boolean
  onSave: () => void
  onDiscard: () => void
}

export default function StickySaveBar({
  isDirty,
  isFormValid,
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
          You have unsaved changes.
        </p>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onDiscard}>
            Discard
          </Button>
          <Button onClick={onSave} disabled={!isFormValid}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
