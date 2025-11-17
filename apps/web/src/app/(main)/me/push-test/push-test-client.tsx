'use client'

import {
  sendNotification,
  getSubscriptions,
  sendDailyChatNotifications,
} from '@/actions/push'
import { Button } from '@/components/ui/button'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Loader2, RefreshCw } from 'lucide-react'

type Subscription = {
  endpoint: string
  userName: string
  userId: string
  createdAt: Date
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
    'This is a test notification from the Relation Star app!',
  )
  const [url, setUrl] = useState('/me')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const loadSubscriptions = useCallback(
    async (searchTerm: string, cursor?: string) => {
      setIsLoading(true)
      try {
        const result = await getSubscriptions({
          search: searchTerm || undefined,
          cursor,
          limit: 20,
        })

        if (cursor) {
          // Append to existing subscriptions
          setSubscriptions((prev) => [...prev, ...result.subscriptions])
        } else {
          // Replace subscriptions (new search or initial load)
          setSubscriptions(result.subscriptions)

          // Clean up selected endpoints that no longer exist
          const validEndpoints = new Set(
            result.subscriptions.map((s) => s.endpoint),
          )
          setSelectedEndpoints((prev) =>
            prev.filter((endpoint) => validEndpoints.has(endpoint)),
          )
        }

        setHasMore(result.hasMore)
        setNextCursor(result.nextCursor)
      } catch (error) {
        console.error('Error loading subscriptions:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  // Initial load
  useEffect(() => {
    loadSubscriptions('')
  }, [loadSubscriptions])

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadSubscriptions(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search, loadSubscriptions])

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading && nextCursor) {
        loadSubscriptions(search, nextCursor)
      }
    })

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, isLoading, nextCursor, search, loadSubscriptions])

  const handleSendNotification = async () => {
    if (selectedEndpoints.length === 0) {
      alert('Please select at least one device')
      return
    }

    // Use the actual origin without forcing HTTPS
    const baseUrl = window.location.origin

    // HACK: Uncomment for Android Emulator testing
    // const baseUrl = 'https://10.0.2.2:3001'
    // HACK: Uncomment for local iPhone testing (update IP as needed)
    // const baseUrl = 'https://192.168.50.177:3001'

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

    alert(
      `Sent ${successCount} notifications successfully. ${failCount} failed.`,
    )
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
    setSelectedEndpoints((prev) =>
      prev.includes(endpoint)
        ? prev.filter((e) => e !== endpoint)
        : [...prev, endpoint],
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Push Notification Test</h1>

      {/* Device Selection */}
      <div className="mb-6 rounded-lg border p-4 border-gray-700">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-300">
              Select Devices ({selectedEndpoints.length} selected)
            </h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadSubscriptions(search)}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedEndpoints.length === subscriptions.length) {
                  setSelectedEndpoints([])
                } else {
                  setSelectedEndpoints(subscriptions.map((s) => s.endpoint))
                }
              }}
            >
              {selectedEndpoints.length === subscriptions.length
                ? 'Deselect All'
                : 'Select All'}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Scrollable List */}
        <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
          {subscriptions.length === 0 && !isLoading && (
            <p className="text-sm text-gray-500 text-center py-4">
              {search
                ? 'No subscriptions found matching your search.'
                : 'No subscriptions yet.'}
            </p>
          )}

          {subscriptions.map((sub) => (
            <div key={sub.endpoint} className="flex items-center space-x-2">
              <Checkbox
                id={sub.endpoint}
                checked={selectedEndpoints.includes(sub.endpoint)}
                onCheckedChange={() => toggleEndpoint(sub.endpoint)}
              />
              <label
                htmlFor={sub.endpoint}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
              >
                {sub.userName} - {getBrowserInfo(sub.endpoint)} -{' '}
                {new Date(sub.createdAt).toLocaleString()}
              </label>
            </div>
          ))}

          {/* Infinite scroll trigger */}
          {hasMore && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}

          {isLoading && subscriptions.length === 0 && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Daily Chat Notification Button */}
      <div className="mb-6">
        <Button
          onClick={handleSendDailyChatNotifications}
          disabled={selectedEndpoints.length === 0}
          className="w-full"
        >
          Send {selectedEndpoints.length} Daily Chat Notification
          {selectedEndpoints.length !== 1 ? 's' : ''}
        </Button>
        <p className="mt-2 text-sm text-gray-400">
          Sends the same notification as the daily job: &quot;New Messages&quot;
          with link to chat
        </p>
      </div>

      <hr className="my-6 border-gray-700" />

      {/* Custom Notification Section */}
      <h2 className="mb-4 text-xl font-semibold">Custom Notification</h2>

      <div className="mb-4 space-y-2">
        <label
          htmlFor="title-input"
          className="block text-sm font-medium text-gray-300"
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
          className="block text-sm font-medium text-gray-300"
        >
          Body
        </label>
        <textarea
          id="body-textarea"
          value={body}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setBody(e.target.value)
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border-gray-600 bg-gray-800 text-white"
          rows={3}
        />
      </div>

      <div className="mb-4 space-y-2">
        <label
          htmlFor="url-input"
          className="block text-sm font-medium text-gray-300"
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
        Send {selectedEndpoints.length} Custom Notification
        {selectedEndpoints.length !== 1 ? 's' : ''}
      </Button>

      <div className="mt-6 rounded-md bg-gray-100 p-4 text-xs text-gray-600 bg-gray-800 text-gray-400">
        <p className="mb-2 font-semibold">Developer Notes:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            File:{' '}
            <code className="rounded bg-gray-200 px-1 bg-gray-700">
              apps/web/src/app/(main)/me/push-test/push-test-client.tsx
            </code>
          </li>
          <li>
            Chrome uses Firebase Cloud Messaging (FCM) - tokens stored in
            IndexedDB
          </li>
          <li>
            Edge/Safari/Firefox use standard Web Push API - subscriptions in
            browser
          </li>
          <li>
            Manual refresh: Click the refresh button to update the subscription
            list
          </li>
          <li>
            For Android Emulator or iPhone testing, uncomment baseUrl hacks in
            handleSendNotification()
          </li>
        </ul>
      </div>
    </div>
  )
}
