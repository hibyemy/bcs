import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Heading,
  Preview,
} from '@react-email/components';

interface VerificationEmailProps {
  code: string;
}

export const VerificationEmail = ({ code }: VerificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your BCS Verification Code: {code}</Preview>
      <Body style={{ backgroundColor: 'black', fontFamily: 'monospace', color: '#22c55e', padding: '40px', margin: 0 }}>
        <Container style={{ border: '1px solid #22c55e', padding: '32px', textAlign: 'center', margin: '0 auto', maxWidth: '512px', backgroundColor: 'black' }}>
          <Heading style={{ color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>
            BCS_SYS:// AUTH
          </Heading>
          
          <Text style={{ color: 'rgba(34, 197, 94, 0.8)', fontSize: '16px', marginTop: '20px' }}>
            An authentication request was initiated for your terminal.
          </Text>
          
          <Text style={{ color: 'rgba(34, 197, 94, 0.8)', fontSize: '16px', marginBottom: '32px' }}>
            Use the following verification code to proceed:
          </Text>
          
          <Container style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', padding: '20px', margin: '32px auto', maxWidth: '320px', textAlign: 'center' }}>
            <Text style={{ color: '#4ade80', fontSize: '30px', fontWeight: 'bold', letterSpacing: '0.2em', margin: 0 }}>
              {code}
            </Text>
          </Container>
          
          <Text style={{ color: 'rgba(34, 197, 94, 0.6)', fontSize: '12px', marginTop: '40px' }}>
            If you did not request this, please ignore this transmission.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};
