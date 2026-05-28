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
import { Tailwind } from '@react-email/tailwind';

interface VerificationEmailProps {
  code: string;
}

export const VerificationEmail = ({ code }: VerificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your BCS Verification Code: {code}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                matrix: '#22c55e',
                matrixDark: '#166534',
                matrixBright: '#4ade80',
              },
            },
          },
        }}
      >
        <Body className="bg-black font-mono text-matrix p-10 m-0">
          <Container className="border border-matrix p-8 text-center mx-auto max-w-lg bg-black">
            <Heading className="text-matrixBright uppercase tracking-widest mb-6">
              BCS_SYS:// AUTH
            </Heading>
            
            <Text className="text-matrix/80 text-base mt-5">
              An authentication request was initiated for your terminal.
            </Text>
            
            <Text className="text-matrix/80 text-base mb-8">
              Use the following verification code to proceed:
            </Text>
            
            <Container className="bg-matrix/10 border border-matrix p-5 mx-auto max-w-xs text-center my-8">
              <Text className="text-matrixBright text-3xl font-bold tracking-[0.2em] m-0">
                {code}
              </Text>
            </Container>
            
            <Text className="text-matrix/60 text-xs mt-10">
              If you did not request this, please ignore this transmission.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
