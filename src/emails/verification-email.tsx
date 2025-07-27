import {
  Button,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { EmailTemplate } from './email-template';

interface VerificationEmailProps {
  confirmLink?: string;
}

export const VerificationEmail = ({ confirmLink }: VerificationEmailProps) => (
  <EmailTemplate preview="Confirm your NameGame email address">
    <Section>
      <Text style={text} className="text">Hi,</Text>
      <Text style={text} className="text">
        Thanks for signing up for NameGame! Please verify your email address by clicking the button below:
      </Text>
      <Button style={button} href={confirmLink} className="button">
        Verify Email
      </Button>
      <Text style={text} className="text">
        If you did not sign up for NameGame, please ignore this email.
      </Text>
    </Section>
  </EmailTemplate>
);

export default VerificationEmail;

// Helper function to generate plain text version
export const getVerificationEmailText = (confirmLink: string) => `
Hi,

Thanks for signing up for NameGame! Please verify your email address by visiting this link:
${confirmLink}

If you did not sign up for NameGame, please ignore this email.

© ${new Date().getFullYear()} NameGame
`;

const text = {
  color: '#000',
  fontSize: '14px',
  lineHeight: '24px',
};

const button = {
  backgroundColor: '#4CAF50', // green
  color: '#fff',
  padding: '10px 20px',
  borderRadius: '5px',
  textDecoration: 'none',
  fontWeight: 'bold',
};
