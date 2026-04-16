/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  token: string
}

const LOGO_URL = 'https://bmgdbottgxfeqoxgslzr.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
  token,
}: SignupEmailProps) => (
  <Html lang="ar" dir="rtl">
    <Head />
    <Preview>رمز التحقق الخاص بك في ساكريكس</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} width="170" alt="ساكريكس" style={logo} />
          <Text style={tagline}>شكرًا لاختيارك ساكريكس</Text>
        </Section>

        <Heading style={h1}>تفضل رمز التحقق 🔑</Heading>

        <Text style={text}>
          هذا الرمز صالح للاستخدام لمرة واحدة لتسجيل الدخول لحسابك بأمان
        </Text>

        <Text style={text}>
          سجّل دخولك إلى <strong>ساكريكس</strong>
        </Text>
        <Text style={emailText}>{recipient}</Text>

        <Section style={codeBox}>
          <Text style={codeText}>{token}</Text>
        </Section>

        <Section style={noticeBox}>
          <Text style={noticeText}>
            ⚠️ تنتهي صلاحية هذا الرمز خلال 10 دقائق ويمكن استخدامه لمرة واحدة فقط.
          </Text>
        </Section>

        <Text style={footer}>
          إذا لم تحاول تسجيل الدخول، يمكنك تجاهل هذه الرسالة.
        </Text>
        <Text style={copyright}>© ساكريكس - جميع الحقوق محفوظة</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Tahoma, Arial, sans-serif' }
const container = { padding: '35px 30px', maxWidth: '600px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '15px' }
const logo = { display: 'block', margin: '0 auto 15px' }
const tagline = { color: '#b38a2e', fontWeight: '600' as const, fontSize: '16px', margin: '0', textAlign: 'center' as const }
const h1 = { fontSize: '32px', fontWeight: '800' as const, color: '#1f2328', margin: '30px 0 10px', textAlign: 'center' as const }
const text = { fontSize: '16px', color: '#555555', lineHeight: '26px', margin: '0 0 10px', textAlign: 'center' as const }
const emailText = { fontSize: '16px', color: '#1a73e8', margin: '0 0 25px', textAlign: 'center' as const }
const codeBox = {
  backgroundColor: '#f1f2f4',
  borderRadius: '14px',
  padding: '28px',
  textAlign: 'center' as const,
  margin: '30px 0 20px',
}
const codeText = {
  fontSize: '44px',
  fontWeight: '900' as const,
  letterSpacing: '8px',
  color: '#111111',
  margin: '0',
}
const noticeBox = {
  backgroundColor: '#eaf4ff',
  borderRadius: '14px',
  padding: '16px',
  textAlign: 'center' as const,
  margin: '0 0 20px',
}
const noticeText = { fontSize: '14px', color: '#1f3b57', margin: '0' }
const footer = { fontSize: '13px', color: '#777777', margin: '30px 0 0', textAlign: 'center' as const }
const copyright = { fontSize: '12px', color: '#999999', margin: '15px 0 0', textAlign: 'center' as const }
