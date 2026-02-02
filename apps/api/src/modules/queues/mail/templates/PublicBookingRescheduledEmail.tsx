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
  Hr,
} from '@react-email/components';

type Props = {
  customerName: string;

  branchName: string;
  branchAddress?: string | null;
  coverUrl?: string | null;

  previousDateText: string;
  previousTimeText: string;

  dateText: string;
  timeText: string;

  bookingRef: string;

  rescheduledBy: 'PUBLIC' | 'MANAGER' | 'SYSTEM';
  reason?: string | null;

  manageUrl: string;
  establishmentUrl?: string;
};

export function PublicBookingRescheduledEmail(props: Props) {
  const {
    customerName,
    branchName,
    branchAddress,
    coverUrl,

    previousDateText,
    previousTimeText,

    dateText,
    timeText,

    bookingRef,
    rescheduledBy,
    reason,

    manageUrl,
    establishmentUrl,
  } = props;

  const title =
    rescheduledBy === 'MANAGER'
      ? 'El establecimiento reagendó tu cita'
      : rescheduledBy === 'PUBLIC'
        ? 'Reagendaste tu cita'
        : 'Tu cita fue reagendada';

  return (
    <Html>
      <Head />
      <Preview>Tu cita fue reagendada</Preview>

      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Brand */}
          <Section style={{ textAlign: 'center', paddingTop: 24 }}>
            <Text style={styles.brand}>BeautySync</Text>
          </Section>

          {/* Header */}
          <Section style={{ textAlign: 'center', padding: '10px 16px' }}>
            <Heading style={styles.h1}>Hola {customerName}</Heading>
            <Text style={styles.subtitle}>{title}</Text>
          </Section>

          {/* Booking card */}
          <Section style={styles.card}>
            {coverUrl ? (
              <Img
                src={coverUrl}
                width="120"
                height="120"
                style={styles.coverImg}
                alt={branchName}
              />
            ) : null}

            <Text style={styles.branchName}>{branchName}</Text>

            <Hr style={styles.hr} />

            <Text style={styles.sectionTitle}>Antes</Text>
            <Text style={styles.muted}>
              {previousDateText} a las <strong>{previousTimeText}</strong>
            </Text>

            <Hr style={styles.hr} />

            <Text style={styles.sectionTitle}>Ahora</Text>
            <Text style={styles.newDate}>
              {dateText} a las <strong>{timeText}</strong>
            </Text>

            {reason ? (
              <>
                <Hr style={styles.hr} />
                <Text style={styles.muted}>
                  <strong>Motivo:</strong> {reason}
                </Text>
              </>
            ) : null}

            <Hr style={styles.hr} />

            <Text style={styles.muted}>
              Ref. de la reserva: <strong>{bookingRef}</strong>
            </Text>
          </Section>

          {/* Actions */}
          <Section style={styles.card}>
            <Text style={styles.sectionTitle}>Gestiona tu cita</Text>

            <Section style={{ textAlign: 'center', marginTop: 12 }}>
              <Button href={manageUrl} style={styles.primaryBtn}>
                Ver detalles de la cita
              </Button>

              {establishmentUrl ? (
                <Section style={{ marginTop: 10 }}>
                  <Button href={establishmentUrl} style={styles.secondaryBtn}>
                    Ver negocio
                  </Button>
                </Section>
              ) : null}
            </Section>
          </Section>

          {/* Location */}
          {branchAddress ? (
            <Section style={styles.card}>
              <Text style={styles.muted}>
                <strong>{branchName}</strong>
              </Text>
              <Text style={styles.muted}>{branchAddress}</Text>
            </Section>
          ) : null}

          <Text style={styles.footer}>
            Si tú no realizaste este cambio, por favor contacta al
            establecimiento.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#f5f5f7',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    padding: '24px 0',
  },
  container: {
    maxWidth: 520,
    margin: '0 auto',
    padding: '0 14px',
  },
  brand: {
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: -0.3,
    margin: 0,
  },
  h1: {
    fontSize: 28,
    lineHeight: '34px',
    fontWeight: 900,
    margin: 0,
    color: '#111827',
  },
  subtitle: {
    margin: '10px 0 0',
    fontSize: 14,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
    boxShadow: '0 2px 18px rgba(0,0,0,0.06)',
  },
  coverImg: {
    borderRadius: 16,
    objectFit: 'cover',
    margin: '0 auto',
    display: 'block',
  },
  branchName: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 800,
    margin: '14px 0 6px',
    color: '#111827',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 900,
    margin: '0 0 6px',
    color: '#111827',
  },
  muted: {
    margin: 0,
    color: '#6B7280',
    fontSize: 14,
    lineHeight: '20px',
  },

  // 👇 fecha nueva destacada
  newDate: {
    margin: 0,
    fontSize: 16,
    lineHeight: '22px',
    fontWeight: 800,
    color: '#2563EB', // azul indigo (cambio positivo)
  },

  hr: {
    borderColor: '#E5E7EB',
    margin: '12px 0',
  },
  primaryBtn: {
    backgroundColor: '#111827',
    color: '#ffffff',
    padding: '12px 18px',
    borderRadius: 999,
    fontWeight: 900,
    display: 'inline-block',
    textDecoration: 'none',
    fontSize: 15,
  },
  secondaryBtn: {
    backgroundColor: '#F3F4F6',
    color: '#111827',
    padding: '10px 14px',
    borderRadius: 999,
    fontWeight: 600,
    display: 'inline-block',
    textDecoration: 'none',
    fontSize: 14,
  },
  footer: {
    textAlign: 'center',
    marginTop: 18,
    fontSize: 12,
    color: '#6B7280',
  },
};