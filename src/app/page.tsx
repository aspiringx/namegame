import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="bg-gray-50 font-sans text-gray-800">
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
            The ice-melting game that starts with a name
          </p>
        </header>

        <section className="text-lg leading-relaxed space-y-6">
          <p className="text-center text-gray-600 text-sm">
            Ready to play?&nbsp;
              <Link href="/signup" className="text-indigo-600 hover:text-indigo-500">
                Sign up
              </Link>{' '}
              or{' '}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-500">
                login
              </Link>.&nbsp;
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
              <b>The ice is relative.</b> Established group members may feel 
              great while others, especially new or reserved people, may feel 
              invisible or unimportant.
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

        <section className="mt-8 p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-6">How to Play</h2>
          <p className="text-lg mb-6">To start playing NameGame:</p>
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
          <p className="mt-4 text-sm italic text-gray-400">* Currently not available publicly</p>
          <div className="mt-6">
            <p className="text-lg mb-6">When they scan your greeting code (with their phone), they can instantly:</p>
            <ul className="list-disc list-inside space-y-4 text-gray-700">
                <li>Join with only their first name</li>
                <li>See your name and pic</li>
                <li>Chat with you*</li>
            </ul>
            <p className="mt-4 text-sm italic text-gray-400">* Chat messages are intentionally limited. Don't chat, talk!</p>
          </div>
        </section>

        <section className="mt-12 text-lg leading-relaxed">
          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
            width={70}
            height={70}
            className="mx-auto w-auto h-auto center"
          />

          <h3 className="text-3xl font-bold text-center mb-6">Here Comes the Sun</h3>
          <p className="mb-4">
            <b>NameGame is not a popularity contest!</b>&nbsp;
            When you begin, your shiny-happy extroverts and connectors 
            will help you start melting the ice, but aren't rewarded for having 
            the most connections. Your group succeeds when <i>everyone 
            connects with a few people</i>, not when <i>a few people connect with 
            everyone</i>.
          </p>
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

          <h3 className="mt-8 text-3xl font-bold text-center mb-6">Game Tips</h3>
          <p className="mb-4">
            <b>If you feel uncomfortable approaching new people, no worries!</b>&nbsp; 
            Just greet someone familiar from your Sun Deck (or let them greet 
            you). Sun Decks are a safe, personal gathering place to get to know 
            people without stress. 
          </p>
          <p className="mb-4">
            <b>If you feel responsible for helping everyone feel welcome, chillax!</b>&nbsp;
            NameGame has you covered! You can now be the person who spends 30 minutes 
            with <i>someone</i> rather than 30 seconds with <i>everyone</i>.
          </p>
          <p className="mb-4">
            <b>When your group meets, regularly encourage and make time for playing.</b>&nbsp;
            Make it visible. Show your group's score. For many, being social is 
            awkward, but playing a game is fun. 
          </p>
          <p className="mb-4">
            <b>We only have time to be close friends with a few people.</b>&nbsp;
            It's normal for most people in a group to just be acquaintances. 
          </p>
          <p className="mb-4">
            <b>Participating in formal group roles and activities</b> is a great 
            way to do this when it brings people together with plenty of time for 
            free, personal conversations. If you find yourself acting alone or in 
            settings too formal or large for regular personal interactions, you 
            may just feel used and tired instead of fulfilled. 
          </p>
          <p className="mb-4">
            <b><i>Group-friends</i> and <i>friend-friends</i>?</b>&nbsp;
            Group friends are a great start. Like a school or work friend you 
            never see outside of school or work. Groups are better when you also 
            have a <i>friend-friend</i> or two. The kind you spend time with, 
            independent of the group. If you really click with someone, start 
            acting like a <i>friend-friend</i>, not just a <i>group-friend</i>.
          </p>
          <p className="mb-4">
            <b>When your group consistently plays NameGame</b>, soon everyone 
            will have a Sun Deck of friends and acquaintances they can 
            confidently greet by name. Nobody will be invisible. 
          </p>
          <p className="mb-4">
            <b>When people know each other better</b>, they naturally talk more, 
            find more common interests, do more together, care more, and have 
            more fun. As the Cheers song said, "You wanna be where everybody 
            knows your name."
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
