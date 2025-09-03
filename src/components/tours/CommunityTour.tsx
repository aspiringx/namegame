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
import Image from 'next/image'

export const steps: StepType[] = [
  {
    selector: 'body',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <Image
          src="/images/butterflies.png"
          alt="NameGame social butterflies"
          width={48}
          height={48}
          className="mx-auto h-auto w-auto"
        />
        <p>Welcome to your NameGame group!</p>
        <p className="text-left">
          <b>What it is:</b> A place to meet, learn names, and get to know each
          other, ideally in person.
        </p>
        <p className="text-left">
          <b>What it's not:</b> Another mindnumbing social media app that leaves
          you feeling empty despite having hundreds of "friends".
        </p>
      </div>
    ),
  },
  {
    selector: 'body',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <Image
          src="/images/butterflies.png"
          alt="NameGame social butterflies"
          width={48}
          height={48}
          className="mx-auto h-auto w-auto"
        />
        <p className="text-left">
          Gradually getting to know a few people well is waaaaay more important
          than connecting with everyone.
        </p>
        <p className="text-left">
          Take your time. There's no pressure; no incentive to appear popular or
          influential.
        </p>
      </div>
    ),
  },
  {
    selector: 'body',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <Image
          src="/images/butterflies.png"
          alt="NameGame social butterflies"
          width={48}
          height={48}
          className="mx-auto h-auto w-auto"
        />
        <p className="text-left">
          With that said, you can make this group more more welcome and
          inclusive, even if you're not a social butterfly.
        </p>
        <p className="text-left">How?</p>
      </div>
    ),
  },
  {
    selector: '[data-tour="greeted-not-greeted-tabs"]',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-left">
          Start with your Greeted and Not Greeted tabs.
        </p>
        <p className="text-left">
          <b>Greeted:</b> people you've greeted with a code or vice-versa.
        </p>
        <p className="text-left">
          <b>Not Greeted:</b> people you haven't greeted.
        </p>
      </div>
    ),
  },
  {
    selector: '[data-tour="greet-button"]',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <Plus size={32} />
        <p className="text-left">Use the Greet button to:</p>
        <ol className="ml-8 list-decimal text-left">
          <li>Invite people into this group</li>
          <li>Greet people in the Not Greeted tab</li>
        </ol>
      </div>
    ),
  },
  {
    selector: 'body',
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
    selector: 'body',
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
    selector: 'body',
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
    selector: 'body',
    content:
      'Use the Reset button above to start over with the focus back on you.',
  },
  {
    selector: 'body',
    content: 'Welcome to your community group!',
  },
  {
    selector: 'body',
    content: 'Click on any family member to see more details.',
  },
  {
    selector: 'body',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        Have fun! Invite missing family members to complete your family tree.
      </div>
    ),
  },
]
