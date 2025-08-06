'use client';

import { useState } from 'react';
import { useGroup } from './GroupProvider';
import { createGreetingCode } from '@/app/greet/[code]/actions';
import QRCodeModal from './QRCodeModal';
import { Button } from './ui/button';
import { PlusIcon } from 'lucide-react';

export default function Footer() {
  const { group, isAuthorizedMember } = useGroup();
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [greetingUrl, setGreetingUrl] = useState('');

  if (!group || isAuthorizedMember !== true) {
    return (
      <footer className="fixed bottom-0 left-0 w-full h-16 bg-background text-center py-4 shadow-[0_-2px_4px_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_4px_rgba(255,255,255,0.1)]">
        <p className="text-gray-600 dark:text-gray-400">&copy; 2025 NameGame</p>
      </footer>
    );
  }

  const handleClick = async () => {
    if (!group) return;

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

  const isFamilyGroup = group.groupType?.code === 'family';
  const buttonText = isFamilyGroup ? 'Invite' : 'Greet';

  return (
    <>
      <footer className="fixed bottom-0 left-0 w-full h-20 bg-background text-center py-4 shadow-[0_-2px_4px_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_4px_rgba(255,255,255,0.1)] flex justify-center items-center">
        <Button size='lg' className='h-12' onClick={handleClick} disabled={isLoading}>
          <PlusIcon className='mr-2 h-6 w-6' />
          {isLoading ? 'Generating...' : buttonText}
        </Button>
      </footer>
      <QRCodeModal isOpen={isModalOpen} url={greetingUrl} onClose={handleCloseModal} isFamilyGroup={isFamilyGroup} />
    </>
  );
}
