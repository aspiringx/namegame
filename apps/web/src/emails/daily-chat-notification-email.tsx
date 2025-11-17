import { Button, Link, Section, Text } from '@react-email/components'
import * as React from 'react'
import { EmailTemplate } from './email-template'

interface DailyChatNotificationEmailProps {
  ssoLink: string
  unsubscribeLink?: string
  firstName?: string
  notificationTitle: string
  notificationBody: string
  emoji: string
}

export const DailyChatNotificationEmail = ({
  ssoLink,
  unsubscribeLink,
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
        We only send this if you have new messages and no more than daily.
      </Text>
      {unsubscribeLink && (
        <Text style={footerText} className="text">
          <Link href={unsubscribeLink} style={linkStyle}>
            Unsubscribe
          </Link>{' '}
          <br />
          <br />
          Relation Star
          <br />
          Sandy, UT 84070
        </Text>
      )}
    </Section>
  </EmailTemplate>
)

const DailyChatNotificationEmailPreview = () => (
  <DailyChatNotificationEmail
    firstName="Joe"
    ssoLink="https://namegame.app/one-time-login/mock_code?openChat=true"
    unsubscribeLink="https://namegame.app/one-time-login/mock_code?emailUnsubscribe=true"
    notificationTitle="Tantalizing Messages"
    notificationBody="🦋🦋 someone said something 🦋🦋"
    emoji="🦋"
  />
)

export default DailyChatNotificationEmailPreview

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

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '20px',
  marginTop: '16px',
}

const linkStyle = {
  color: '#8898aa',
  textDecoration: 'underline',
}
