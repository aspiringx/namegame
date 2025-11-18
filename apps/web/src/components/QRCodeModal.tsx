'use client'

import { useState } from 'react'
import { QRCodeCanvas as QRCode } from 'qrcode.react'

interface QRCodeModalProps {
  isOpen: boolean
  url: string
  onClose: () => void
  isFamilyGroup?: boolean
}

export default function QRCodeModal({
  isOpen,
  url,
  onClose,
  isFamilyGroup,
}: QRCodeModalProps) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000) // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy URL: ', err)
      alert('Failed to copy URL.')
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/25 p-4 backdrop-blur-sm">
      <div className="relative my-8 max-w-xl rounded-lg bg-gray-800 p-8 text-center shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-3xl text-gray-500 hover:bg-gray-700 hover:text-gray-200"
          aria-label="Close modal"
        >
          <span className="mb-1">&times;</span>
        </button>
        <h2 className="mb-4 text-2xl font-bold">Greeting Code</h2>
        <p className="mb-4 text-left text-sm text-gray-300">
          {isFamilyGroup
            ? 'Share this greeting code or link to invite family here.'
            : 'Share this greeting code or link to invite people here.'}{' '}
          <i>Expires in seven days.</i>
        </p>
        <div className="inline-block rounded-md bg-white p-4">
          <QRCode value={url} size={200} />
        </div>
        <div className="mt-4 flex items-center rounded-lg bg-gray-700 p-2">
          <p className="mr-2 flex-grow text-sm break-all text-gray-300">
            {url}
          </p>
          <button
            onClick={handleCopy}
            className={`rounded-md px-4 py-2 text-sm font-semibold ${
              isCopied
                ? 'bg-green-500 text-white'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}
