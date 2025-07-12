import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="font-sans text-gray-800 dark:text-gray-200">
      <div className="container mx-auto max-w-3xl p-8">
        <header className="text-center mb-8">
          <Image
            src="/images/NameGame-logo-500x250.png"
            alt="NameGame logo"
            width={500}
            height={250}
            className="mx-auto w-full h-auto md:max-w-[400px]"
          />

          <p className="text-2xl text-gray-600 dark:text-gray-400">
            The ice-melting game that <i>starts with a name!</i>
          </p>
        </header>

        <section className="text-lg leading-relaxed space-y-6">
          <p>
            <b>We’re all part of groups...</b> families, friends, schools, jobs, neighborhoods, churches, teams, etc.
          </p>
          <p data-testid="sunshine-box" className="mb-4 bg-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-100 p-4 rounded-lg">
            <b>Some groups feel like sunshine!</b> People know each other’s 
            names, are comfortable together, and talking is easy.
          </p>
          <div data-testid="ice-box" className="mb-4 bg-sky-100 dark:bg-sky-900/50 dark:text-sky-100 p-4 rounded-lg">
            <p className="mb-4">
              <b>Some groups feel like ice!</b> Many people don’t know each other 
              and feel anxious about meeting, remembering names, and knowing what 
              to say.
            </p>
          </div>
        </section>

        <p className="mt-4 text-lg">
          <b>The ice is relative.</b> Long-time group members may feel 
          great while others feel invisible or anxious. 
        </p>
        <section className="mt-4 text-lg leading-relaxed space-y-6 ">
          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
            width={70}
            height={70}
            className="mx-auto w-auto h-auto center"
          />
        </section>

        <section className="mt-8">
          <h2 className="text-3xl font-bold text-center mb-6">How to Play</h2>
          <ul className="text-lg list-disc list-inside space-y-2"> 
            <li>
              <Link href="/signup" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                Sign up
              </Link>{' '}
              or{' '}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                login
              </Link>
            </li>
            <li>Create a private group*</li>
            <li>Add your name and pic</li>
            <li>Greet someone with a code</li>
          </ul>
          <p className="mt-4 text-sm italic text-gray-400 dark:text-gray-500">* Currently not available publicly. See more below.</p>
          <div className="mt-6">
            <p className="mb-4">When they scan your greeting code, they can instantly:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Join with only their first name</li>
                <li>See your name and pic</li>
                <li>Chat with you*</li>
            </ul>
            <p className="mt-4 text-sm italic text-gray-400 dark:text-gray-500">* Chat messages are intentionally limited to encourage personal interactions over devices.</p>
          </div>
        </section>

        <section className="mt-8 leading-relaxed">
          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
            width={70}
            height={70}
            className="mx-auto w-auto h-auto center"
          />
          <h3 className="text-3xl font-bold text-center mb-6">Sun Decks and Ice Blocks</h3>
          <p className="text-lg mb-4">In the game, people in your group are in two places:</p>
          <p data-testid="sun-deck-description" className="mb-4 bg-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-100 p-4 rounded-lg">
            Your <b>Sun Deck</b> shows names, pics, and chat links for people
            you greet. Happy butterflies prompt fun conversations and help you 
            remember names. 
          </p>
          <p data-testid="ice-block-description" className="mb-4 bg-sky-100 dark:bg-sky-900/50 dark:text-sky-100 p-4 rounded-lg">
            Your <b>Ice Block</b> shows the cold faces and first names 
            of people you haven't greeted. A simple greeting welcomes them 
            to your cozy Sun Deck 
            
          </p>
          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
            width={70}
            height={70}
            className="mx-auto w-auto h-auto center"
          />

          <h3 className="mt-8 text-3xl font-bold text-center mb-6">How Your Group Succeeds</h3>
          <p className="mb-4">
            <b>NameGame rewards group inclusion, not individual popularity.</b>&nbsp;
            The scoreboard guides you to see and include everyone. There's no 
            incentive for individuals to greet the most people. 
          </p>
          <p className="mb-8">
            <b>When your group starts playing, the first goal is to include people</b>&nbsp;
            by greeting them with a code. Here, Joe is connected to many people, 
            but they aren't connected to each other.
            <Image
              src="/images/graph-popular.png"
              alt="One popular person"
              width={250}
              height={250}
              className="mx-auto w-auto h-auto center my-4 shadow-lg"
              style={{ minWidth: '250px' }}
            />
            <b>The next goal is for more people to connect with each other.</b>&nbsp;
            Instead of trying to greet more people, Joe should help those he 
            knows meet each other. 
            <Image
              src="/images/graph-inclusive.png"
              alt="Many people interconnected"
              width={250}
              height={250}
              className="mx-auto w-auto h-auto center my-4 shadow-lg"
              style={{ minWidth: '250px' }}
            />
            <b>The scoreboard is just a guide.</b>&nbsp;
            The real success will be apparent when your group meets.
            More people greeting each other by name, more informal 
            conversations, etc. Playing should be easy, fun, and voluntary. 
          </p>

          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
            width={70}
            height={70}
            className="mx-auto w-auto h-auto center"
          />
          <h3 className="mt-8 text-3xl font-bold text-center mb-6">Game Tips</h3>
          <p className="mb-4">
            <b>Everyone starts as a guest.</b> The first time someone scans a 
            greeting code, they can play with only their first name, but game 
            features are limited. This is great for new people who may not want
            to share more. Existing group members can immediately add their last 
            name and photo. 
          </p>
          <p className="mb-4">
            <b>If approaching people stresses you out, no worries!</b>&nbsp; 
            Just let others greet you, starting with people you already know and 
            feel comfortable with. The game will do the rest. 
          </p>
          <p className="mb-4">
            <b>If you feel responsible for helping everyone feel welcome, chillax!</b>&nbsp;
            NameGame does it for you. Spend 10 minutes with <i>someone</i>&nbsp;
            instead of 10 seconds with <i>everyone</i>. 
          </p>
          <p className="mb-4">
            <b>Respect people who don't want to play.</b>&nbsp;
            Some people hate "sharing their information" online. You can let them 
            know that the game is private and doesn't require more than a name and 
            pic, but don't be pushy. 
          </p>
          <p className="mb-4">
            <b>Some people <i>hate</i> sharing their photos.</b>&nbsp;
            People can choose and change their photo any time. Ideally, it's 
            a profile pic others can easily recognize, but if they're photo shy, 
            they're welcome to use a different image that helps others get to 
            know them.
          </p>

          <p className="mb-4">
            <b>You can include people who can't use a phone.</b>&nbsp;
            If someone doesn't have a phone or a disability prevents them from 
            playing, you can still include them. With their permission, any 
            player can add them for others to see. People can greet them
            without requiring them to scan a code. They may have 
            a home or public computer where they can login. And admins can print 
            your group photo directory. 
          </p>
          <p className="mb-4">
            <b>What about minors?</b>&nbsp;
            If your group includes kids, some may have phones. Parents can 
            decide if/how to let them play. Parents can use a family photo 
            as their profile pic and add a caption with names. 
          </p>

          <p className="mb-4">
            <b>When your group meets, make the game visible.</b>&nbsp;
            Talk about it. Show your score. Make it fun. When people see others 
            doing it, they'll want to play. 
          </p>
          <p className="mb-4">
            <b>When more people know each other</b>, they naturally talk more, 
            discover common interests, do things together, make friends,
            and have more fun.
          </p>
          <p className="mb-4">
            <i>"You wanna be where everybody knows your name."</i> ~Cheers
          </p>
          <p className="mb-4">
            <b><i>It all starts with a name.</i></b> 
          </p>
          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
            width={70}
            height={70}
            className="mx-auto w-auto h-auto center"
          />
        </section>
        <section className="mt-8 leading-relaxed">
          <h3 className="text-3xl font-bold text-center mb-6">Wanna Play?</h3>
          <p className="mb-4">
            NameGame is currently in private beta, available by invitation only.
          </p>
          <p className="mb-4">
            If you'd like to play it in your group, connect with me (Joe) on&nbsp; 
            <a href="https://www.linkedin.com/in/jtippetts/" target="_blank" className="text-blue-600 hover:underline">LinkedIn</a>&nbsp;
            and mention NameGame.
          </p>
        </section>

      </div>
    </main>
  );
}
