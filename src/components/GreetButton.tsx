'use client';

import { useState } from 'react';
import { useGroup } from './GroupProvider';
import { createGreetingCode } from '../app/g/[slug]/actions';
import QRCodeModal from './QRCodeModal';

export default function GreetButton() {
  const group = useGroup();
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
      const url = `${window.location.origin}/g/${group.slug}/greet/${newCode.code}`;
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
        className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
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
