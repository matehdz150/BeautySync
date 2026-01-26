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
  title?: string;
  customerName: string;
  branchName: string;
  branchAddress?: string | null;
  coverUrl?: string | null;

  dateText: string; // "jueves 22 enero"
  timeText: string; // "9:10am"

  statusText: string; // "Confirmada"
  totalText: string; // "$750 MXN"
  bookingRef: string;

  manageUrl: string;
  directionsUrl?: string;
  establishmentUrl?: string;
};

export function PublicBookingConfirmedEmail(props: Props) {
  const {
    title,
    customerName,
    branchName,
    branchAddress,
    coverUrl,
    dateText,
    timeText,
    statusText,
    totalText,
    bookingRef,
    manageUrl,
    directionsUrl,
    establishmentUrl,
  } = props;

  return (
    <Html>
      <Head />
      <Preview>Tu cita está confirmada</Preview>

      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Logo */}
          <Section style={{ textAlign: 'center', paddingTop: 24 }}>
            <Text style={styles.brand}>BeautySync</Text>
          </Section>

          {/* Title */}
          <Section style={{ textAlign: 'center', padding: '10px 16px' }}>
            <Heading style={styles.h1}>
              Hola, {customerName}: tu cita está{' '}
              <span style={styles.h1Accent}>confirmada</span>
            </Heading>
          </Section>

          {/* Cover card */}
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
            <Text style={styles.branchDate}>
              {dateText} a las <strong>{timeText}</strong>
            </Text>

            {/* Actions */}
            <Section style={styles.actionsRow}>
              <Button href={manageUrl} style={styles.primaryBtn}>
                Gestionar
              </Button>

              <Section style={styles.secondaryRow}>
                {directionsUrl ? (
                  <Button href={directionsUrl} style={styles.secondaryBtn}>
                    Direcciones
                  </Button>
                ) : null}

                {establishmentUrl ? (
                  <Button href={establishmentUrl} style={styles.secondaryBtn}>
                    Establecimiento
                  </Button>
                ) : null}
              </Section>
            </Section>
          </Section>

          {/* Details */}
          <Section style={styles.card}>
            <Text style={styles.badge}>{statusText}</Text>

            <Text style={styles.sectionTitle}>Datos de la cita</Text>

            <Section style={styles.rowBetween}>
              <Text style={styles.detailLeft}>Total</Text>
              <Text style={styles.detailRight}>{totalText}</Text>
            </Section>

            <Hr style={styles.hr} />

            <Text style={styles.muted}>
              Ref. de la reserva: <strong>{bookingRef}</strong>
            </Text>
          </Section>

          {/* Location */}
          <Section style={styles.card}>
            <Text style={styles.sectionTitle}>Ubicación</Text>
            <Text style={styles.branchNameSmall}>{branchName}</Text>
            {branchAddress ? (
              <Text style={styles.muted}>{branchAddress}</Text>
            ) : null}
          </Section>

          <Text style={styles.footer}>
            Si tú no hiciste esta reserva, ignora este correo.
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
    fontSize: 32,
    lineHeight: '38px',
    fontWeight: 900,
    margin: 0,
    color: '#111827',
  },
  h1Accent: {
    color: '#6D28D9', // indigo-700-ish
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
  },
  branchName: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 800,
    margin: '14px 0 6px',
    color: '#111827',
  },
  branchDate: {
    textAlign: 'center',
    margin: 0,
    fontSize: 16,
    color: '#374151',
  },
  actionsRow: {
    marginTop: 16,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: '#111827',
    color: '#ffffff',
    padding: '12px 18px',
    borderRadius: 999,
    fontWeight: 700,
    display: 'inline-block',
    textDecoration: 'none',
  },
  secondaryRow: {
    marginTop: 10,
    display: 'flex',
    justifyContent: 'center',
    gap: 10,
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
  badge: {
    display: 'inline-block',
    backgroundColor: '#EEF2FF',
    color: '#4338CA',
    padding: '6px 12px',
    borderRadius: 999,
    fontWeight: 700,
    fontSize: 13,
    margin: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 800,
    margin: '14px 0 10px',
    color: '#111827',
  },
  rowBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLeft: {
    margin: 0,
    color: '#6B7280',
    fontSize: 14,
  },
  detailRight: {
    margin: 0,
    color: '#111827',
    fontWeight: 900,
    fontSize: 16,
  },
  hr: {
    borderColor: '#E5E7EB',
    margin: '12px 0',
  },
  muted: {
    margin: 0,
    color: '#6B7280',
    fontSize: 13,
  },
  branchNameSmall: {
    margin: '6px 0 4px',
    fontWeight: 800,
    color: '#111827',
  },
  footer: {
    textAlign: 'center',
    marginTop: 18,
    fontSize: 12,
    color: '#6B7280',
  },
};
