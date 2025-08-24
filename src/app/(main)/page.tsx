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
        <header className="mb-6 text-center">
          <Image
            src="/images/NameGame-600x267.png"
            alt="NameGame logo"
            width={600}
            height={267}
            className="mx-auto -mt-6 h-auto md:max-w-[500px]"
          />

          <p className="text-2xl text-gray-600 italic dark:text-gray-400">
            Break the ice!
          </p>
        </header>

        <section className="space-y-4 text-lg leading-relaxed">
          <p>
            Some social situations are familiar and comfortable. Others feel
            stressful or awkward.
          </p>
          <p>
            We call this stress or unfamiliarity{' '}
            <span className="text-blue-600 italic dark:text-blue-400">
              the ice
            </span>
            . Meeting new people, remembering names, getting acquainted, etc.
          </p>
          <p>
            NameGame makes{' '}
            <span className="text-blue-600 dark:text-blue-400">
              breaking the ice
            </span>{' '}
            easy! A fun excuse to greet and learn each other's names. And that's
            just the start.
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
            <li>Share a greeting code</li>
          </ul>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            * Creating groups is currently by request only.{' '}
            <Link
              href="/signup"
              className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Sign up
            </Link>{' '}
            to request access.
          </p>
          <p>
            People who open your greetings get instant access to your private
            group with names, photos, etc.
          </p>
          <div className="space-y-4 rounded-md border border-blue-200 p-4">
            <p className="mb-4 text-center font-bold text-orange-600 dark:text-orange-400">
              The Ultimate Icebreaker
            </p>
            <p className="text-blue-600 dark:text-blue-400">
              Knowing a name is the ultimate icebreaker!
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              When you confidently remember someone's name, noticing and
              greeting them feels comfortable so you naturally interact more.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              When you don't remember a name, you feel the awkward ice.
            </p>
            <p className="text-gray-600 italic dark:text-gray-400">
              Do you avoid, pretend to not see them, or greet without their
              name, hoping they don't notice? Do you ask them to remind you...
              again?
            </p>
            <p className="text-blue-600 dark:text-blue-400">
              Don't underestimate the ice-breaking power of names!
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              NameGame makes it easy.
            </p>
          </div>
          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
            width={48}
            height={48}
            className="mx-auto mt-6 h-auto w-auto"
          />
          <h3 className="mt-6 mb-6 text-2xl font-bold">Group Types</h3>
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
                  Community groups are great for neighborhoods, schools,
                  churches, workplaces, etc.
                </p>
                <p>
                  Within a few minutes, you get a private group photo directory.
                  Everyone has a fun way to notice each other, meet, remember
                  names, and...
                </p>
                <p>
                  <i>Circles</i> are sub-groups where people connect more
                  personally. Most groups already have formal circles: classes,
                  teams, committees, clubs, etc.
                </p>
                <p>
                  Group members can also create informal circles around shared
                  interests, welcoming others into new ways to connect.
                </p>
                <p>
                  You can communicate with groups, circles, or individuals to
                  share events and announcements. Assign roles and titles to
                  reflect ways people participate over time.
                </p>
                <p>
                  Being inclusive doesn't have to be hard. Just play NameGame
                  and everyone will get involved... naturally.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Group admins can moderate, limit, or remove access to maintain
                  your community guidelines.
                </p>
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
                  With <i>managed users</i> you can safely include everyone.
                  Grandparents or others who have passed, kids too young for
                  their own account, etc.
                </p>
                <p>
                  Each person, or a group admin, indicates their direct
                  relationships as a <i>parent / child</i> or{' '}
                  <i>spouse / partner</i>.
                </p>
                <p>
                  NameGame does the rest, showing how everyone is related:
                  siblings, cousins, aunts, uncles, step-siblings, in-laws, etc.
                </p>
                <p>
                  Why would you need to break the ice with family? Because it's
                  always changing (birth, death, marriage, divorce, etc.).
                </p>
                <p>
                  NameGame helps extended families stay connected, learn names,
                  communicate, plan events, share memories, and more.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  When divorce, break-ups, abuse, or other issues impact
                  relationships, you can update your group or individual
                  experience, as needed.
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
              src="/images/butterflies.png"
              alt="NameGame social butterflies"
              width={48}
              height={48}
              className="mx-auto mb-12 h-auto w-auto"
            />
          </p>
        </section>
      </div>
    </div>
  )
}
