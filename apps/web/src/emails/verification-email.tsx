import { Button, Section, Text } from '@react-email/components'
import * as React from 'react'
import { EmailTemplate } from './email-template'

interface VerificationEmailProps {
  confirmLink?: string
  firstName?: string
}

export const VerificationEmail = ({
  confirmLink,
  firstName,
}: VerificationEmailProps) => (
  <EmailTemplate preview="Confirm your Relation Star email address">
    <Section>
      <Text style={text} className="text">
        {'Hi ' + firstName + ',' || 'Hi,'}
      </Text>
      <Text style={text} className="text">
        You&apos;ve joined a Relation Star group! Please click this link to
        verify your email address and unlock features.
      </Text>
      <Button style={button} href={confirmLink} className="button text-center">
        Verify Email
      </Button>
      <Text style={text} className="text bg-yellow-100 p-2 font-bold">
        NOTICE: Be sure to open this link in the same browser you used to save
        this email address in your Relation Star user profile.
      </Text>
      <Text style={text} className="text">
        If you did not sign up for Relation Star, please ignore this email.
      </Text>
    </Section>
  </EmailTemplate>
)

const VerificationEmailPreview = () => (
  <VerificationEmail
    firstName="Test Joe"
    confirmLink="https://example.com/verify-email?token=mock_token"
  />
)

export default VerificationEmailPreview

// Helper function to generate plain text version
export const getVerificationEmailText = (
  confirmLink: string,
  firstName?: string,
) => `
Hi ${firstName || ''},

Thanks for signing up for Relation Star! Please verify your email address by visiting this link:
${confirmLink}

NOTICE: Be sure to open this link in the same browser you used to save
this email address in your Relation Star user profile.

If you did not sign up for Relation Star, please ignore this email.

${new Date().getFullYear()} Relation Star
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
