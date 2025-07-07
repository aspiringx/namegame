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
            <b>We call it <i>the ice</i></b>. The stress of meeting new people, 
            small talk, remembering names and feeling dumb when you forget, 
            worrying about how you're seen, etc. 
          </p>
          <p>
            <b>NameGame makes <i>breaking the ice</i> fun and easy!</b>&nbsp;
            Play it with a group to help people quickly meet, remember names, 
            and get acquainted. Then the real magic begins!
          </p>
        </section>

        <section className="mt-8 p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-6">How to Play</h2>
          <ol className="list-decimal list-inside space-y-4 text-lg text-gray-700">
            <li>Create a group</li>
            <li>Add your name and pic</li>
            <li>Greet people with a code</li>
            <li>The game helps you do the rest</li>
          </ol>
        </section>

        <section className="mt-8 space-y-8">
          <div>
            <h4 className="text-xl font-semibold mb-4">When others scan your code, they can instantly:</h4>
            <ul className="list-disc list-inside space-y-2 text-lg text-gray-700 italic">
              <li>See your name and pic</li>
              <li>Chat with you and others they meet</li>
              <li>Learn more about your group</li>
              <li>Find interesting ways to be involved</li>
            </ul>
          </div>
        </section>

        <section className="mt-8 text-lg leading-relaxed">
          <h3 className="text-2xl font-semibold mb-4">It starts with a name...</h3>
          <p className="mb-4">
            <b>Your group's first goal is to help people connect and remember
            names.</b> When people know each other's names, they naturally 
            interact, comfortably and confidently.
          </p>
          <p className="mb-4">
            <b>Within a few minutes, your group will have a private photo 
            directory, <i>with a twist.</i></b> NameGame hides names until 
            you greet. You only see names of people you've really met, giving 
            everyone incentive to talk personally. 
          </p>
          <p className="mb-4">
            <b>If greeting people stresses you out</b>, let the crazy extroverts 
            do their thing. They'll initiate greetings and introduce you to 
            others. If knowing what to say feels hard, NameGame prompts you 
            with interesting questions. There's no pressure to appear clever 
            or interesting. 
          </p>
          <p className="mb-8">
            <b>NameGame incentivizes inclusion, not individual popularity.</b>&nbsp;
            It helps your group include everyone without concern for 
            who initiates. It helps everyone remember names so you can interact
            confidently. 
          </p>
          <h3 className="text-2xl font-semibold mb-4">Subs are where real magic happens...</h3>
          <p className="mb-4">
            The game starts with a name, but remembering names is meaningless 
            if it doesn't lead to...
          </p>
          <p className="mb-4">
            <b>Helping each other find your subs is your group's 
            next big goal.</b> Subs, or sub-groups within your larger group, are 
            where the real magic happens! 
          </p>
          <p className="mb-4">
            People don't develop personal relationships in crowds. They do it 
            by spending time together doing interesting things with one or a few 
            people. 
          </p>
          <p className="mb-4">
            Bigger groups (15+ people) already have formal subs. Schools have 
            classes, teams, and clubs. Workplaces have departments, teams, and 
            projects. Churches have choirs, age-based classes, and committees. 
            You get the idea.
          </p>
          <p className="mb-4">
            <b>If your group already has formal subs, create them first
            so everyone can see and learn about them.</b> Invite existing 
            members of subs to join so others can see who's in them. 
          </p>
          <p className="mb-4" style={{ fontStyle: 'italic', color: 'purple'}}>
            <b>Magic Hint: people's interest in subs is usually more about who's in 
            them (people they're already comfortable with) than the topic.
            If you want people to be join subs, start with relationships!</b> 
          </p>
          <p className="mb-4" style={{ fontStyle: 'italic', color: 'purple'}}>
            Seemingly boring subs (like being on a committee) can be 
            interesting with friends. Subs that seem fascinating may get no 
            traction without personal connections and invitations.
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
            Groups are valuable when they help people make friends, regardless of 
            how they connect. 
          </p>
          <p className="mb-4">
            <b>Subs can have subs.</b> A school orchestra sub might have subs for 
            strings, woodwinds, brass, and percussion. A gaming sub might have 
            subs for board games, video games, role-playing games, and card games. 
          </p>
          <p className="mb-4">
            <b>Smaller, more personal subs are where relationships grow.</b>&nbsp;
            When a few people have a good excuse to meet regularly with enough 
            time to talk freely, focused on each other instead of just "official 
            group things", relationships naturally grow.
          </p>
          <p className="mb-8">
            <b>We think relationships are everything!</b> If you want your group
            to make them funner, faster, and more inclusive (without all the 
            stress), just play NameGame.
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
            <ul className="list-disc list-inside space-y-2 text-lg text-gray-700 italic">
              <li>NameGame is private. Photos and content people share aren't publicly visible. </li>
              <li>No ads or selling your data</li>
              <li>NameGame is open source. We can host your private game for a small fee or you can manage it all yourself.</li>
              <li>Group admins can moderate all users, content, and messages to immediately disable or remove anything weird or inappropriate.</li>
              <li>Empowering all players to create (messages, subs, etc.) is central to NameGame. If you're concerned about control, we can't disable these features for your group and NameGame might not be a fit.</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
