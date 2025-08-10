import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'
interface EmailTemplateProps {
  children: React.ReactNode
  preview: string
}

export const EmailTemplate = ({ children, preview }: EmailTemplateProps) => (
  <Html>
    <Head>
      <style>
        {`
          @media (max-width: 600px) {
            .container {
              width: 100% !important;
              padding: 20px 20px 48px !important;
            }
            .h1 {
              font-size: 22px !important;
            }
            .footer {
              font-size: 14px !important;
            }
            .text {
              font-size: 16px !important;
            }
            .button {
              padding: '12px 24px' !important;
              font-size: 16px !important;
            }
          }
        `}
      </style>
    </Head>
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container} className="container">
        <Section>
          <Heading style={h1} className="h1">
            NameGame
          </Heading>
        </Section>
        {children}
        <Hr style={hr} />
        <Text style={footer} className="footer">
          © {new Date().getFullYear()} NameGame
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailTemplate

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 20px 48px',
  width: '580px',
}

const h1 = {
  color: '#000',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  lineHeight: '1.5',
  padding: '10px',
  textAlign: 'center' as const,
}

const hr = {
  border: 'none',
  borderTop: '4px solid #f06d0e',
  margin: '12px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
}
