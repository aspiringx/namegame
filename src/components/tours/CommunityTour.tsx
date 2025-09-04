import { StepType } from '@reactour/tour'
import Image from 'next/image'

export const communityTourSteps: StepType[] = [
  {
    selector: '[data-tour="search-input"]',
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
        <p>Use the Greet button to invite people or greet existing members.</p>
      </div>
    ),
  },
  {
    selector: 'body',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <p>That's it! Now you know how to navigate your community group.</p>
      </div>
    ),
  },
]

