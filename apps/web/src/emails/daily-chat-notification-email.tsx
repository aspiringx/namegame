import { Button, Section, Text } from '@react-email/components'
import * as React from 'react'
import { EmailTemplate } from './email-template'

interface DailyChatNotificationEmailProps {
  ssoLink: string
  firstName?: string
  notificationTitle: string
  notificationBody: string
  emoji: string
}

export const DailyChatNotificationEmail = ({
  ssoLink,
  firstName,
  notificationTitle,
  notificationBody,
  emoji,
}: DailyChatNotificationEmailProps) => (
  <EmailTemplate preview={`${emoji} ${notificationTitle} ${emoji}`}>
    <Section>
      <Text style={text} className="text">
        Hi {firstName || 'there'},
      </Text>
      <Text style={text} className="text">
        {notificationBody}
      </Text>
      <Button style={button} href={ssoLink} className="button text-center">
        View Messages
      </Button>
      <Text style={smallText} className="text">
        This is your daily digest. We&apos;ll never send more than one per day.
      </Text>
    </Section>
  </EmailTemplate>
)

const DailyChatNotificationEmailPreview = () => (
  <DailyChatNotificationEmail
    firstName="Joe"
    ssoLink="https://namegame.app/one-time-login/mock_code?openChat=true"
    notificationTitle="Tantalizing Messages"
    notificationBody="🦋🦋 someone said something 🦋🦋"
    emoji="🦋"
  />
)

export default DailyChatNotificationEmailPreview

// Helper function to generate plain text version
export const getDailyChatNotificationEmailText = (
  ssoLink: string,
  firstName: string | undefined,
  notificationBody: string,
) => `
Hi ${firstName || 'there'},

${notificationBody}

View your messages: ${ssoLink}

This is your daily digest. We'll never send more than one per day.

${new Date().getFullYear()} NameGame
`

const text = {
  color: '#000',
  fontSize: '14px',
  lineHeight: '24px',
}

const smallText = {
  color: '#666',
  fontSize: '12px',
  lineHeight: '20px',
  marginTop: '16px',
}

const button = {
  backgroundColor: '#4CAF50', // green
  color: '#fff',
  padding: '10px 20px',
  borderRadius: '5px',
  textDecoration: 'none',
  fontWeight: 'bold',
  maxWidth: '200px',
}
