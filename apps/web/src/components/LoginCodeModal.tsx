'use client';

import { useState, useTransition, useEffect } from 'react';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';

import { createLoginCode } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { User } from '@namegame/db';

interface LoginCodeModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
  groupSlug: string;
}

export function LoginCodeModal({ user, isOpen, onClose, groupId, groupSlug }: LoginCodeModalProps) {
  const [loginCode, setLoginCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen && user) {
      startTransition(async () => {
        const formData = new FormData();
        formData.append('userId', user.id);
        formData.append('groupId', String(groupId));
        formData.append('groupSlug', groupSlug);

        const result = await createLoginCode(formData);

        if (result.error) {
          toast.error(result.error);
          onClose();
        } else if (result.code) {
          setLoginCode(result.code);
        }
      });
    } else if (!isOpen) {
      setLoginCode(null);
    }
  }, [isOpen, user, groupId, groupSlug, onClose]);

  const loginUrl = loginCode ? `${window.location.origin}/one-time-login/${loginCode}` : '';

  const copyToClipboard = () => {
    if (!loginUrl) return;
    navigator.clipboard.writeText(loginUrl);
    toast.success('Login link copied to clipboard!');
  };

  if (!isOpen || !user) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/25 p-4 backdrop-blur-sm">
      <div className="relative my-8 w-full max-w-xl rounded-lg bg-white p-8 text-center shadow-xl dark:bg-gray-800">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-3xl text-gray-500 hover:bg-gray-200 hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          aria-label="Close modal"
        >
          <span className="mb-1">&times;</span>
        </button>
        <h2 className="mb-4 text-2xl font-bold">One-Time Login for {user.firstName}</h2>
        <p className="mb-4 text-left text-sm text-gray-600 dark:text-gray-300">
          Share this QR code or link with {user.firstName} to help them log in. The link expires in 7 days.
        </p>
        <div className="flex flex-col items-center gap-4 py-4">
          {isPending && <p>Generating code...</p>}
          {loginUrl && (
            <>
              <div className="inline-block rounded-md bg-white p-2">
                <QRCode value={loginUrl} size={150} />
              </div>
              <div className="mt-4 flex w-full items-center rounded-lg bg-gray-100 p-2 dark:bg-gray-700">
                <p className="mr-2 flex-grow overflow-hidden text-ellipsis whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  {loginUrl}
                </p>
                <Button type="button" size="sm" onClick={copyToClipboard}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
