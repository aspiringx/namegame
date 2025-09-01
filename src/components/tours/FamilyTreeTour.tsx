import { StepType } from '@reactour/tour'

export const steps: StepType[] = [
  {
    selector: '[data-tour="family-tree-controls"]',
    content:
      'These are the controls for the family tree. Use full screen, zoom in, zoom out, and fit the view.',
  },
  {
    selector: '[data-tour="fullscreen-button"]',
    content: 'Use this button to enter or exit full-screen mode.',
  },
  {
    selector: '.react-flow__node',
    content: 'Click on any family member to see more details about them.',
  },
]
