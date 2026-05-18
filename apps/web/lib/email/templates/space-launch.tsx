import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface SpaceLaunchEmailProps {
  previewText?: string
  unsubscribeUrl?: string
}

export default function SpaceLaunchEmail({
  previewText = 'Flutter Space is live — the meta-framework for professional Flutter development',
  unsubscribeUrl,
}: SpaceLaunchEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={headerBrand}>REACT NATIVE SPACE</Text>
            <Text style={headerSubtitle}>Launch Announcement</Text>
          </Section>

          <Heading style={h1}>It&apos;s here.</Heading>

          <Text style={text}>
            Flutter Space is now open source and ready for you.
          </Text>

          <Text style={text}>
            This is a meta agentic framework and software setup designed for
            professional developers building Flutter apps. It runs on your
            subscription, your CLI agent of choice, and gives you the most
            insane code agent configuration available.
          </Text>

          <Text style={text}>
            No hosted IDE. No vendor lock-in. Just the best possible setup to
            fly when creating Flutter applications with AI.
          </Text>

          <Hr style={hr} />

          <Heading as="h2" style={h2}>
            What you get
          </Heading>

          <Text style={listItem}>
            <Text style={bullet}>&#x25B8;</Text> A battle-tested agentic
            framework for Flutter development
          </Text>
          <Text style={listItem}>
            <Text style={bullet}>&#x25B8;</Text> Works with any CLI agent —
            Claude Code, Cursor, Windsurf, or your own
          </Text>
          <Text style={listItem}>
            <Text style={bullet}>&#x25B8;</Text> Runs on your own API keys and
            subscriptions
          </Text>
          <Text style={listItem}>
            <Text style={bullet}>&#x25B8;</Text> The configuration and tooling
            pros use daily
          </Text>

          <Hr style={hr} />

          <Section style={buttonSection}>
            <Button
              style={button}
              href="https://github.com/react-native-space"
            >
              View on GitHub
            </Button>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Text style={footer}>
            You&apos;re receiving this because you joined the Flutter Space
            launch waitlist.
          </Text>
          {unsubscribeUrl && (
            <Text style={footer}>
              <Link href={unsubscribeUrl} style={link}>
                Unsubscribe
              </Link>{' '}
              from future emails
            </Text>
          )}
        </Container>
      </Body>
    </Html>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────

const main = {
  backgroundColor: '#0a0a0a',
  fontFamily:
    'ui-monospace, "SF Mono", "Cascadia Code", "Segoe UI Mono", Menlo, Monaco, Consolas, monospace',
}

const container = {
  backgroundColor: '#141414',
  margin: '0 auto',
  padding: '40px 24px',
  maxWidth: '560px',
  borderRadius: '8px',
  border: '1px solid #262626',
}

const headerSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const headerBrand = {
  fontSize: '12px',
  fontWeight: '500',
  letterSpacing: '4px',
  color: '#525252',
  margin: '0',
}

const headerSubtitle = {
  fontSize: '12px',
  color: '#404040',
  margin: '4px 0 0',
}

const h1 = {
  color: '#f5f5f5',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 16px',
  padding: '0',
  textAlign: 'center' as const,
}

const h2 = {
  color: '#e5e5e5',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 12px',
  padding: '0',
}

const text = {
  color: '#a3a3a3',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '12px 0',
}

const listItem = {
  color: '#a3a3a3',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '4px 0',
  paddingLeft: '4px',
}

const bullet = {
  color: '#0ea5e9',
  fontSize: '12px',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

const button = {
  background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 28px',
}

const hr = {
  borderColor: '#262626',
  margin: '24px 0',
}

const footer = {
  color: '#525252',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '6px 0',
  textAlign: 'center' as const,
}

const link = {
  color: '#0ea5e9',
  textDecoration: 'underline',
}
