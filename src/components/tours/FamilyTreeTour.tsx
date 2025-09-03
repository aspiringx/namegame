import { StepType } from '@reactour/tour'
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  EllipsisVertical,
  Expand,
  GitFork,
  HelpCircle,
  LayoutGrid,
  Mars,
  Maximize,
  Plus,
  Transgender,
  Venus,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import Link from 'next/link'

export const steps: StepType[] = [
  {
    selector: 'body',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <GitFork size={32} strokeWidth={1.5} />
        <p>Welcome to your family tree!</p>
      </div>
    ),
  },
  {
    selector: 'body .react-flow__node',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <GitFork size={32} />
        <p className="text-left">
          Initially, you are the focus. You may not see others until you're
          connected.
        </p>
        <p className="text-left">
          Your family tree is made from your direct <b>parent/child</b> and{' '}
          <b>spouse/partner</b> relationships.
        </p>
        <p className="text-left">
          Everything else (siblings, aunts, uncles, etc.) flow from the direct
          relationships.
        </p>
      </div>
    ),
  },
  {
    selector: '[data-tour="family-group-grid-button"]',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <GitFork size={32} />
        <p>To add relationships:</p>
        <ol className="ml-8 list-decimal text-left">
          <li>
            Tap the grid (
            <LayoutGrid size={16} className="inline align-middle" />) view
          </li>
          <li>Find yourself</li>
          <li>
            Tap your three-dot (
            <EllipsisVertical size={16} className="inline align-middle" />) menu
            and choose <i>Relate</i>
          </li>
        </ol>
      </div>
    ),
  },
  {
    selector: 'body .react-flow__node',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <Plus size={32} />
        <p className="text-left">
          If those you're related to aren't here yet, new options appear when
          you've completed your profile.
        </p>
        <ol className="ml-8 list-decimal text-left">
          <li>
            Invite (<Plus size={16} className="inline align-middle" />) others
            by tapping the blue Invite button at the bottom of your group.
          </li>
          <li>
            If the person is deceased, a minor, or unable/unavailable, you can
            add them as a <Link href="/me/users">Managed User</Link>.
          </li>
        </ol>
      </div>
    ),
  },
  {
    selector: 'body .react-flow__node',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-2">
          <Venus size={32} />
          <Mars size={32} />
          <Transgender size={32} />
        </div>
        <p className="text-left">
          Users can identify as He, She, They, or none (not selected). When
          known, we use gendered relationship labels like Mother or Father. If
          not we use neutral labels like Parent.
        </p>
        <p className="text-left">
          <i>Pibling</i> is gender-neutral for aunt or uncle (parent's sibling).
        </p>
        <p className="text-left">
          <i>Nibling</i> is gender-neutral for niece or nephew (sibling's
          children).
        </p>
      </div>
    ),
  },
  {
    selector: '.react-flow__node',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-2">
          <ChevronUp size={32} />
          <ChevronDown size={32} />
          <ChevronLeft size={32} />
        </div>
        <p>
          Use arrows to see ancestors (up), spouse/partner and descendents
          (down), and siblings (left).
        </p>
        <p>
          Arrows only appear if those relationships are available on a person.
        </p>
      </div>
    ),
  },
  {
    selector: '[data-tour="family-tree-controls"]',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <p>Use these view controls for:</p>
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-2">
            <Maximize size={24} />
            <span>Full screen</span>
          </div>
          <div className="flex items-center gap-2">
            <ZoomIn size={24} />
            <span>Zoom in</span>
          </div>
          <div className="flex items-center gap-2">
            <ZoomOut size={24} />
            <span>Zoom out</span>
          </div>
          <div className="flex items-center gap-2">
            <Expand size={24} />
            <span>Fit view</span>
          </div>
          <div className="flex items-center gap-2">
            <HelpCircle size={24} />
            <span>Help (this tour)</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    selector: '[data-tour="reset-tree-button"]',
    content:
      'Use the Reset button above to start over with the focus back on you.',
  },
  {
    selector: '.react-flow__node',
    content: 'Click on any family member to see more details.',
  },
  {
    selector: '.react-flow__node',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        Have fun! Invite missing family members to complete your family tree.
      </div>
    ),
  },
]
