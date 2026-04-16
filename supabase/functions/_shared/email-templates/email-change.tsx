/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

const LOGO_URL = 'https://bmgdbottgxfeqoxgslzr.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="ar" dir="rtl">
    <Head />
    <Preview>تأكيد تغيير البريد الإلكتروني - ساكريكس</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} width="170" alt="ساكريكس" style={logo} />
          <Text style={tagline}>شكرًا لاختيارك ساكريكس</Text>
        </Section>

        <Heading style={h1}>تأكيد تغيير البريد الإلكتروني ✉️</Heading>

        <Text style={text}>
          طلبت تغيير بريدك الإلكتروني في ساكريكس من{' '}
          <Link href={`mailto:${email}`} style={linkStyle}>{email}</Link>{' '}
          إلى{' '}
          <Link href={`mailto:${newEmail}`} style={linkStyle}>{newEmail}</Link>.
        </Text>

        <Text style={text}>اضغط على الزر أدناه لتأكيد هذا التغيير:</Text>

        <Section style={ctaSection}>
          <Link href={confirmationUrl} style={button}>
            تأكيد التغيير
          </Link>
        </Section>

        <Text style={footer}>
          إذا لم تطلب هذا التغيير، يرجى تأمين حسابك فورًا.
        </Text>
        <Text style={copyright}>© ساكريكس - جميع الحقوق محفوظة</Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Tahoma, Arial, sans-serif' }
const container = { padding: '35px 30px', maxWidth: '600px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '15px' }
const logo = { display: 'block', margin: '0 auto 15px' }
const tagline = { color: '#b38a2e', fontWeight: '600' as const, fontSize: '16px', margin: '0', textAlign: 'center' as const }
const h1 = { fontSize: '32px', fontWeight: '800' as const, color: '#1f2328', margin: '30px 0 10px', textAlign: 'center' as const }
const text = { fontSize: '16px', color: '#555555', lineHeight: '26px', margin: '0 0 25px', textAlign: 'center' as const }
const linkStyle = { color: '#1a73e8', textDecoration: 'underline' }
const ctaSection = { textAlign: 'center' as const, margin: '30px 0' }
const button = {
  backgroundColor: '#1f2328',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '8px',
  padding: '14px 32px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '13px', color: '#777777', margin: '30px 0 0', textAlign: 'center' as const }
const copyright = { fontSize: '12px', color: '#999999', margin: '15px 0 0', textAlign: 'center' as const }
