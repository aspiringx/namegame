"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import useWebSocket, { Message } from '@/hooks/useWebSocket';
import Select from 'react-select';

interface UserOption {
    value: string;
    label: string;
}

export default function Home() {
    const { data: session } = useSession();
    const userId = session?.user?.id;

    const { messages, isConnected, sendMessage } = useWebSocket(userId);
    const [newMessage, setNewMessage] = useState('');
    const [targetUsers, setTargetUsers] = useState<UserOption[]>([]);
    const [userOptions, setUserOptions] = useState<UserOption[]>([]);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        if (session) {
            fetch('/api/users')
                .then((res) => res.json())
                .then((users) => {
                    const options = users
                        .filter((user: { id: string }) => user.id !== userId) // Exclude current user from options
                        .map((user: { id: string; firstName: string; lastName: string }) => ({
                            value: user.id,
                            label: `${user.firstName} ${user.lastName || ''}`.trim(),
                        }));
                    setUserOptions(options);
                });
        }
    }, [session, userId]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            const otherParticipants = lastMessage.participants.filter(pId => pId !== userId);
            
            const newTargetUsers = userOptions.filter(option => 
                otherParticipants.includes(option.value)
            );

            setTargetUsers(newTargetUsers);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, userId]);

    const handleSendMessage = () => {
        const targetUserIds = targetUsers.map((user) => user.value);
        if (newMessage.trim() && targetUserIds.length > 0) {
            sendMessage(targetUserIds, newMessage);
            setNewMessage('');
        }
    };

    return (
        <div className="font-sans text-gray-800 dark:text-gray-200">
            <div className="container mx-auto max-w-3xl p-8 pt-0">
                <header className="text-center mb-8">
                    <Image
                        src="/images/NameGame-600x267.png"
                        alt="NameGame logo"
                        width={600}
                        height={267}
                        className="mx-auto h-auto md:max-w-[500px]"
                    />
                    <p className="text-2xl text-gray-600 dark:text-gray-400">
                        Easily meet people and remember names
                    </p>
                </header>

                <section className="text-lg leading-relaxed space-y-6">
                    <p>
                        <b>You're in groups...</b> extended families, schools, jobs,
                        neighborhoods, churches, teams, etc.
                    </p>
                    <p>
                        <b>Remembering names can be tricky.</b>&nbsp; Forgetting and
                        asking for reminders is embarrassing.
                    </p>
                    <p>
                        <b>You don't have to be a social butterfly</b>&nbsp; to meet
                        people and remember their names.
                    </p>
                </section>

                <section className="mt-4 text-lg leading-relaxed space-y-6 ">
                    <Image
                        src="/images/butterflies.png"
                        alt="NameGame social butterflies"
                        width={70}
                        height={70}
                        className="mx-auto w-auto h-auto center"
                    />
                </section>

                <section className="mt-8 text-lg">
                    <h2 className="text-3xl font-bold text-center mb-6">How to Play</h2>
                    <ul className="list-disc list-inside space-y-2">
                        <li>
                            <Link
                                href="/signup"
                                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                                Sign up
                            </Link>{" "}
                            or{" "}
                            <Link
                                href="/login"
                                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                                login
                            </Link>
                        </li>
                        <li>Create a private group</li>
                        <li>Add your name and pic</li>
                        <li>Greet someone with a code</li>
                    </ul>
                    <p className="my-4">
                        When someone scans your code, you get each other's names and pics so
                        you don't forget.
                    </p>
                    <p className="my-4">
                        New people can play as a <i>guest</i> with just their first name.
                    </p>
                    <p className="my-4">
                        That's it.
                        <Image
                            src="/images/butterflies.png"
                            alt="NameGame social butterflies"
                            width={48}
                            height={48}
                            className="w-auto h-auto mx-auto"
                        />
                    </p>
                </section>

                {session && (
                    <section className="mt-8 text-lg">
                        <h2 className="text-3xl font-bold text-center mb-6">Private Chat</h2>
                        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                            <div className="mb-4 h-40 overflow-y-auto border rounded p-2 bg-white dark:bg-gray-700">
                                {messages.map((msg, index) => (
                                    <div key={index}>
                                        <strong>{msg.from.name}:</strong> {msg.content}
                                    </div>
                                ))}
                            </div>
                            <div className="mb-2">
                                {isMounted && (
                                    <Select
                                        isMulti
                                        options={userOptions}
                                        value={targetUsers}
                                        onChange={(selected) => setTargetUsers(selected as UserOption[])}
                                        className="text-gray-800"
                                        placeholder="Select recipients..."
                                    />
                                )}
                            </div>
                            <div className="flex">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    className="flex-grow border rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-600"
                                    placeholder="Type a message..."
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!isConnected}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-700 disabled:bg-gray-400"
                                >
                                    Send
                                </button>
                            </div>
                            <p className="text-sm text-center mt-2">
                                Your User ID: {userId} | Connection: {isConnected ? 'Connected' : 'Disconnected'}
                            </p>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
