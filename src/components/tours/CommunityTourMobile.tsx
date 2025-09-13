import { PopoverContentProps, StepType } from '@reactour/tour'
import { Button } from '@/components/ui/button'
import {
  ArrowDown,
  Filter,
  Gamepad2,
  HelpCircle,
  LayoutGrid,
  Link,
  Plus,
  Search,
} from 'lucide-react'
import Image from 'next/image'

export const communityTourMobileSteps: StepType[] = [
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
        <p>Welcome to your NameGame group!</p>
        <p className="text-left">
          A fun place to meet, get acquainted, play, and do stuff together.
        </p>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <Filter size={32} className="text-orange-500" />
        <p className="text-left">Use filters (top left) to see:</p>
        <ul className="ml-4 list-outside list-disc space-y-1 text-left">
          <li>People you&apos;ve met or not</li>
          <li>Only people with real photos</li>
        </ul>
        <p className="text-left">
          You initially see people you&apos;ve &quot;met&quot; with a greeting
          code (QR code or link you used to enter here).
        </p>
        <p className="text-left">
          If you already know someone in the &quot;not met&quot; list, click
          their link icon <Link size={16} className="inline-block" /> to
          connect.
        </p>
        <p className="text-left">
          Everyone (including you) starts with a random cartoon pic until they
          upload a real one.
        </p>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <ArrowDown size={32} className="text-orange-500" />
        <p className="text-left">
          You can sort people by when you &quot;met&quot; (in this game) or
          first and last name.
        </p>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <HelpCircle size={32} className="text-orange-500" />
        <p className="text-left">Click help to watch this tour any time.</p>
        <p className="text-left">
          You can click on the dots or arrows to quickly move to a specific
          section.
        </p>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <Search size={32} className="text-orange-500" />
        <p className="text-left">
          Search for anyone within your current filters.
        </p>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <LayoutGrid size={32} className="text-orange-500" />
        <p className="text-left">
          On the top right is the photo view. When you play games, click here to
          return to photos.
        </p>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <Gamepad2 size={32} className="text-orange-500" />
        <p className="text-left">NameGame is a game!</p>
        <p className="text-left">
          Go here to play games, starting with the Name Quiz.
        </p>
        <p className="text-left">
          Games makes it easy to meet, remember names, and interact. Just play!
        </p>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <Plus size={32} className="text-orange-500" />
        <p className="text-left">Greet or Connect!</p>
        <p className="text-left">
          When you&apos;re profile is complete, you&apos;ll see a Greet button
          below. Use it to make greeting codes.
        </p>
        <p className="text-left">
          A greeting code is both a QR code people can scan with their camera
          and/or a link you can send.
        </p>
        <p className="text-left">When people scan or tap it:</p>
        <ul className="ml-4 list-outside list-disc space-y-1 text-left">
          <li>It lets them into this private group and connects you</li>
          <li>Or just connects you if they&apos;re already in the group</li>
        </ul>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: ({ setIsOpen }: PopoverContentProps) => (
      <div className="flex flex-col items-center gap-4 text-center">
        <Image
          src="/images/butterflies.png"
          alt="NameGame social butterflies"
          width={64}
          height={64}
          className="mx-auto h-auto w-auto"
        />
        <p className="text-center text-2xl">Have Fun!</p>
        <p className="text-left">
          Relationships start with names. They grow naturally as you do fun and
          interesting stuff together.
        </p>
        <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
          Close Tour
        </Button>
      </div>
    ),
  },
]
