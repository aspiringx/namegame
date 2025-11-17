import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface EmailTemplateProps {
  children: React.ReactNode
  preview: string
}

export const EmailTemplate = ({ children, preview }: EmailTemplateProps) => (
  <Html>
    <Tailwind>
      <Head>
        <style>
          {`
            @media (max-width: 600px) {
              .container {
                width: 100% !important;
                padding: 20px 20px 48px !important;
              }
              .headingSection {
                text-align: center !important;
                width: 100% !important;
              }
              .h1 {
                font-size: 22px !important;
              }
              .h2 {
                font-size: 16px !important;
              }
              .footer {
                font-size: 14px !important;
              }
              .text {
                font-size: 16px !important;
              }
              .button {
                padding: 12px 24px !important;
                font-size: 16px !important;
              }
            }
          `}
        </style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container} className="container">
          <Section style={headingSection}>
            <Heading style={h1} className="h1">
              Relation Star
              <br />
              <span style={h2}>Life is relationships</span>
            </Heading>
          </Section>
          {children}
          <Hr style={hr} />
          <Section style={footer} className="footer">
            <Text className="text">
              &copy; {new Date().getFullYear()} Relation Star
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
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
  maxWidth: '580px',
}

const headingSection = {
  padding: '10px 0',
}

const h1 = {
  color: 'black',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  lineHeight: '1.5',
  textAlign: 'center' as const,
}

const h2 = {
  color: 'gray',
  fontSize: '16px',
  fontWeight: 'normal',
  fontStyle: 'italic',
}

const hr = {
  border: 'none',
  borderTop: '4px solid #f06d0e',
  margin: '12px 0',
  borderColor: '#cccccc',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
}
