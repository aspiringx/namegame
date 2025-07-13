import Link from 'next/link';
import Image from 'next/image';
import { Nunito } from 'next/font/google';

const nunito = Nunito({ subsets: ['latin'], weight: ['400', '700'] });

export default function Home() {
  return (
    <main className="font-sans text-gray-800 dark:text-gray-200">
      <div className="container mx-auto max-w-3xl p-8">
        <header className="text-center mb-8">
          <Image
            src="/images/NameGame-500x222-yellow.png"
            alt="NameGame logo"
            width={500}
            height={222}
            className="mx-auto h-auto md:max-w-[500px]"
          />

          <p className={`${nunito.className} text-xl text-gray-600 dark:text-gray-400`}>
            How people in big groups meet and remember names
          </p>
        </header>

        <section className="text-lg leading-relaxed space-y-6">
          <p>
            <b>You're in a big group...</b> an extended family, school, job, 
            neighborhood, church, team, etc. 
          </p>
          <p>
            <b>Remembering names can be tricky.</b>&nbsp;
            It's embarrassing to forget.
          </p>
          <p>
            <b>NameGame is a private, dynamic group photo album.</b>&nbsp;
            Anyone with a phone can "play". 
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

        <section className="mt-8">
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
          <p className="my-4">When they scan your code and provide their first 
          name, they are added to your group's private album. 
          </p>
          <p className="my-4">People start as guests, but can add their last 
          name and a photo for full access and the ability to greet others into 
          your "game". 
          </p>
          <p className="my-4">That's it.</p>
        </section>
      </div>
    </main>
  );
}
