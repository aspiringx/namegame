import { StepType } from '@reactour/tour'
import { Button } from '@/components/ui/button'
import { Link as LinkIcon, Plus } from 'lucide-react'
import Image from 'next/image'

export const getGreetedSteps = (onNext: () => void): StepType[] => [
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
    selector: 'body',
    position: 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <h3 className="text-xl font-bold">Ready for the next step?</h3>
        <p>
          Next, we'll look at the members you haven't greeted yet. This is a
          great way to build community!
        </p>
        <Button onClick={onNext}>Continue</Button>
      </div>
    ),
  },
]

export const getNotGreetedSteps = (notGreetedCount: number): StepType[] => [
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
    selector:
      notGreetedCount > 0 ? '[data-tour="not-greeted-member-card"]' : 'body',
    position: notGreetedCount > 0 ? 'top' : 'center',
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        {notGreetedCount > 0 ? (
          <>
            <p className="text-left">
              If you already know someone in this list, you don't need to use
              the "Greet" button.
            </p>
            <p className="text-left">
              Instead, you can click the <LinkIcon className="inline h-4 w-4" />{' '}
              icon to instantly mark them as greeted.
            </p>
          </>
        ) : (
          <p>
            This tab is empty right now, but as people join the group, they'll
            appear here until you greet them.
          </p>
        )}
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
