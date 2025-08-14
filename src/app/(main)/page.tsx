import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="font-sans text-gray-800 dark:text-gray-200">
      <div className="container mx-auto max-w-3xl p-8 pt-0">
        <header className="mb-6 text-center">
          <Image
            src="/images/NameGame-600x267.png"
            alt="NameGame logo"
            width={600}
            height={267}
            className="mx-auto -mt-6 h-auto md:max-w-[500px]"
          />

          <p className="text-2xl text-gray-600 dark:text-gray-400">
            The relationship game that starts with a name
          </p>
        </header>

        <section className="space-y-4 text-lg leading-relaxed">
          <p>
            <b>We're all in social groups...</b> families, friends, jobs,
            schools, churches, neighborhoods, etc.
          </p>
          <p>In some groups we feel close and comfortable.</p>
          <p>
            In others, we feel <i>the ice</i>. The stress of meeting people,
            remembering (or forgetting!) names, belonging, etc.
          </p>
          <p>
            <b>NameGame</b> makes it fun to break the ice, even if you're not a
            social butterfly.
          </p>
        </section>

        <section className="mt-4 space-y-4 text-lg leading-relaxed">
          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
            width={70}
            height={70}
            className="center mx-auto h-auto w-auto"
          />
        </section>

        <section className="mt-6 space-y-4 text-lg">
          <h2 className="mb-6 text-center text-3xl font-bold">How to Play</h2>
          <ul className="list-inside list-disc space-y-2">
            <li>
              <Link
                href="/signup"
                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Sign up
              </Link>{' '}
              or{' '}
              <Link
                href="/login"
                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                login
              </Link>
            </li>
            <li>Create a private group*</li>
            <li>Add your name and pic</li>
            <li>Share your greeting code</li>
          </ul>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            * Creating groups is currently only available by request.{' '}
            <Link
              href="/signup"
              className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Sign up
            </Link>{' '}
            and verify your email to make a request.
          </p>
          <p>
            When someone scans your greeting code, they can instantly see your
            name and pic, along with others in the group.
          </p>

          <h3 className="mt-8 mb-6 text-2xl font-bold">Group Types</h3>
          <p>You can create Community or Family groups.</p>
          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
            width={48}
            height={48}
            className="float-right h-auto w-auto"
          />
          <h4 className="mt-6 mb-6 text-xl font-bold">Community Groups</h4>
          <p>
            Community groups are great for neighborhoods, schools, churches,
            workplaces, etc.
          </p>
          <p>
            NameGame makes it easy for group members to meet and learn names,
            welcome new people, communicate about your group and events, etc.
          </p>
          <p>
            <i>Circles</i> are smaller sub-groups where people can interact and
            develop personal relationships around shared interests or
            identities.
          </p>
          <p>
            Your group may already have formal circles (e.g. company {'>'}{' '}
            department {'>'} team). Group members can also create ad-hoc circles
            (e.g. hiking group, book club, etc.).
          </p>
          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
            width={48}
            height={48}
            className="float-right h-auto w-auto"
          />
          <h4 className="mt-6 mb-6 text-xl font-bold">Family Groups</h4>
          <p>
            <b>Family groups</b> connect you in a family tree.
          </p>
          <p>
            You can communicate, plan events, share memories, and remember the
            names of your cousin's kids before the next gathering!
          </p>
          <p>
            When you join, you (or a group admin) indicate direct parent/child
            and spouse/partner relationships. These relationships transcend
            groups and persist in other groups (like your spouse's family).
          </p>
          <p>
            From this, NameGame determines all the other relationships like
            cousins, aunts, uncles, grandparents, etc.
          </p>
          <p>
            Families are complex with marriage, divorce, remarriage, partners,
            genders, etc. NameGame shows in-laws, step-relations, pronouns, etc.
          </p>
          <p>
            With <i>Managed Users</i> you can securely include minor children,
            people who have passed (e.g. grandparents), and people (with their
            permission) unable to play due to disability, no computer or phone,
            technology aversion, etc.
          </p>
          <p>That's it!</p>
          <p>
            <Image
              src="/images/butterflies.png"
              alt="NameGame social butterflies"
              width={48}
              height={48}
              className="mx-auto h-auto w-auto"
            />
          </p>
        </section>
      </div>
    </div>
  )
}
