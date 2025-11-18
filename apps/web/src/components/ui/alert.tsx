'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { XCircle as XCircleIcon } from 'lucide-react'

const alertVariants = cva('rounded-md p-4', {
  variants: {
    variant: {
      default: 'bg-gray-900/30 text-gray-300',
      success: 'bg-green-900/30 text-green-300',
      destructive: 'bg-red-900/30 text-red-300',
      warning: 'bg-yellow-900/30 text-yellow-300',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const dismissButtonColorVariants = {
  success:
    'bg-green-50 text-green-500 hover:bg-green-100 bg-transparent text-green-400 hover:bg-green-800/50',
  destructive:
    'bg-red-50 text-red-500 hover:bg-red-100 bg-transparent text-red-400 hover:bg-red-800/50',
  warning:
    'bg-yellow-50 text-yellow-500 hover:bg-yellow-100 bg-transparent text-yellow-400 hover:bg-yellow-800/50',
  default: 'bg-transparent text-gray-400 hover:bg-gray-800/50',
}

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof alertVariants> & {
      onDismiss?: () => void
      flashId?: string
      autoCloseAfter?: number // Duration in milliseconds
    }
>(
  (
    {
      className,
      variant,
      children,
      onDismiss,
      flashId,
      autoCloseAfter,
      ...props
    },
    ref,
  ) => {
    const [isVisible, setIsVisible] = useState(true)

    const storageKey = flashId ? `namegame_flash-alert_${flashId}` : ''

    useEffect(() => {
      if (flashId && sessionStorage.getItem(storageKey) === 'dismissed') {
        setIsVisible(false)
      }
    }, [flashId, storageKey])

    const handleDismiss = useCallback(() => {
      if (flashId) {
        sessionStorage.setItem(storageKey, 'dismissed')
      }
      setIsVisible(false)
      if (onDismiss) {
        onDismiss()
      }
    }, [flashId, storageKey, onDismiss])

    // Auto-close functionality
    useEffect(() => {
      if (autoCloseAfter && autoCloseAfter > 0) {
        const timer = setTimeout(() => {
          handleDismiss()
        }, autoCloseAfter)

        return () => clearTimeout(timer)
      }
    }, [autoCloseAfter, handleDismiss])

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
              'focus:ring-offset-gray-50 focus:ring-offset-gray-900',
            )}
          >
            <span className="sr-only">Dismiss</span>
            <XCircleIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
    )
  },
)
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
