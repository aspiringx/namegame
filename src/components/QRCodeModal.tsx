'use client';

import { QRCodeCanvas as QRCode } from 'qrcode.react';

interface QRCodeModalProps {
  isOpen: boolean;
  url: string;
  onClose: () => void;
}

export default function QRCodeModal({ isOpen, url, onClose }: QRCodeModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl text-center relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          aria-label="Close modal"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4">Scan to Greet!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Just scan with a phone camera to connect with this person and group.</p>
        <div className="p-4 bg-white inline-block rounded-md">
          <QRCode value={url} size={256} />
        </div>
        <div className="mt-4">
          <p className="text-gray-600 dark:text-gray-400 mb-2">Or share this link:</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:underline break-all"
          >
            {url}
          </a>
        </div>
      </div>
    </div>
  );
}
