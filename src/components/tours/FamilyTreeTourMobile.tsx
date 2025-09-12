import { StepType } from '@reactour/tour'
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  GitFork,
  SlidersHorizontal,
  HelpCircle,
  Mars,
  Venus,
  Transgender,
  EllipsisVertical,
  LayoutGrid,
  Plus,
  Lock,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// For mobile steps, use a non-matching selector since StepType expects it.
// Mobile tours are centered and shouldn't refer to highlighted elements.
export const steps: StepType[] = [
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <Image
          src="/images/butterflies.png"
          alt="NameGame social butterflies"
          width={64}
          height={64}
          className="mx-auto h-auto w-auto"
        />
        <GitFork size={32} strokeWidth={1.5} className="text-orange-500" />
        <p>Welcome to your family tree!</p>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <GitFork size={32} className="text-orange-500" />
        <p className="text-left">
          Initially, you are the focus. You may not see others until you're
          connected.
        </p>
        <p className="text-left">
          Your family tree is made from direct <b>parent/child</b> and{' '}
          <b>spouse/partner</b> relationships.
        </p>
        <p className="text-left">
          All others (siblings, aunts, uncles, etc.) flow from the direct
          relationships.
        </p>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <GitFork size={32} className="text-orange-500" />
        <p>To add relationships:</p>
        <ol className="ml-8 list-decimal text-left">
          <li>
            Tap the grid (
            <LayoutGrid size={16} className="inline align-middle" />) view above
          </li>
          <li>Find yourself</li>
          <li>
            Tap your three-dot (
            <EllipsisVertical size={16} className="inline align-middle" />) menu
            and choose <i>Relationships</i>
          </li>
        </ol>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <Plus size={32} className="text-orange-500" />
        <p className="text-left">
          If those you're related to aren't here yet, there are options you only
          see if you've completed your profile (photo, last name, etc.).
        </p>
        <ol className="ml-8 list-decimal text-left">
          <li>
            Invite (<Plus size={16} className="inline align-middle" />) others
            by tapping the blue Invite button at the bottom of your group.
          </li>
          <li>
            If the person is deceased, a minor, or unable/unavailable, you can
            add them as a <Link href="/me/users">Managed User</Link> from your
            profile.
          </li>
        </ol>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-2">
          <Venus size={32} className="text-orange-500" />
          <Mars size={32} className="text-orange-500" />
          <Transgender size={32} className="text-orange-500" />
        </div>
        <p className="text-left">
          Users may identify as He, She, They, or none (not selected).
        </p>
        <ul className="ml-8 list-disc text-left">
          <li>If known, we use gendered labels (e.g. Mother/Father)</li>
          <li>If not, we use neutral labels (e.g. Parent)</li>
          <li>
            <i>Pibling</i> is gender-neutral for aunt or uncle (parent's
            sibling)
          </li>
          <li>
            <i>Nibling</i> is gender-neutral for niece or nephew (sibling's
            children)
          </li>
        </ul>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-2">
          <ChevronUp size={32} className="text-orange-500" />
          <ChevronDown size={32} className="text-orange-500" />
          <ChevronLeft size={32} className="text-orange-500" />
        </div>
        <p className="text-left">
          Use arrows to see ancestors (up), spouse/partner and descendents
          (down), and siblings (left).
        </p>
        <p className="text-left">
          Arrows only appear when relationships are defined and they can lead to
          something.
        </p>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <SlidersHorizontal
          size={32}
          strokeWidth={1.5}
          className="text-orange-500"
        />
        <p className="text-left">
          Use view control (bottom left) for full screen, zoom, etc.
        </p>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content:
      'Use the Reset button above to start over with the focus back on you.',
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: 'Click on any family member to see more details.',
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <Lock size={32} className="text-orange-500" />
        <p className="text-left">
          NameGame is private. Your personal and family information is never
          shared or sold. No ads.
        </p>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <Image
          src="/images/butterflies.png"
          alt="NameGame social butterflies"
          width={64}
          height={64}
          className="mx-auto h-auto w-auto"
        />
        <p className="text-2xl">Have fun!</p>
        <p className="text-left">
          Invite missing family members to complete your family tree.
        </p>
      </div>
    ),
  },
]
