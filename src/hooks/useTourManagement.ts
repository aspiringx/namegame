import { useTour } from '@reactour/tour'
import { useEffect, useCallback } from 'react'

const getTourSeenKey = (tourId: string) => `namegameHasSeenTour_${tourId}`

export const useTourManagement = (tourId: string) => {
  const { setIsOpen, setCurrentStep } = useTour()

  const startTour = useCallback(() => {
    setCurrentStep(0)
    setIsOpen(true)
  }, [setIsOpen])

  useEffect(() => {
    const tourSeenKey = getTourSeenKey(tourId)
    try {
      const hasSeenTour = localStorage.getItem(tourSeenKey)
      if (!hasSeenTour) {
        startTour()
        localStorage.setItem(tourSeenKey, 'true')
      }
    } catch (error) {
      console.error('Could not access localStorage:', error)
    }
  }, [tourId, startTour])

  return { startTour }
}
