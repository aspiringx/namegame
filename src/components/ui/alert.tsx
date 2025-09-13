'use client'

import React, { useState, useEffect } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import {
  XCircle as XCircleIcon,
} from 'lucide-react'

const alertVariants = cva('rounded-md p-4', {
  variants: {
    variant: {
      default:
        'bg-gray-50 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300',
      success:
        'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      destructive:
        'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      warning:
        'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const dismissButtonColorVariants = {
  success:
    'bg-green-50 text-green-500 hover:bg-green-100 dark:bg-transparent dark:text-green-400 dark:hover:bg-green-800/50',
  destructive:
    'bg-red-50 text-red-500 hover:bg-red-100 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-800/50',
  warning:
    'bg-yellow-50 text-yellow-500 hover:bg-yellow-100 dark:bg-transparent dark:text-yellow-400 dark:hover:bg-yellow-800/50',
  default:
    'bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-transparent dark:text-gray-400 dark:hover:bg-gray-800/50',
}

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof alertVariants> & {
      onDismiss?: () => void
      flashId?: string
    }
>(({ className, variant, children, onDismiss, flashId, ...props }, ref) => {
  const [isVisible, setIsVisible] = useState(true)

  const storageKey = flashId ? `namegame_flash-alert_${flashId}` : ''

  useEffect(() => {
    if (flashId && sessionStorage.getItem(storageKey) === 'dismissed') {
      setIsVisible(false)
    }
  }, [flashId, storageKey])

  const handleDismiss = () => {
    if (flashId) {
      sessionStorage.setItem(storageKey, 'dismissed')
    }
    setIsVisible(false)
    if (onDismiss) {
      onDismiss()
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <div
      ref={ref}
      role="alert"
      className={cn('relative', alertVariants({ variant }), className)}
      {...props}
    >
      <div>{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={handleDismiss}
          className={cn(
            'absolute top-1 right-1 inline-flex rounded-md p-1.5 focus:ring-2 focus:ring-offset-2 focus:outline-none',
            dismissButtonColorVariants[variant || 'default'],
            'focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900',
          )}
        >
          <span className="sr-only">Dismiss</span>
          <XCircleIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </div>
  )
})
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn('text-sm font-medium', className)} {...props} />
))
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm', className)} {...props} />
))
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription }
