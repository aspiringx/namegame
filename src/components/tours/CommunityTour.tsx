import { StepType } from '@reactour/tour'
import {
  Brain,
  Filter,
  HelpCircle,
  LayoutGrid,
  Link,
  Plus,
  Search,
  Image as Photo,
  ArrowDown,
} from 'lucide-react'
import Image from 'next/image'

export const communityTourSteps: StepType[] = [
  {
    selector: '[data-tour="group-name"]',
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
          A fun place to meet, get acquainted, play, and do stuff together.
        </p>
      </div>
    ),
  },
  {
    selector: '[data-tour="filter-buttons"]',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <Filter size={32} />
        <p className="text-left">When you join, you initially see:</p>
        <ul className="ml-4 list-outside list-disc space-y-1 text-left">
          <li>People you've met</li>
          <li>People with real photos (not random avatars)</li>
        </ul>
        <Photo size={32} />
        <p className="text-left">
          Change the filters to see others. If you already know someone click
          their link icon <Link size={16} className="inline-block" /> to connect
          so they're in your "Met" list.
        </p>
      </div>
    ),
  },
  {
    selector: '[data-tour="sort-buttons"]',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <ArrowDown size={32} />
        <p className="text-left">
          You can sort by when you met/connected in this game (default) or name.
        </p>
      </div>
    ),
  },
  {
    selector: '[data-tour="tour-button"]',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <HelpCircle size={32} />
        <p className="text-left">Click help to watch this tour any time.</p>
      </div>
    ),
  },
  {
    selector: '[data-tour="search-input"]',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <Search size={32} />
        <p>Search for anyone within your current filters.</p>
      </div>
    ),
  },
  {
    selector: '[data-tour="view-mode-buttons"]',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <LayoutGrid size={32} />
        <p>Album view</p>
      </div>
    ),
  },
  {
    selector: '[data-tour="view-mode-buttons"]',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <Brain size={32} className="text-orange-500" />
        <p className="text-left">
          Use the Name Quiz to test your memory of faces and names.
        </p>
        <p className="text-left">
          Note: only people in your greeted tab with real photos appear in the
          quiz.
        </p>
      </div>
    ),
  },
  {
    selector: '[data-tour="greet-button"]',
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
        <p className="text-center text-2xl">Have fun!</p>
        <p className="text-left">Relationships start with names.</p>
        <p className="text-left">
          In your profile (tap your pic, then Me), install NameGame and enable
          notifications to get messages and learn about coming features, like:
        </p>
        <ul className="ml-4 list-outside list-disc space-y-1 text-left">
          <li>Announcements and reminders</li>
          <li>Discovering shared interests</li>
          <li>Group member spotlights</li>
          <li>Sub-groups</li>
          <li>Etc.</li>
        </ul>
      </div>
    ),
  },
]
