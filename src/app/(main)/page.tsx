import Link from 'next/link';
import Image from 'next/image';


export default function Home() {
  return (
    <div className="font-sans text-gray-800 dark:text-gray-200">
      <div className="container mx-auto max-w-3xl p-8 pt-0">
        <header className="text-center mb-8">
          <Image
            src="/images/NameGame-600x267.png"
            alt="NameGame logo"
            width={600}
            height={267}
            className="mx-auto h-auto md:max-w-[500px]"
          />

          <p className="text-2xl text-gray-600 dark:text-gray-400">
            Easily meet people and remember names
          </p>
        </header>

        <section className="text-lg leading-relaxed space-y-6">
          <p>
            <b>You're in groups...</b> extended families, schools, jobs, 
            neighborhoods, churches, teams, etc. 
          </p>
          <p>
            <b>Remembering names can be tricky.</b>&nbsp;
            Forgetting and asking for reminders is embarrassing.
          </p>
          <p>
            <b>You don't have to be a social butterfly</b>&nbsp;
            to meet people and remember their names. 
          </p>

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

        <section className="mt-8 text-lg">
          <h2 className="text-3xl font-bold text-center mb-6">How to Play</h2>
          <ul className="list-disc list-inside space-y-2"> 
            <li>
              <Link href="/signup" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                Sign up
              </Link>{' '}
              or{' '}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                login
              </Link>
            </li>
            <li>Create a private group</li>
            <li>Add your name and pic</li>
            <li>Greet someone with a code</li>
          </ul>
          <p className="my-4">When someone scans your code, you get each 
            other's names and pics so you don't forget. 
          </p>
          <p className="my-4">New people can play as a <i>guest</i> with just 
            their first name. 
          </p>
          <p className="my-4">
            That's it.
            <Image
              src="/images/butterflies.png"
              alt="NameGame social butterflies"
              width={48}
              height={48}
              className="w-auto h-auto mx-auto"
            />
          </p>
        </section>
      </div>
    </div>
  );
}
