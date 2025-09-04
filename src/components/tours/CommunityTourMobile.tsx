import { StepType } from '@reactour/tour'
import {
  Brain,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  LayoutGrid,
  Link,
  List,
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
          width={48}
          height={48}
          className="mx-auto h-auto w-auto"
        />
        <p>Welcome to your NameGame group!</p>
        <p className="text-left">
          A place to meet, learn names, and get to know people in this group.
        </p>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <Link size={32} />
        <p className="text-left">
          You have two tabs on top: Greeted and Not Greeted.
        </p>
        <ul className="ml-4 list-outside list-disc space-y-1 text-left">
          <li>
            <b>Greeted</b> shows the people you've already met or know. You can
            do more with people in this tab.
          </li>
          <li>
            <b>Not Greeted</b> shows people you haven't met or connected with in
            the game.
          </li>
        </ul>
        <p className="text-left">
          If you already know someone in Not Greeted, just click their{' '}
          <Link size={16} className="inline-block" /> icon to add them to your
          Greeted tab.
        </p>
        <p className="text-left">
          If you don't know them, you can share a greeting code, which we'll see
          next.
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
          The Greet button below appears after you've completed your profile.
        </p>
        <p className="text-left">
          Use it to invite people into this group or greet existing members in
          your Not Greeted tab.
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
        <div className="flex items-center gap-2">
          <ChevronUp size={32} />
          <ChevronDown size={32} />
        </div>
        <p className="text-left">
          You can sort group members by Greeted (when they were added to your
          Greeted tab).
        </p>
        <HelpCircle size={32} />
        <p>Or click help to see this tour again.</p>
      </div>
    ),
  },
  {
    selector: 'body[data-this-does-not-exist]',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <Search size={32} />
        <p>Or search for anyone by name.</p>
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
        </div>
        <p>View people in a grid (bigger photos) or list.</p>
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
          Use the Name Quiz to test your memory of faces and names of people in
          your Greeted tab.
        </p>
        <p className="text-left">
          Note: only people with real photos (not a random avatar from when they
          first join) appear in the quiz.
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
          width={48}
          height={48}
          className="mx-auto h-auto w-auto"
        />
        <p className="text-center text-2xl">Have fun!</p>
        <p className="text-left">
          Be sure to <i>Enable Notifications</i> in your profile to learn when
          new features are available, like:
        </p>
        <ul className="ml-4 list-outside list-disc space-y-1 text-left">
          <li>Discovering people with shared interests</li>
          <li>Games based on stories people share</li>
          <li>Map view of your group</li>
          <li>Sub-groups</li>
          <li>Etc.</li>
        </ul>
      </div>
    ),
  },
]
