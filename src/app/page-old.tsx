import Image from 'next/image';

export default function Home() {
  return (
    <main className="bg-gray-50 font-sans text-gray-800">
      <div className="container mx-auto max-w-3xl p-8">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-2">
            Welcome to NameGame!
          </h1>
          <p className="text-2xl text-gray-600">
            The relationship game that starts with a name
          </p>
        </header>

        <section className="mb-8">
          <Image
            src="/images/name-game-social-anxiety-with-text.jpg"
            alt="A person looking anxious in a social situation"
            width={600}
            height={400}
            className="rounded-lg shadow-xl mx-auto w-full h-auto"
          />
        </section>

        <section className="text-lg leading-relaxed space-y-6">
          <p>
            <b>We call it <i>the ice</i></b>. The stress of meeting new people
            or being with people you don't know well, small talk, remembering 
            names, feeling dumb when you forget, worrying about how you're 
            perceived, etc. 
          </p>
          <p>
            <b>NameGame makes <i>breaking the ice</i> fun and easy!</b>&nbsp;
            Play it with a group to help people quickly meet, remember names, 
            get acquainted, and feel comfortable together. Then the real magic 
            begins!
          </p>
        </section>

        <section className="mt-8 p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-6">How to Play</h2>
          <ol className="list-decimal list-inside space-y-4 text-lg text-gray-700">
            <li>Create a group</li>
            <li>Add your name and pic</li>
            <li>Greet people with a code</li>
            <li>Let the game do the rest</li>
          </ol>
        </section>

        <section className="mt-8 space-y-8">
          <div>
            <h4 className="text-xl font-semibold mb-4">When others scan your code, they can instantly:</h4>
            <ul className="list-disc list-inside space-y-2 text-gray-700 italic">
              <li>See your name and pic</li>
              <li>Chat with you and others they meet</li>
              <li>Learn more about your group</li>
              <li>Discover fun ways to participate</li>
            </ul>
          </div>
          <p className="mb-4">
            More details below. 
          </p>
        </section>

        <section className="mt-8 text-lg leading-relaxed">
          <h3 className="text-2xl font-semibold mb-4">It starts with a name...</h3>
          <p className="mb-4">
            <b>Your group's first goal is to help people connect and remember
            names.</b> When people know each other's names, they naturally 
            interact more comfortably and confidently. NameGame lets you 
            estimate the number of people in your group to show your progress.
          </p>
          <p className="mb-4">
            <b>Within a few minutes, your group will have a private photo 
            board, <i>with a twist.</i></b> NameGame hides names until 
            you greet to give everyone a fun excuse to interact, even if you 
            already know each other. 
          </p>
          <p className="mb-4">
            <b>If greeting people stresses you out</b>, let the crazy extroverts 
            do their thing. They'll initiate greetings and introduce you to 
            others. NameGame makes small talk easy, prompting you with 
            interesting questions so nobody feels pressure to come up with 
            something clever if that's not your forte.
          </p>
          <p className="mb-4">
            <b>NameGame incentivizes inclusion, not individual popularity.</b>&nbsp;
            It helps your group include everyone without concern for 
            who initiates the greeting. 
          </p>
          <p className="mb-4">
            <b>Accessible: Include people without a phone or who are blind.</b>&nbsp;
            Other players can include them with their phones, adding their name 
            and photo (with their permission). Admins can export your group's 
            photo board to a sharable PDF they can send or print. Blind players 
            can use their screen reader and we're planning a video intro feature 
            letting watch or listen, hear how to pronounce their names correctly, 
            etc. 
          </p>
          <p className="mb-8">
            <b>The game makes it easy to remember everyone you greet</b> so you 
            can confidently call them by name. No more feeling stupid 
            because you forgot the name of someone you met last week. 
            Especially when they remember yours! Ughh!!
          </p>
          <h3 className="text-2xl font-semibold mb-4">Subs are where real magic happens...</h3>
          <p className="mb-4">
            The game starts with a name, but remembering names is meaningless 
            if it doesn't lead to...
          </p>
          <p className="mb-4">
            <b>Your group's next big goal is helping everyone find 
            their people!</b> This happens in <i>subs</i>, or sub-groups within 
            your larger group. 
          </p>
          <p className="mb-4">
            <b>People don't develop personal relationships in crowds.</b>&nbsp; 
            Attention is dispersed across many people or focused on some 
            group presentation. Many can't speak freely because it would be
            rude or intimidating in the crowd. People can be in a big group 
            together for years and never really connect. 
          </p>
          <p className="mb-4">
            <b>Subs are where the magic happens.</b>&nbsp;
            They're small groups of 2+ people that gather regularly around 
            any common interest. While they may have some structure, <i>there's 
            space for people to speak freely and focus attention on each other 
            individually</i>. 
          </p>
          <p className="mb-4">
            <b>Don't smother or ignore your valuable introverts!</b> They're often 
            the most thoughtful and intelligent people in your sub, but extroverts 
            can unintentionally dominate, even in small groups. Talk with people 
            to understand how they operate. Structure gatherings to value 
            everyone's contributions, not just the natural talkers. Where 
            applicable, give people notice so they can feel prepared to 
            participate instead of put on the spot. 
          </p>
          <p className="mb-4">
            <b>Large groups already have formal subs.</b> Schools have 
            classes, teams, and clubs. Workplaces have departments, teams, and 
            projects. Churches have choirs, age-based classes, and committees. 
            You get the idea.
          </p>
          <p className="mb-4">
            <b>If your group already has formal subs, create them first
            so everyone can see and learn about them.</b> Invite existing 
            members of subs to join so others can see who's in them. 
          </p>
          <p className="mb-4" style={{ fontStyle: 'italic' }}>
            <b>Hint: people's interest in subs is usually more about "who"
            (Do they have a a friend there?) than "what".</b>&nbsp;
            If you want people to be join subs, start with relationships.
          </p>
          <p className="mb-4" style={{ fontStyle: 'italic' }}>
            <b>Seemingly boring subs (like being on a committee) can be 
            interesting with friends. Subs that seem fascinating may get little
            traction if people don't see a friend.</b>&nbsp;
            NameGame let's people indicate whether a sub interests them, but most 
            won't act on it without a personal invitation. People want to know 
            they'll have a friend there when they show up. 
          </p>
          <p className="mb-4">
            <b>Some subs are open so anyone can join. Others might be 
            limited</b>, like a committee or age-based group, but people can 
            still learn about them, see who's in them, etc.
          </p>
          <p className="mb-4">
            <b>Anyone in the group can create new subs!</b> This lets
            everyone innovate and connect in amazing ways that a central group 
            of "leaders" could never have imagined. 
          </p>
          <p className="mb-4">
            <b>Subs don't need to directly relate to your group's purpose.</b>&nbsp;
            Your group is more valuable when your people have good friends there. 
            When you help people bond around random shared interests, they're
            more comfortable participating together in formal group activities.
          </p>
          <p className="mb-4">
            <b>Subs can have subs.</b> A school orchestra sub might have subs for 
            strings, woodwinds, brass, and percussion. A gaming sub might have 
            subs for board games, video games, role-playing games, and card games. 
          </p>
          <p className="mb-12">
            <b>Smaller, more personal subs are where relationships grow.</b>&nbsp;
            When a few people have an interesting excuse to meet regularly and 
            have time to talk freely and focus attention on each other (instead 
            of just on "official group stuff"), relationships take off!
          </p>
          <p className="mb-12">
            <b>We think relationships are everything!</b> If you want your group
            to make them easier, funner, faster, and more inclusive, just play 
            NameGame.
          </p>
          <h3 className="text-2xl font-bold mb-4">Interested?</h3>
          <p className="mb-8">
            We're currently piloting NameGame. If you're interested in being 
            part of it, connect with me (Joe) on&nbsp;
            <a href="https://www.linkedin.com/in/jtippetts/" target="_blank" className="text-blue-600 hover:underline">LinkedIn</a>&nbsp;
            and mention NameGame.
          </p>
          <h3 className="text-2xl font-bold mb-4">Other Stuff</h3>
          <div>
            <ul className="list-disc list-inside space-y-2 text-base text-gray-700 italic">
              <li>NameGame is private. Photos and content people share aren't publicly visible. </li>
              <li>And NameGame is a web app, so it's always possible that someone could breach it. We limit this risk by limiting what data we save in the game (names, photos) and players can participate without ever sharing more.</li>
              <li>No ads or selling your data</li>
              <li>NameGame is open source. We can host your private game for a small fee and you can start in minutes. Or you can manage it all yourself if you want more confidence or control.</li>
              <li>Group admins can moderate all users, content, and messages to immediately disable or remove anything weird or inappropriate.</li>
              <li>Empowering all players to connect personally (messages, subs, etc.) is central to NameGame. If you're worried about having more control than admin moderation or if your group has more formal requirements (SOC2 compliance, etc.), NameGame might not be a fit or you may be able to modify (fork it) and self host it to meet your needs.</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
