'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function Home() {
  const [isCommunityOpen, setIsCommunityOpen] = useState(false)
  const [isFamilyOpen, setIsFamilyOpen] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  return (
    <div className="font-sans text-gray-800 dark:text-gray-200">
      <div className="container mx-auto max-w-3xl p-8 pt-4">
        <header className="mt-2 mb-8 text-center">
          <Image
            src="/images/NameGame-600x267.png"
            alt="NameGame logo"
            width={600}
            height={267}
            className="mx-auto -mt-6 h-auto md:max-w-[500px]"
          />
          <p className="mx-auto max-w-[300px] text-xl text-gray-600 italic dark:text-gray-400">
            Life is relationships
          </p>
        </header>

        <section className="space-y-4 text-lg leading-relaxed">
          <p>
            Life is relationships. Relationships start with names.
          </p>
          <p>
            NameGame makes starting and growing relationships fun and easy.
          </p>
          <h2 className="my-6 text-2xl font-bold" id="break-the-ice-section">Existing and Potential Relationships</h2>
          <p>
            You play with a group. When you start, everyone has <i>existing</i>{' '}
            and/or <i>potential</i> relationships with:
          </p>
          <ul className="list-disc list-outer ml-8 space-y-2">
            <li>Your group</li>
            <li>Each person in your group</li>
          </ul>
          <p>
            All relationships are in one of three stages:
          </p>
          <ul className="list-decimal ml-8 space-y-2">
            <li>
              <a 
                href="#break-the-ice-section" 
                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
                onClick={(e) => {
                  e.preventDefault()
                  const element = document.getElementById('break-the-ice-section')
                  if (element) {
                    const offset = 80 // Adjust this value based on your header height
                    const elementPosition = element.getBoundingClientRect().top
                    const offsetPosition = elementPosition + window.pageYOffset - offset
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth'
                    })
                  }
                }}
              >
                Breaking the Ice
              </a>
            </li>
            <li>
              <a 
                href="#getting-acquainted-section" 
                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
                onClick={(e) => {
                  e.preventDefault()
                  const element = document.getElementById('getting-acquainted-section')
                  if (element) {
                    const offset = 80
                    const elementPosition = element.getBoundingClientRect().top
                    const offsetPosition = elementPosition + window.pageYOffset - offset
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth'
                    })
                  }
                }}
              >
                Getting Acquainted
              </a>
            </li>
            <li>
              <a 
                href="#growing-relationships-section" 
                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
                onClick={(e) => {
                  e.preventDefault()
                  const element = document.getElementById('growing-relationships-section')
                  if (element) {
                    const offset = 80
                    const elementPosition = element.getBoundingClientRect().top
                    const offsetPosition = elementPosition + window.pageYOffset - offset
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth'
                    })
                  }
                }}
              >
                Growing Relationships
              </a>
            </li>
          </ul>
        </section>

        <section className="mt-8 space-y-4 text-lg leading-relaxed">
          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
            width={48}
            height={48}
            className="mx-auto mt-8 h-auto w-auto"
          />
          <h3 className="mb-6 text-left text-xl font-bold" id="break-the-ice-section">1. Breaking the Ice</h3>
          <p className="text-center italic">
            "You wanna be where everybody knows your name." ~Cheers
          </p>
          <p>
            Meeting new people is often called "breaking the ice". The discomfort 
            of greeting, having things to say, remembering names, etc.{' '}
            <button
              type="button"
              onClick={() => toggleSection('break-the-ice')}
              className="inline-flex items-center text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              More
              {openSections['break-the-ice'] ? (
                <ChevronUp className="ml-1 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-1 h-4 w-4" />
              )}
            </button>
          </p>
          {openSections['break-the-ice'] && (
            <div id="break-the-ice" className="space-y-4 rounded-lg bg-gray-50 px-6 py-4 dark:bg-gray-800/50">
              <p>
                Remembering names is the ultimate ice breaker. 
              </p>
              <p>
                When you can confidently greet people by name, the awkward
                ice soon melts. 
              </p>
              <Image
                src="/images/namegame-greeting-code.png"
                alt="NameGame greeting code"
                width={256}
                height={256}
                className="mx-auto my-6 h-auto w-full sm:w-1/2"
              />
              <p>
                With NameGame greeting codes, you instantly get names and faces 
                of everyone you meet. 
              </p>
              <Image
                src="/images/namegame-greeting-page.jpg"
                alt="NameGame welcome to group"
                width={256}
                height={256}
                className="mx-auto my-6 h-auto w-full sm:w-1/2"
              />
              <p>
                Now you can:
              </p>
              <ul className="list-disc list-outer ml-4 space-y-2">
                <li>Remember any "Joe" that greets you</li>
                <li>Have an instant icebreaker question if you're not sure what to say</li>
              </ul>
              <p>
                Your group's private photo album and name quiz make it easy 
                to remember names and faces. 
              </p>
              <p>
                When people know each others names and have things to talk 
                about, interacting becomes easy.
              </p>
              <button
                type="button"
                onClick={() => toggleSection('break-the-ice')}
                className="mx-auto flex items-center pt-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ChevronUp className="mr-1 h-4 w-4" />
                Close
              </button>
            </div>
          )}
        </section>
        <section className="mt-8 space-y-4 text-lg leading-relaxed">
          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
            width={48}
            height={48}
            className="mx-auto mt-8 h-auto w-auto"
          />
          <h3 className="mb-6 text-left text-2xl font-bold" id="getting-acquainted-section">2. Getting Acquainted</h3>
          <p>
            After people break the ice, feeling like they <i>belong</i> in 
            your group happens on two levels. 
          </p>
          <ul className="list-disc list-outer ml-4 space-y-2">
            <li><i>Individual</i> friendships</li>
            <li><i>Group</i> involvement</li>
          </ul>
          <p>
            Using the <i>secret sauce</i>, NameGame helps people do both.{' '}
            <button
              type="button"
              onClick={() => toggleSection('getting-acquainted')}
              className="inline-flex items-center text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              More
              {openSections['getting-acquainted'] ? (
                <ChevronUp className="ml-1 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-1 h-4 w-4" />
              )}
            </button>
          </p>
          {openSections['getting-acquainted'] && (
            <div id="getting-acquainted" className="space-y-4 rounded-lg bg-gray-50 px-6 py-4 dark:bg-gray-800/50">
              <p>
                <i>Regularly spending time together</i> is the secret sauce of 
                relationships. You get to know people you consistently spend 
                time with.
              </p>
              <p>
                <i>But time is precious</i>. You only do this when you have a 
                reason. A shared interest that brings you together.
              </p>
              <h4 className="mb-6 text-xl font-bold">Individual belonging</h4>
              <p>
                
                realize you have things in common. 
              </p>
              <p>
                <i>Did you know</i> your neighbor five doors away has kids the 
                same age as your kids? And you're both dying to find nearby 
                friends?
              </p>
              <p>
                <i>Did you know</i> your co-worker on the next floor up is also 
                an avid rock hounder, bird watcher, or D&D fanatic?
              </p>
              <p>
                <i>Did you know</i> your the cousin you knew well as a child 
                lives just 20 minutes away?
              </p>
              <p>
                <i>Did you know</i> that lady at church you met five months 
                ago is also looking for a walking partner?
              </p>
              <p>
                NameGame helps you discover people with common interests, giving 
                you easy ways to connect and do things together. 
              </p>
              <button
                type="button"
                onClick={() => toggleSection('getting-acquainted')}
                className="mx-auto flex items-center pt-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ChevronUp className="mr-1 h-4 w-4" />
                Close
              </button>
            </div>
          )}
        </section>

        <section className="mt-8 space-y-4 text-lg leading-relaxed">
          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
            width={48}
            height={48}
            className="mx-auto mt-8 h-auto w-auto"
          />
          <h3 className="mb-6 text-left text-2xl font-bold" id="growing-relationships-section">3. Growing Relationships</h3>
          <p>
            We build relationships with the people we regularly see and spend 
            time with. They ebb and flow with different people over time.{' '}
            <button
              type="button"
              onClick={() => toggleSection('growing-relationships')}
              className="inline-flex items-center text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              More
              {openSections['growing-relationships'] ? (
                <ChevronUp className="ml-1 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-1 h-4 w-4" />
              )}
            </button>
          </p>
          {openSections['growing-relationships'] && (
            <div id="growing-relationships" className="space-y-4 rounded-lg bg-gray-50 px-6 py-4 dark:bg-gray-800/50">
              <p>
                We naturally spend time with people near us. 
              </p>
              <p>
                People we live with, neighbors we live by, those we work, study, 
                play, or worship with. We see and talk to them regularly. 
              </p>
              <p>
                We also have old friends... 
              </p>

              <p>
                NameGame helps you stay engaged with the people in your 
                life today!
              </p>
              <p>
                Those you want to make time for (family, close friends) and 
                those you haebecause you live, work, or study 
                together. 
              </p>
              <button
                type="button"
                onClick={() => toggleSection('growing-relationships')}
                className="mx-auto flex items-center pt-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ChevronUp className="mr-1 h-4 w-4" />
                Close
              </button>
            </div>
          )}
        </section>
        <section className="mt-8 space-y-4 text-lg leading-relaxed">
          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
            width={70}
            height={70}
            className="center mx-auto h-auto w-auto"
          />
        </section>

        <section className="mt-8 space-y-4 text-lg leading-relaxed">
          <h2 className="mb-6 text-center text-2xl font-bold">How to Play</h2>
          <p>
            You don't have to be a social butterfly. Just play.
          </p>
          <ul className="ml-4 list-outside list-disc">
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
              Add your basic info <br />
            </li>
            <li>
              Create a private group
            </li>
            <li>Welcome others with a greeting code</li>
          </ul>
          <p>A greeting code is both a QR code and a link.</p>
          <ul className="ml-4 list-outside list-disc">
            <li>
              If you're together, they scan your code with their camera
            </li>
            <li>If not, they open your link via text or email</li>
          </ul>
          <p>
            People open your greeting code to enter your private group with just
            their first name.
          </p>
          <p>What happens next depends on the type of group you make.</p>
          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
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
                  NameGame does the rest, connecting everyone to your{' '}
                  <i>shared roots</i> and showing how everyone is related.
                </p>
                <p>
                  With <i>managed users</i> you can safely include everyone.
                  Grandparents or others who have passed, kids too young for
                  their own account, etc.
                </p>
                <p>
                  NameGame helps extended families stay connected, learn names,
                  communicate, plan events, share memories, and more.
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
              className="mx-auto mt-12 h-auto w-auto"
            />
          </p>

          <ul className="mt-8 mb-16 ml-4 list-outside list-disc">
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
