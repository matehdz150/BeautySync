import * as React from 'react';
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
  Button,
} from '@react-email/components';

type Props = {
  staffName: string;
  invitedBy: string;
  organization: string;
  branch?: string;
  inviteLink: string;
  avatarUrl?: string | null;
};

export function StaffInviteEmail({
  staffName,
  invitedBy,
  organization,
  branch,
  inviteLink,
  avatarUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Te invitaron a unirte a {organization}</Preview>

      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={{ textAlign: 'center', paddingTop: 24 }}>
            <Text style={styles.brand}>Belza</Text>
          </Section>

          <Section style={{ textAlign: 'center', padding: '10px 16px' }}>
            {avatarUrl && (
              <Img
                src={avatarUrl}
                width="72"
                height="72"
                style={styles.avatar}
              />
            )}

            <Heading style={styles.h1}>Hola {staffName} 👋</Heading>

            <Text style={styles.subtitle}>
              <strong>{invitedBy}</strong> te invitó a unirte a{' '}
              <strong>{organization}</strong>
            </Text>

            {branch && (
              <Text style={styles.subtitle}>
                Sucursal: <strong>{branch}</strong>
              </Text>
            )}
          </Section>

          <Section style={styles.card}>
            <Text style={styles.text}>
              Haz clic abajo para aceptar tu invitación:
            </Text>

            <Button href={inviteLink} style={styles.button}>
              Aceptar invitación
            </Button>

            <Text style={styles.muted}>Este enlace expira en 24 horas.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#f5f5f7',
    fontFamily: 'sans-serif',
    padding: '24px 0',
  },
  container: {
    maxWidth: 520,
    margin: '0 auto',
  },
  brand: {
    fontSize: 20,
    fontWeight: 800,
  },
  h1: {
    fontSize: 26,
    fontWeight: 800,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 14,
  },
  avatar: {
    borderRadius: '50%',
    margin: '0 auto 10px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    textAlign: 'center',
  },
  text: {
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#111827',
    color: '#fff',
    padding: '12px 18px',
    borderRadius: 999,
    textDecoration: 'none',
    display: 'inline-block',
    fontWeight: 700,
  },
  muted: {
    marginTop: 12,
    fontSize: 12,
    color: '#6B7280',
  },
};
