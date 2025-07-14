'use client';

import { useState } from 'react';
import { useGroup } from './GroupProvider';
import { createGreetingCode } from '@/app/greet/[code]/actions';
import QRCodeModal from './QRCodeModal';

export default function GreetButton() {
  const { group } = useGroup();
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [greetingUrl, setGreetingUrl] = useState('');

  const handleClick = async () => {
    if (!group) {
      alert('Error: Group context not found.');
      return;
    }

    setIsLoading(true);
    try {
      const newCode = await createGreetingCode(group.id);
      const url = `${window.location.origin}/greet/${newCode.code}`;
      setGreetingUrl(url);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to create greeting code:', error);
      alert('Failed to create greeting code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setGreetingUrl('');
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-lg font-bold disabled:opacity-50 shadow-lg transform hover:scale-105 transition-transform duration-300 ease-in-out"
        title="Share a greeting code or url"
      >
        {isLoading ? 'Generating...' : 'Greet'}
      </button>
      <QRCodeModal
        isOpen={isModalOpen}
        url={greetingUrl}
        onClose={handleCloseModal}
      />
    </>
  );
}
