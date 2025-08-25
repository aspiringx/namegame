import { Button, Section, Text } from '@react-email/components'
import * as React from 'react'
import { EmailTemplate } from './email-template'

interface PasswordResetEmailProps {
  resetLink?: string
  firstName?: string
}

export const PasswordResetEmail = ({
  resetLink,
  firstName,
}: PasswordResetEmailProps) => (
  <EmailTemplate preview="Reset your NameGame password">
    <Section>
      <Text style={text} className="text">
        {'Hi ' + firstName + ',' || 'Hi,'}
      </Text>
      <Text style={text} className="text">
        Someone recently requested a password change for your NameGame account.
        If this was you, you can set a new password here:
      </Text>
      <Button style={button} href={resetLink} className="button text-center">
        Reset Password
      </Button>
      <Text style={text} className="text">
        If you don't want to change your password or didn't request this, just
        ignore and delete this message.
      </Text>
      <Text style={text} className="text">
        To keep your account secure, please don't forward this email to anyone.
      </Text>
    </Section>
  </EmailTemplate>
)

export default () => (
  <PasswordResetEmail
    firstName="Test Joe"
    resetLink="https://example.com/reset/new-password?token=mock_token"
  />
)

// Helper function to generate plain text version
export const getPasswordResetEmailText = (
  resetLink: string,
  firstName?: string,
) => `
Hi ${firstName || ''},

Someone recently requested a password change for your NameGame account. If this was you, you can set a new password by visiting this link:
${resetLink}

If you don't want to change your password or didn't request this, just ignore and delete this message.

To keep your account secure, please don't forward this email to anyone.

${new Date().getFullYear()} NameGame
`

const text = {
  color: '#000',
  fontSize: '14px',
  lineHeight: '24px',
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
