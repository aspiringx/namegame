import { StepType } from '@reactour/tour'
import {
  Wrench,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  MousePointerClick,
  User,
  GitFork,
  SlidersHorizontal,
  HelpCircle,
  Mars,
  Venus,
  Transgender,
  Grid,
  EllipsisVertical,
  LayoutGrid,
  Plus,
} from 'lucide-react'
import Link from 'next/link'

// For mobile steps, use a non-matching selector since StepType expects it.
// Mobile tours are centered and shouldn't refer to highlighted elements.
export const steps: StepType[] = [
  {
    selector: 'body[data-this-does-not-exist]',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <GitFork size={32} strokeWidth={1.5} />
        <p>Welcome to your family tree!</p>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <GitFork size={32} />
        <p className="text-left">
          Your family tree is made from your direct <b>parent/child</b> and{' '}
          <b>spouse/partner</b> relationships.
        </p>
        <p className="text-left">
          Everything else (siblings, aunts, uncles, etc.) flow from these.
          Including those through marriage (in-law, step), a shared parent
          (half), and co-relationships through partners.
        </p>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <GitFork size={32} />
        <p>
          When you're new here, you're not connected to others in the tree until
          you add relationships.
        </p>
        <ol className="ml-8 list-decimal text-left">
          <li>
            Tap the grid (
            <LayoutGrid size={16} className="inline align-middle" />) view above
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
    selector: 'body[data-this-does-not-exist]',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <Plus size={32} />
        <p className="text-left">
          If those you're related to aren't here yet, there are options you only
          see if you've completed your profile (photo, last name, etc.).
        </p>
        <ol className="ml-8 list-decimal text-left">
          <li>
            Invite (<Plus size={16} className="inline align-middle" />) others
            by tapping the blue Invite button at the bottom.
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
    selector: 'body[data-this-does-not-exist]',
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
    selector: 'body[data-this-does-not-exist]',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-2">
          <ChevronUp size={32} />
          <ChevronDown size={32} />
          <ChevronLeft size={32} />
        </div>
        <span>
          Use arrows to see ancestors (up), spouse/parnter and descendents
          (down), and siblings (left).
        </span>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <SlidersHorizontal size={32} strokeWidth={1.5} />
        <p>Use view tools (bottom left) for full screen, zoom, etc.</p>
        <HelpCircle size={32} strokeWidth={1.5} />
        <p>Or help to see this tour again.</p>
      </div>
    ),
  },
]
