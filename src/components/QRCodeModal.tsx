'use client';

import { useState } from 'react';
import { QRCodeCanvas as QRCode } from 'qrcode.react';

interface QRCodeModalProps {
  isOpen: boolean;
  url: string;
  onClose: () => void;
}

export default function QRCodeModal({ isOpen, url, onClose }: QRCodeModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy URL: ', err);
      alert('Failed to copy URL.');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl text-center relative my-8 max-w-xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-3xl text-gray-500 hover:bg-gray-200 hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          aria-label="Close modal"
        >
          <span className="mb-1">&times;</span>
        </button> 
        <h2 className="text-2xl font-bold mb-4">Greeting Code</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Share this code or URL to greet or welcome people here.
          Valid 7 days.
        </p>
        <div className="p-4 bg-white inline-block rounded-md">
          <QRCode value={url} size={200} />
        </div>
        <div className="mt-4 flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
          <p className="text-sm text-gray-600 dark:text-gray-300 break-all flex-grow mr-2">
            {url}
          </p>
          <button
            onClick={handleCopy}
            className={`px-4 py-2 text-sm font-semibold rounded-md ${isCopied ? 'bg-green-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          >
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
