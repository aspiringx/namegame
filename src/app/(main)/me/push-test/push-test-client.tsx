'use client'

import { sendNotification, getSubscriptions } from '@/actions/push'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'

type Subscription = {
  endpoint: string
  userName: string | null
}

export function PushTestClientPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('')
  const [title, setTitle] = useState('Test Notification')
  const [body, setBody] = useState(
    'This is a test notification from the NameGame app!',
  )
  const [url, setUrl] = useState('/me')

  useEffect(() => {
    async function fetchSubscriptions() {
      const subscriptionList = await getSubscriptions()
      setSubscriptions(subscriptionList)
      if (subscriptionList.length > 0) {
        setSelectedEndpoint(subscriptionList[0].endpoint)
      }
    }
    fetchSubscriptions()
  }, [])

  const handleSendNotification = async () => {
    // const origin = window.location.origin
    // // HACK: In local dev with an SSL proxy, the origin can be http even if the site is served over https.
    // // This forces https to ensure the link works on devices.
    const baseUrl = origin.startsWith('http://')
      ? origin.replace('http://', 'https://')
      : origin
    // HACK: Temporary for Android Emulator testing. Leave this commented code
    // here as a reminder for local testing.
    // const baseUrl = 'https://10.0.2.2:3001'
    // Same for local iPhone based on mac ip address which could change.
    // const baseUrl = 'https://192.168.50.177:3001'

    const payload = {
      title,
      body,
      icon: '/icons/icon-192x192.png',
      url: new URL(url, baseUrl).href,
    }
    const result = await sendNotification(payload, selectedEndpoint)
    if (result.success) {
      alert('Notification sent successfully!')
    } else {
      alert(`Failed to send notification: ${result.message}`)
    }
  }

  const subscriptionOptions: ComboboxOption[] = subscriptions.map((sub) => ({
    value: sub.endpoint,
    label: `${sub.userName} - ${sub.endpoint.substring(0, 40)}...`,
  }))

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">Push Notification Test</h1>
      <div className="mb-4 max-w-sm space-y-2">
        <label htmlFor="user-select" className="block text-sm font-medium">
          Select Device to Notify
        </label>
        <Combobox
          options={subscriptionOptions}
          selectedValue={selectedEndpoint}
          onSelectValue={setSelectedEndpoint}
          placeholder="Select a device..."
          name="subscription"
        />
      </div>
      <div className="mb-4 max-w-sm space-y-2">
        <label
          htmlFor="title-input"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Title
        </label>
        <Input
          id="title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="mb-4 max-w-sm space-y-2">
        <label
          htmlFor="body-textarea"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Body
        </label>
        <textarea
          id="body-textarea"
          value={body}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setBody(e.target.value)
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          rows={3}
        />
      </div>
      <div className="mb-4 max-w-sm space-y-2">
        <label
          htmlFor="url-input"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          URL
        </label>
        <Input
          id="url-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <p className="mb-4">
        Click the button below to send a test notification to the selected
        device.
      </p>
      <Button onClick={handleSendNotification} disabled={!selectedEndpoint}>
        Send Test Notification
      </Button>
    </div>
  )
}
