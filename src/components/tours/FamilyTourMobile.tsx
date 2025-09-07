import { StepType } from '@reactour/tour'
import {
  Brain,
  ChevronDown,
  ChevronUp,
  GitFork,
  HelpCircle,
  Image as Photo,
  LayoutGrid,
  Link,
  List,
  Plus,
  Search,
  ArrowDown,
  ArrowUp,
} from 'lucide-react'
import Image from 'next/image'

export const familyTourMobileSteps: StepType[] = [
  {
    selector: 'body[data-this-does-not-exist]',
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
        <p>Welcome to your family group!</p>
        <p className="text-left">
          A place to stay connected with extended family.
        </p>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-2">
          <ArrowDown size={32} />
          <ArrowUp size={32} />
        </div>
        <p className="text-left">
          You initially see family members in the order they joined. This mobile
          view shows fewer options than larger screens.
        </p>
        <HelpCircle size={32} />
        <p className="text-left">Tap help to see this tour again any time.</p>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <Photo size={32} />
        <p className="text-left">
          Use the "real photos" filter to only see real pics (new members get a
          fake image until they upload a real photo in their profile).
        </p>
        <p className="text-left">
          If you see someone without a real pic, they might be unsure how to do
          it. Offer to help.
        </p>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <Search size={32} />
        <p className="text-left">
          Use the search bar to find anyone by name. If your "real photos"
          filter is on, it will only search those people.
        </p>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-2">
          <LayoutGrid size={32} />
          <List size={32} />
          <GitFork size={32} />
        </div>
        <p className="text-left">
          Use the view modes to see people in a grid (bigger photos), list, or
          in an interactive family tree.
        </p>
        <GitFork size={32} />
        <p className="text-left">
          The family tree view has its own tour like this one so you can learn
          the fun options.
        </p>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <Brain size={32} className="text-orange-500" />
        <p className="text-left">
          Use the Name Quiz to test your memory of faces and names. Perfect for
          brushing up before the next family gathering.
        </p>
        <p className="text-left">
          Note: only family members with real photos appear in the quiz.
        </p>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <Plus size={32} />
        <p className="text-left">
          The Invite button appears below after you've completed your profile.
          Use it to invite family members into this private group.
        </p>
        <p className="text-left">Click it to create a greeting code.</p>
        <ul className="ml-4 list-outside list-disc space-y-1 text-left">
          <li>A QR code others can scan</li>
          <li>Or a link/URL you can send</li>
        </ul>
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
          width={48}
          height={48}
          className="mx-auto h-auto w-auto"
        />
        <p className="text-center text-2xl">Have fun!</p>
        <p className="text-left">
          In your profile be sure to <i>install app</i> and{' '}
          <i>enable notifications</i> to get the latest family news from your
          group admin(s).
        </p>
        <ul className="ml-4 list-outside list-disc space-y-1 text-left">
          <li>Announcements</li>
          <li>Reminders</li>
          <li>Etc.</li>
        </ul>
      </div>
    ),
  },
]
