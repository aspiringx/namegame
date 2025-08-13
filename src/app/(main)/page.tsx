import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="font-sans text-gray-800 dark:text-gray-200">
      <div className="container mx-auto max-w-3xl p-8 pt-0">
        <header className="mb-8 text-center">
          <Image
            src="/images/NameGame-600x267.png"
            alt="NameGame logo"
            width={600}
            height={267}
            className="mx-auto h-auto md:max-w-[500px]"
          />

          <p className="text-2xl text-gray-600 dark:text-gray-400">
            Relationships start with a name
          </p>
        </header>

        <section className="space-y-6 text-lg leading-relaxed">
          <p>
            <b>You're in social groups...</b> families, friends, jobs, schools,
            churches, neighborhoods, etc.
          </p>
          <p>
            <b>Some groups feel warm</b>. People know and trust each other
            through many shared experiences.
          </p>
          <p>
            <b>Some groups feel cold</b>. New or less outgoing people may feel
            unknown, unvalued, or unsure whether they belong.
          </p>
          <p>
            <b>
              We call this discomfort <i>the ice</i>
            </b>
            . Anxiety or fear of awkward social situations.
          </p>
          <p>
            <b>NameGame</b> is the easy, fun way to break the ice and build warm
            relationships.
          </p>
          <p>
            Within minutes, your group can have a private, secure album so
            everyone can remember faces and names.
          </p>
          <p>And that's just the start.</p>
        </section>

        <section className="mt-4 space-y-6 text-lg leading-relaxed">
          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
            width={70}
            height={70}
            className="center mx-auto h-auto w-auto"
          />
        </section>

        <section className="mt-8 text-lg">
          <h2 className="mb-6 text-center text-3xl font-bold">How to Play</h2>
          <p className="mb-4">
            You don't need to be a social butterfly to break the ice. Just:
          </p>
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
            <li>Create a private group</li>
            <li>Add your name and pic</li>
            <li>Share your greeting code</li>
          </ul>
          <p className="my-4">
            When others scan your code, they instantly see you and others in
            your group.
          </p>
          <p className="my-4">
            You can create a Family or Community group. Both make it fun to
            meet, remember names, and build relationships based on the nature of
            the group.
          </p>
          <p className="my-4">
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
