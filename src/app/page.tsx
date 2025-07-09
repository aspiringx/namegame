import Image from 'next/image';

export default function Home() {
  return (
    <main className="bg-gray-50 font-sans text-gray-800">
      <div className="container mx-auto max-w-3xl p-8">
        <header className="text-center mb-8">
          <Image
            src="/images/NameGame-logo-600x300.png"
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
          <p>
            <b>We’re all part of groups...</b> families, friends, schools, jobs, neighborhoods, churches, teams, etc.
          </p>
          <p className="mb-4 bg-yellow-400 p-4 rounded-lg">
            <b>Some groups feel like sunshine!</b> People know each other’s names, are comfortable together, and talking is easy.
          </p>
          <p className="mb-4 bg-blue-300 p-4 rounded-lg">
            <b>Some groups feel like ice!</b> Many people don’t know each other’s names and feel anxious about meeting, remembering names, and knowing what to say.
          </p>
        </section>

        <section className="mt-8">
          <div className="flex flex-col md:flex-row md:space-x-8">
            <div className="md:w-1/2 p-6 bg-white rounded-lg shadow-lg mb-8 md:mb-0 border border-blue-300 border-4">
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
                <li>Discovering a common interest</li>
                <li>Starting a relationship</li>
                <li>Personal focus</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="text-lg leading-relaxed space-y-6">
          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
            width={70}
            height={70}
            className="mx-auto h-auto center"
          />
            <p>
                <b>NameGame is the ice-melting game that starts with a name.</b> When 
                your group plays slowly and deliberately, the social butterfly
                in each person happily emerges in its own time.
            </p>
        </section>

        <section className="mt-8 p-8 bg-white rounded-lg shadow-lg border border-yellow-300 border-4">
          <h2 className="text-3xl font-bold text-center mb-6">How to Play</h2>
          <p className="text-lg mb-6">To start playing NameGame:</p>
          <ul className="list-disc list-inside space-y-4 text-gray-700">
            <li>Create a private group</li>
            <li>Add your name and pic</li>
            <li>Greet someone with a code</li>
          </ul>
          <div className="mt-6">
            <p className="text-lg mb-6">When they scan your greeting code (with their phone), they can instantly:</p>
            <ul className="list-disc list-inside space-y-4 text-gray-700">
                <li>Join with only their first name</li>
                <li>See your name and pic</li>
                <li>Chat with you*</li>
            </ul>
            <p className="mt-4 text-sm italic">*NameGame is about personal interactions, so chat messages are limited. If you want to keep talking, share your phone numbers or get together.</p>
          </div>
        </section>

        <section className="mt-12 text-lg leading-relaxed">
          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
            width={70}
            height={70}
            className="mx-auto h-auto center"
          />

          <h3 className="text-3xl font-bold text-center mb-6">Here Comes the Sun</h3>
          <p className="mb-4">
            The smiley extroverts in your group will help you start melting the ice, 
            but NameGame is <b>not</b> an individual popularity contest. Your group is 
            rewarded by including everyone!
          </p>
        </section>

        <section className="mt-8 leading-relaxed">
          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
            width={70}
            height={70}
            className="mx-auto h-auto center"
          />
          <h3 className="text-3xl font-bold text-center mb-6">Sun Decks and Ice Blocks</h3>
          <p className="text-lg mb-4">In the game, people's photos are divided into two sections:</p>
          <p className="mb-4 bg-yellow-400 p-4 rounded-lg">
            Your <b>Sun Deck</b> shows who you’ve greeted, their names, and chat 
            links. Social Butterflies help you remember names and have fun things 
            to talk about.
          </p>
          <p className="mb-4 bg-blue-300 p-4 rounded-lg">
            Your <b>Ice Block</b> shows frozen, tortured, lonely faces with only 
            a first name. Say hello to welcome someone in your Ice Block to your 
            cozy Sun Deck.
          </p>
          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
            width={70}
            height={70}
            className="mx-auto h-auto center"
          />

          <h3 className="mt-8 text-3xl font-bold text-center mb-6">Game Tips</h3>
          <p className="mb-4">
            <b>When your group gets together, greet someone familiar on your 
            Sun Deck</b>. Or let them greet you. You'll naturally introduce each 
            other to your Sun Decks, melting Ice Blocks without a care. 
          </p>
          <p className="mb-4">
            <b>Go slow!</b> If your Sun Deck starts filling up with people whose names 
            you can't remember without peeking, click <b>Pause</b>. NameGame will 
            temporarily hide you from Ice Blocks so you can stay focused on 
            knowing a few people better.
          </p>
          <p className="mb-4">
            <b>If you're a group leader who feels responsible for helping 
            everyone feel welcome, chillax!</b> Let NameGame worry about that!
            20 minutes with <i>someone</i> is better than 20 seconds with <i>everyone</i>.
          </p>
          <p className="mb-4">
            <b>Within a few months, everyone will have a comfortable 
            Sun Deck</b> of friends and acquaintances they can confidently greet by 
            name. 
          </p>
          <p className="mb-4">
            <b><i>It all starts with a name.</i></b> 
          </p>
          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
            width={70}
            height={70}
            className="mx-auto h-auto center"
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
