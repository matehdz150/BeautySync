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

  dateText: string;
  timeText: string;

  bookingRef: string;

  manageUrl: string;
  directionsUrl?: string;
  establishmentUrl?: string;

  serviceLine?: string;
  staffLine?: string;
};

export function PublicBookingReminder30mEmail(props: Props) {
  const {
    customerName,
    branchName,
    branchAddress,
    coverUrl,
    dateText,
    timeText,
    bookingRef,
    manageUrl,
    directionsUrl,
    establishmentUrl,
    serviceLine,
    staffLine,
  } = props;

  return (
    <Html>
      <Head />
      <Preview>Tu cita es en 30 minutos</Preview>

      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Logo */}
          <Section style={{ textAlign: 'center', paddingTop: 24 }}>
            <Text style={styles.brand}>BeautySync</Text>
          </Section>

          {/* Title */}
          <Section style={{ textAlign: 'center', padding: '10px 16px' }}>
            <Heading style={styles.h1}>
              Hola, {customerName}
              <br />
              tu cita es en <span style={styles.h1Accent}>30 minutos</span>
            </Heading>

            <Text style={styles.subtext}>
              Te dejamos todo listo para que llegues sin estrés ✨
            </Text>
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

            {(serviceLine || staffLine) && (
              <Text style={styles.metaLine}>
                {serviceLine ? (
                  <>
                    <strong>Servicio:</strong> {serviceLine}
                  </>
                ) : null}
                {serviceLine && staffLine ? ' · ' : null}
                {staffLine ? (
                  <>
                    <strong>Con:</strong> {staffLine}
                  </>
                ) : null}
              </Text>
            )}

            {/* Actions */}
            <Section style={styles.actionsRow}>
              <Button href={manageUrl} style={styles.primaryBtn}>
                Ver mi cita
              </Button>

              <Section style={styles.secondaryRow}>
                {directionsUrl ? (
                  <Button href={directionsUrl} style={styles.secondaryBtn}>
                    Cómo llegar
                  </Button>
                ) : null}

                {establishmentUrl ? (
                  <Button href={establishmentUrl} style={styles.secondaryBtn}>
                    Ver lugar
                  </Button>
                ) : null}
              </Section>
            </Section>
          </Section>

          {/* Quick tips */}
          <Section style={styles.card}>
            <Text style={styles.badge}>Recomendación</Text>

            <Text style={styles.sectionTitle}>Tip rápido</Text>

            <Text style={styles.mutedBlock}>
              Si puedes, llega <strong>5 minutos antes</strong> para que todo
              fluya perfecto. Si necesitas reprogramar, hazlo desde el botón de
              arriba.
            </Text>

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
            ) : (
              <Text style={styles.muted}>
                Consulta la ubicación desde tu cita.
              </Text>
            )}
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
    fontSize: 30,
    lineHeight: '36px',
    fontWeight: 900,
    margin: 0,
    color: '#111827',
  },
  h1Accent: {
    color: '#6D28D9', // indigo-700-ish
  },
  subtext: {
    margin: '10px 0 0',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: '20px',
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
  metaLine: {
    textAlign: 'center',
    margin: '10px 0 0',
    fontSize: 13,
    color: '#6B7280',
    lineHeight: '18px',
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
    backgroundColor: '#FEF3C7', // amber-100-ish
    color: '#92400E', // amber-800-ish
    padding: '6px 12px',
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 13,
    margin: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 900,
    margin: '14px 0 10px',
    color: '#111827',
  },
  mutedBlock: {
    margin: 0,
    color: '#374151',
    fontSize: 14,
    lineHeight: '20px',
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