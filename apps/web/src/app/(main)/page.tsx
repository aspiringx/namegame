'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

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
            <h2 className="mb-6 text-center text-3xl font-bold">
              What is Relation Star?
            </h2>
            <p className="text-left mt-4">
              A universe you can navigate at the speed of love.
            </p>
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

        <section className="mt-8 mb-16 space-y-4 text-lg leading-relaxed">
          <h2 className="mb-6 text-center text-3xl font-bold">
            Begin the Journey
          </h2>
          <p>
            Start with familiar star clusters where you have constellations.
            Family, friends, or a community you belong to.
          </p>
          <ul className="pl-5 list-outside list-disc">
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
            <li>Add your info</li>
            <li>Create a private cluster</li>
            <li>Invite people with a greeting code</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
