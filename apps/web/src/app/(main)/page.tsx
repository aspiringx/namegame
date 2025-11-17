'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function Home() {
  const [isCommunityOpen, setIsCommunityOpen] = useState(false)
  const [isFamilyOpen, setIsFamilyOpen] = useState(false)

  return (
    <div className="font-sans text-gray-800 dark:text-gray-200">
      <div className="container mx-auto max-w-3xl p-8 pt-4">
        <header className="mt-2 mb-8 text-center">
          <Image
            src="/images/logos/relationstar_dark-400x268.png"
            alt="Relation Star logo"
            width={200}
            height={134}
            className="mx-auto -mt-6 w-[200px] h-[134px]"
          />
          <p className="mx-auto max-w-[240px] text-xl text-gray-600 italic sm:max-w-[500px] dark:text-gray-400 mt-1">
            Your universe at the speed of love
          </p>
        </header>

        <section className="space-y-4 text-lg leading-relaxed">
          <p className="text-center italic text-sm text-gray-500">
            NameGame is now Relation Star.
          </p>
          <div className="flex flex-col w-full sm:mx-auto text-center space-y-4">
            <p className="text-left mt-4">What is Relation Star?</p>
            <Link
              href="/speed-of-love"
              className="mx-auto rounded border border-cyan-400/50 bg-cyan-500/10 px-6 py-3 font-mono text-sm font-medium text-cyan-400 transition-colors hover:border-cyan-400 hover:bg-cyan-500/20 sm:w-[300px] w-full"
            >
              ⭐ Speed of Love Intro ⭐
            </Link>
            <p className="text-left mt-4">
              Random clusters of stars surround you. Most are distant dots. A
              few shine close, patterns of meaning.
            </p>
            <Link
              href="/constellations"
              className="mx-auto rounded border border-cyan-400/50 bg-cyan-500/10 px-6 py-3 font-mono text-sm font-medium text-cyan-400 transition-colors hover:border-cyan-400 hover:bg-cyan-500/20 sm:w-[300px] w-full"
            >
              ⭐ Constellations ⭐
            </Link>
            <p className="text-left mt-4">
              Chart the five points of stars to understand relationships and
              gain cosmic insights.
            </p>
            <Link
              href="/stars"
              className="mx-auto rounded border border-cyan-400/50 bg-cyan-500/10 px-6 py-3 font-mono text-sm font-medium text-cyan-400 transition-colors hover:border-cyan-400 hover:bg-cyan-500/20 sm:w-[300px] w-full"
            >
              ⭐ Stars ⭐
            </Link>
          </div>
        </section>

        <section className="mt-8 space-y-4 text-lg leading-relaxed">
          <Image
            src="/images/logos/relationstar_icon_purple-128.png"
            alt="Relation Star"
            width={70}
            height={70}
            className="center mx-auto h-auto w-auto"
          />
        </section>

        <section className="mt-8 space-y-4 text-lg leading-relaxed">
          <h2 className="mb-6 text-center text-3xl font-bold">
            Where to Begin
          </h2>
          <p>
            Start with familiar constellations. Family, friends, or a community
            you belong to.
          </p>
          <ul className="ml-4 list-inside list-disc">
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
            <li>
              Add your info <br />
              <div className="ml-6 text-sm text-gray-500 italic dark:text-gray-400">
                (name, photo, etc.)
              </div>
            </li>
            <li>
              Create a private group
              <br />
              <div className="ml-6 text-sm text-gray-500 italic dark:text-gray-400">
                (not yet publicly available)
              </div>
            </li>
            <li>Say hello with a greeting code</li>
          </ul>
          <p>A greeting code is both a QR code and a link/URL.</p>
          <ul className="ml-8 list-outside list-disc">
            <li>
              If you&apos;re together, they scan your code with their camera
            </li>
            <li>If not, they open your link via text or email</li>
          </ul>
          <p>
            People open your greeting code to enter your private group with just
            their first name.
          </p>
          <p>What happens next depends on the type of group you make.</p>
          <Image
            src="/images/logos/relationstar_icon_purple-128.png"
            alt="Relation Star"
            width={48}
            height={48}
            className="mx-auto mt-8 h-auto w-auto"
          />
          <h3 className="my-8 text-2xl font-bold">Group Types</h3>
          <p>You can create community or family groups.</p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsCommunityOpen(!isCommunityOpen)}
              className="flex w-full items-center justify-between text-left text-xl font-bold text-gray-900 dark:text-gray-100"
            >
              <span>Community</span>
              <ChevronDown
                className={`h-5 w-5 transform transition-transform ${
                  isCommunityOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isCommunityOpen && (
              <div className="mt-4 mb-8 space-y-4">
                <p>
                  Community groups are great for neighborhoods, churches,
                  workplaces, schools, etc.
                </p>
                <p>
                  Within minutes, you can have a private group photo directory.
                  Everyone can see each other, meet, and remember names.
                </p>
                <p>
                  People appear on two tabs: <i>Greeted</i> or{' '}
                  <i>Not Greeted</i>.
                </p>
                <p>
                  Greeting someone (with a code) adds them to your{' '}
                  <i>Greeted</i> tab, unlocking new ways to connect.
                </p>
                <p>
                  Once connected, the game does the rest with fun prompts to get
                  to know each other, discover shared interests, and interact.
                </p>
                {/* Uncomment when these features are live. */}
                {/* <p>
                  <i>Sub-groups</i> are where people connect more personally.
                  Most groups already have formal sub-groups: classes, teams,
                  committees, etc.
                </p>
                <p>
                  Group members can also create informal sub-groups around
                  shared interests, giving people new ways to connect.
                </p>
                <p>
                  You can communicate with your group, sub-groups, or
                  individuals to share events and announcements.
                </p> */}
                <button
                  type="button"
                  onClick={() => setIsCommunityOpen(false)}
                  className="mx-auto flex items-center pt-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <ChevronUp className="mr-1 h-4 w-4" />
                  Close
                </button>
              </div>
            )}
          </div>
          <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsFamilyOpen(!isFamilyOpen)}
              className="flex w-full items-center justify-between text-left text-xl font-bold text-gray-900 dark:text-gray-100"
            >
              <span>Family</span>
              <ChevronDown
                className={`h-5 w-5 transform transition-transform ${
                  isFamilyOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isFamilyOpen && (
              <div className="mt-4 mb-8 space-y-4">
                <p>
                  Family groups connect extended family members in a tree. You
                  start with the roots (parents or grandparents).
                </p>
                <p>
                  Each person indicates their direct relationships as a{' '}
                  <i>parent / child</i> or <i>spouse / partner</i>.
                </p>
                <p>
                  Relation Star does the rest, connecting everyone to your{' '}
                  <i>shared roots</i> and showing how everyone is related.
                </p>
                <p>
                  With <i>managed users</i> you can safely include everyone.
                  Grandparents or others who have passed, kids too young for
                  their own account, etc.
                </p>
                <p>
                  Relation Star helps extended families stay connected, learn
                  names, communicate, plan events, share memories, and more.
                </p>
                <button
                  type="button"
                  onClick={() => setIsFamilyOpen(false)}
                  className="mx-auto flex items-center pt-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <ChevronUp className="mr-1 h-4 w-4" />
                  Close
                </button>
              </div>
            )}
          </div>
          <p>
            <Image
              src="/images/logos/relationstar_icon_purple-128.png"
              alt="Relation Star"
              width={48}
              height={48}
              className="mx-auto mt-12 h-auto w-auto"
            />
          </p>

          <ul className="mt-8 mb-16 ml-4 list-inside list-disc">
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
            <li>
              Create a private group
              <br />
              <div className="ml-6 text-sm text-gray-500 italic dark:text-gray-400">
                (not yet publicly available)
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
