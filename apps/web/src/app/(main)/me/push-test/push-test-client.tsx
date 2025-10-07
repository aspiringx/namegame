'use client'

import { sendNotification, getSubscriptions, sendDailyChatNotifications } from '@/actions/push'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

type Subscription = {
  endpoint: string
  userName: string | null
  userId: string
}

function getBrowserInfo(endpoint: string): string {
  if (endpoint.includes('notify.windows.com')) {
    return 'Windows/Edge'
  }
  if (endpoint.includes('web.push.apple.com')) {
    return 'Apple/Safari'
  }
  if (endpoint.includes('fcm.googleapis.com')) {
    return 'Google/Chrome'
  }
  if (endpoint.includes('updates.push.services.mozilla.com')) {
    return 'Mozilla/Firefox'
  }
  return 'Unknown Device'
}

export function PushTestClientPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>([])
  const [title, setTitle] = useState('Test Notification')
  const [body, setBody] = useState(
    'This is a test notification from the NameGame app!',
  )
  const [url, setUrl] = useState('/me')

  useEffect(() => {
    async function fetchSubscriptions() {
      const subscriptionList = await getSubscriptions()
      setSubscriptions(subscriptionList)
    }
    fetchSubscriptions()
  }, [])

  const handleSendNotification = async () => {
    if (selectedEndpoints.length === 0) {
      alert('Please select at least one device')
      return
    }

    // const origin = window.location.origin
    // // HACK: In local dev with an SSL proxy, the origin can be http even if the site is served over https.
    // // This forces https to ensure the link works on devices.
    const baseUrl = window.location.origin.startsWith('http://')
      ? window.location.origin.replace('http://', 'https://')
      : window.location.origin
    // // HACK: Temporary for Android Emulator testing. Leave this commented code
    // // here as a reminder for local testing.
    // // const baseUrl = 'https://10.0.2.2:3001'
    // // Same for local iPhone based on mac ip address which could change.
    // // const baseUrl = 'https://192.168.50.177:3001'

    const payload = {
      title,
      body,
      icon: '/icon.png',
      badge: '/icon.png',
      data: {
        url: `${baseUrl}${url}`,
      },
    }

    let successCount = 0
    let failCount = 0

    for (const endpoint of selectedEndpoints) {
      const result = await sendNotification(payload, endpoint)
      if (result.success) {
        successCount++
      } else {
        failCount++
      }
    }

    alert(`Sent ${successCount} notifications successfully. ${failCount} failed.`)
  }

  const handleSendDailyChatNotifications = async () => {
    if (selectedEndpoints.length === 0) {
      alert('Please select at least one device')
      return
    }

    const result = await sendDailyChatNotifications(selectedEndpoints)
    if (result.success) {
      alert(result.message)
    } else {
      alert(`Failed: ${result.message}`)
    }
  }

  const toggleEndpoint = (endpoint: string) => {
    setSelectedEndpoints(prev =>
      prev.includes(endpoint)
        ? prev.filter(e => e !== endpoint)
        : [...prev, endpoint]
    )
  }

  const toggleAll = () => {
    if (selectedEndpoints.length === subscriptions.length) {
      setSelectedEndpoints([])
    } else {
      setSelectedEndpoints(subscriptions.map(s => s.endpoint))
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Push Notification Test</h1>
      
      {/* Device Selection */}
      <div className="mb-6 rounded-lg border p-4 dark:border-gray-700">
        <div className="mb-3 flex items-center justify-between">
          <label className="block text-sm font-medium">
            Select Devices ({selectedEndpoints.length} selected)
          </label>
          <Button variant="outline" size="sm" onClick={toggleAll}>
            {selectedEndpoints.length === subscriptions.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
        <div className="space-y-2">
          {subscriptions.map((sub) => (
            <div key={sub.endpoint} className="flex items-center space-x-2">
              <Checkbox
                id={sub.endpoint}
                checked={selectedEndpoints.includes(sub.endpoint)}
                onCheckedChange={() => toggleEndpoint(sub.endpoint)}
              />
              <label
                htmlFor={sub.endpoint}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {sub.userName} - {getBrowserInfo(sub.endpoint)}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Chat Notification Button */}
      <div className="mb-6">
        <Button 
          onClick={handleSendDailyChatNotifications} 
          disabled={selectedEndpoints.length === 0}
          className="w-full"
        >
          Send {selectedEndpoints.length} Daily Chat Notification{selectedEndpoints.length !== 1 ? 's' : ''}
        </Button>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Sends the same notification as the daily job: &quot;New Messages&quot; with link to chat
        </p>
      </div>

      <hr className="my-6 dark:border-gray-700" />

      {/* Custom Notification Section */}
      <h2 className="mb-4 text-xl font-semibold">Custom Notification</h2>
      
      <div className="mb-4 space-y-2">
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
      
      <div className="mb-4 space-y-2">
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
      
      <div className="mb-4 space-y-2">
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
      
      <Button 
        onClick={handleSendNotification} 
        disabled={selectedEndpoints.length === 0}
        className="w-full"
      >
        Send {selectedEndpoints.length} Custom Notification{selectedEndpoints.length !== 1 ? 's' : ''}
      </Button>
    </div>
  )
}
