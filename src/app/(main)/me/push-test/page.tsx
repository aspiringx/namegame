'use client'

import { sendNotification } from '@/actions/push'
import { Button } from '@/components/ui/button'

export default function PushTestPage() {
  const handleSendNotification = async () => {
    const payload = {
      title: 'Test Notification',
      body: 'This is a test notification from the NameGame app!',
      icon: '/icons/icon-192x192.png',
    }
    const result = await sendNotification(payload)
    if (result.success) {
      alert('Notification sent successfully!')
    } else {
      alert(`Failed to send notification: ${result.message}`)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">Push Notification Test</h1>
      <p className="mb-4">
        Click the button below to send a test notification to all your subscribed
        devices.
      </p>
      <Button onClick={handleSendNotification}>Send Test Notification</Button>
    </div>
  )
}
