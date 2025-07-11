import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="font-sans text-gray-800">
      <div className="container mx-auto max-w-3xl p-8">
        <header className="text-center mb-8">
          <Image
            src="/images/NameGame-logo-500x250.png"
            alt="NameGame logo"
            width={500}
            height={250}
            className="mx-auto w-full h-auto md:max-w-[400px]"
          />

          <p className="text-2xl text-gray-600">
            The ice-melting game that <i>starts with a name!</i>
          </p>
        </header>

        <section className="text-lg leading-relaxed space-y-6">
          <p className="text-center text-gray-600 text-sm shadow-sm p-4 bg-orange-300 rounded-lg">
            Ready to play?&nbsp;
            <Link href="/signup" className="text-indigo-600 hover:text-indigo-500">
              Sign up
            </Link>{' '}
            or{' '}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-500">
              login
            </Link> to get started.&nbsp;
            Or read on to learn more.
          </p>
          <p>
            <b>We’re all part of groups...</b> families, friends, schools, jobs, neighborhoods, churches, teams, etc.
          </p>
          <p className="mb-4 bg-yellow-300 p-4 rounded-lg">
            <b>Some groups feel like sunshine!</b> People know each other’s names, are comfortable together, and talking is easy.
          </p>
          <div className="mb-4 bg-sky-100 p-4 rounded-lg">
            <p className="mb-4">
              <b>Some groups feel like ice!</b> Many people don’t know each other 
              and feel anxious about meeting, remembering names, and knowing what 
              to say.
            </p>
            <p>
              <b>The ice is relative.</b> Long-time group members may feel 
              great while others feel invisible or uncomfortable.
            </p>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-col md:flex-row md:space-x-8">
            <div className="md:w-1/2 p-6 bg-white rounded-lg shadow-lg mb-8 md:mb-0 border border-sky-100 border-4">
              <h3 className="text-2xl font-bold text-center mb-4">Breaking ice is hard</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Fast and forceful</li>
                <li>Meeting many people</li>
                <li>Remembering many names</li>
                <li>Saying something clever</li>
                <li>Hoping people like you</li>
                <li>Achieving a goal</li>
                <li>Group focus</li>
              </ul>
            </div>
            <div className="md:w-1/2 p-6 bg-white rounded-lg shadow-lg mb-8 md:mb-0 border border-yellow-300 border-4">
              <h3 className="text-2xl font-bold text-center mb-4">Melting ice is easy</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Slow and gentle</li>
                <li>Meeting one person</li>
                <li>Remembering one name</li>
                <li>Listening with curiosity</li>
                <li>Seeing common interests</li>
                <li>Starting a relationship</li>
                <li>Personal focus</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-4 text-lg leading-relaxed space-y-6 ">
          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
            width={70}
            height={70}
            className="mx-auto w-auto h-auto center"
          />
        </section>

        <section className="mt-8 p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-6">How to Play</h2>
          <p className="text-lg mb-6">To play NameGame:</p>
          <ul className="list-disc list-inside space-y-4 text-gray-700">
            <li>
              <Link href="/signup" className="text-indigo-600 hover:text-indigo-500">
                Sign up
              </Link>{' '}
              or{' '}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-500">
                login
              </Link>
            </li>
            <li>Create a private group*</li>
            <li>Add your name and pic</li>
            <li>Greet someone with a code</li>
          </ul>
          <p className="mt-4 text-sm italic text-gray-400">* Currently not available publicly. See more below.</p>
          <div className="mt-6">
            <p className="text-lg mb-6">When they scan your greeting code, they can instantly:</p>
            <ul className="list-disc list-inside space-y-4 text-gray-700">
                <li>Join with only their first name</li>
                <li>See your name and pic</li>
                <li>Chat with you*</li>
            </ul>
            <p className="mt-4 text-sm italic text-gray-400">* Chat messages are intentionally limited to encourage personal interactions over devices.</p>
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
          <p className="text-lg mb-4">In the game, people's photos are divided into two sections:</p>
          <p className="mb-4 bg-yellow-300 p-4 rounded-lg">
            Your <b>Sun Deck</b> shows who you’ve greeted, their names, and chat 
            links. Social Butterflies flutter around your Sun Deck to help you 
            remember names and prompt interesting conversations.
          </p>
          <p className="mb-4 bg-sky-100 p-4 rounded-lg">
            Your <b>Ice Block</b> shows dim, frozen faces with only a first name. 
            Say hello to welcome someone to your cozy Sun Deck.
          </p>
          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
            width={70}
            height={70}
            className="mx-auto w-auto h-auto center"
          />

          <h3 className="mt-8 text-3xl font-bold text-center mb-6">How to "Win"</h3>
          <p className="mb-4">
            <b>NameGame rewards inclusion, not individual popularity.</b>&nbsp;
            As you play, everyone can see the group score. 
          </p>
          <p className="mb-8">
            <b>Initially, a few people will connect with many people</b>, 
            inviting them into the game. Including everyone is an important 
            start.
            <Image
              src="/images/graph-popular.png"
              alt="One popular person"
              width={250}
              height={250}
              className="mx-auto w-auto h-auto center my-4 shadow-lg"
              style={{ minWidth: '250px' }}
            />
            <b>Your score increases as more people <i>gradually</i> connect</b>.&nbsp;
            Don't rush it. The game should feel fun and natural, not 
            stressful and forced. Think tortoise, not hare.
            <Image
              src="/images/graph-inclusive.png"
              alt="Many people interconnected"
              width={250}
              height={250}
              className="mx-auto w-auto h-auto center my-4 shadow-lg"
              style={{ minWidth: '250px' }}
            />
            <b>You don't need a score to know when you're "winning".</b>&nbsp; 
            Your group will just feel it. 
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
            <b>If approaching people stresses you out, no worries!</b>&nbsp; 
            Just greet someone comfortable and familiar from your Sun Deck (or 
            let them greet you). The game will do the rest. 
          </p>
          <p className="mb-4">
            <b>If you feel responsible for helping everyone feel welcome, chillax!</b>&nbsp;
            NameGame has you covered! Spend 30 minutes with <i>someone</i>&nbsp; 
            rather than 30 seconds with <i>everyone</i>.
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
        <section className="mt-8 text-lg leading-relaxed">
          <h3 className="text-3xl font-bold text-center mb-6">Ready to Play?</h3>
          <p className="mb-4">
            NameGame is currently in a private and invitation-only beta.
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
