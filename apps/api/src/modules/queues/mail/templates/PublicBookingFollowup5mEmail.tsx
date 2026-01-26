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

  // 🔥 NUEVO: links de rating/review
  rateUrl: string; // link directo a calificar
  reviewUrl?: string; // opcional: dejar reseña más larga

  establishmentUrl?: string;
};

export function PublicBookingFollowup5mEmail(props: Props) {
  const {
    customerName,
    branchName,
    branchAddress,
    coverUrl,
    dateText,
    timeText,
    bookingRef,
    manageUrl,
    rateUrl,
    reviewUrl,
    establishmentUrl,
  } = props;

  return (
    <Html>
      <Head />
      <Preview>¿Qué tal estuvo tu cita?</Preview>

      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Brand */}
          <Section style={{ textAlign: 'center', paddingTop: 24 }}>
            <Text style={styles.brand}>BeautySync</Text>
          </Section>

          {/* Title */}
          <Section style={{ textAlign: 'center', padding: '10px 16px' }}>
            <Heading style={styles.h1}>
              {customerName}, ¿qué tal estuvo tu cita?{' '}
              <span style={styles.h1Accent}>✨</span>
            </Heading>

            <Text style={styles.subtitle}>
              Tu opinión ayuda a mejorar y también ayuda a otras personas a
              elegir mejor.
            </Text>
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
            <Text style={styles.branchDate}>
              {dateText} a las <strong>{timeText}</strong>
            </Text>

            <Hr style={styles.hr} />

            <Text style={styles.sectionTitle}>Califica tu experiencia</Text>

            <Text style={styles.muted}>
              Solo toma unos segundos. ¿Cómo estuvo el servicio?
            </Text>

            {/* CTA row */}
            <Section style={styles.actionsRow}>
              <Button href={rateUrl} style={styles.primaryBtn}>
                Calificar ahora ⭐️
              </Button>

              <Section style={styles.secondaryRow}>
                {reviewUrl ? (
                  <Button href={reviewUrl} style={styles.secondaryBtn}>
                    Dejar reseña ✍️
                  </Button>
                ) : null}

                <Button href={manageUrl} style={styles.secondaryBtn}>
                  Ver mi cita
                </Button>

                {establishmentUrl ? (
                  <Button href={establishmentUrl} style={styles.secondaryBtn}>
                    Ver negocio
                  </Button>
                ) : null}
              </Section>
            </Section>
          </Section>

          {/* Location */}
          <Section style={styles.card}>
            <Text style={styles.sectionTitle}>Detalles</Text>

            <Section style={styles.rowBetween}>
              <Text style={styles.detailLeft}>Estado</Text>
              <Text style={styles.detailRight}>Finalizada</Text>
            </Section>

            <Hr style={styles.hr} />

            <Text style={styles.muted}>
              Ref. de la reserva: <strong>{bookingRef}</strong>
            </Text>

            {branchAddress ? (
              <>
                <Hr style={styles.hr} />
                <Text style={styles.muted}>
                  <strong>{branchName}</strong>
                </Text>
                <Text style={styles.muted}>{branchAddress}</Text>
              </>
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
    fontSize: 28,
    lineHeight: '34px',
    fontWeight: 900,
    margin: 0,
    color: '#111827',
  },
  h1Accent: {
    color: '#6D28D9',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 900,
    margin: '0 0 10px',
    color: '#111827',
  },
  actionsRow: {
    marginTop: 14,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: '#111827',
    color: '#ffffff',
    padding: '12px 18px',
    borderRadius: 999,
    fontWeight: 900,
    display: 'inline-block',
    textDecoration: 'none',
  },
  secondaryRow: {
    marginTop: 10,
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
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
    fontSize: 14,
  },
  hr: {
    borderColor: '#E5E7EB',
    margin: '12px 0',
  },
  muted: {
    margin: 0,
    color: '#6B7280',
    fontSize: 13,
    lineHeight: '18px',
  },
  footer: {
    textAlign: 'center',
    marginTop: 18,
    fontSize: 12,
    color: '#6B7280',
  },
};
