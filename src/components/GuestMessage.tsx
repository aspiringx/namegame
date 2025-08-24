'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from './ui/button'
import Modal from './ui/modal'
import { Brain } from 'lucide-react'
import Image from 'next/image'

export function GuestMessage({
  isGuest,
  firstName,
  groupName,
}: {
  isGuest: boolean
  firstName?: string | null
  groupName?: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (isGuest && pathname.startsWith('/g/')) {
      setIsModalOpen(true)
    }
  }, [isGuest, pathname])

  if (!isGuest) {
    return null
  }

  const handleUpdateProfile = () => {
    router.push('/me')
    setIsModalOpen(false)
  }

  const handleClose = () => {
    setIsModalOpen(false)
  }

  const modalContent = (
    <div className="p-6">
      <Image
        src="/images/butterflies.png"
        alt="NameGame social butterflies"
        width={70}
        height={70}
        className="center mx-auto h-auto w-auto"
      />
      <h3 className="mb-4 text-center text-xl font-semibold text-gray-900 dark:text-gray-100">
        Welcome {firstName}!
      </h3>
      <div className="space-y-2 text-gray-600 dark:text-gray-400">
        <p>
          <b>You're in the {groupName}</b> private NameGame group, where meeting
          and remembering names is easy and fun.
        </p>
        <p>
          <b>You're currently playing as a new guest.</b> Complete your profile
          so others can see and remember you.
        </p>
      </div>
      <div className="mt-6 flex justify-center gap-4">
        <Button onClick={handleClose} variant="outline">
          Later
        </Button>
        <Button onClick={handleUpdateProfile}>Complete Profile Now</Button>
      </div>
      <p className="mt-6">
        <b>
          While you're here, use Name Quiz
          <Brain className="mx-1 -mt-1 inline-block h-4 w-4 align-middle text-orange-500" />{' '}
        </b>
        to remember names.
      </p>
      <p className="mt-6 text-sm text-gray-500 italic dark:text-gray-400">
        p.s. If you're new to this group and laying low, feel free to continue
        as a guest.
      </p>
    </div>
  )

  // For group pages, show the modal
  if (pathname.startsWith('/g/')) {
    return (
      <Modal isOpen={isModalOpen} onClose={handleClose}>
        {modalContent}
      </Modal>
    )
  }

  // For the /me page, show an inline message
  return (
    <div className="my-2 rounded-md bg-blue-300 p-4 dark:bg-blue-900">
      <h3 className="mb-2 text-center text-lg font-semibold">
        Hi {firstName}!
      </h3>
      <p className="mb-4">
        You're playing as a guest. Add the required info below so others can
        recognize and remember you.
      </p>
      <p className="text-sm text-gray-500 italic dark:text-gray-400">
        After you save changes, check your email for a verification link to
        finish the process.
      </p>
    </div>
  )
}
