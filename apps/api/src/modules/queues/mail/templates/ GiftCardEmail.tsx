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
  amountCents: string;
  code: string;
  branch?: string;
  organization: string;
  claimLink: string;
  coverUrl?: string;
};

export function GiftCardEmail(props: Props) {
  const { amountCents, code, branch, claimLink, coverUrl } = props;

  const amount = (Number(amountCents) / 100).toFixed(2);

  return (
    <Html>
      <Head />
      <Preview>🎁 Has recibido una gift card</Preview>

      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* BRAND */}
          <Section style={{ textAlign: 'center', paddingTop: 24 }}>
            <Text style={styles.brand}>Belza</Text>
          </Section>

          {/* TITLE */}
          <Section style={{ textAlign: 'center', padding: '10px 16px' }}>
            <Heading style={styles.h1}>
              🎉 ¡Felicidades! <br />
              Has recibido una <span style={styles.h1Accent}>gift card</span>
            </Heading>

            <Text style={styles.subtitle}>
              Puedes usarla en <strong>{branch}</strong>
            </Text>
          </Section>

          {/* COVER */}
          {coverUrl && (
            <Section style={styles.coverWrapper}>
              <Img
                src={coverUrl}
                width="100%"
                height="160"
                style={styles.coverImg}
              />
            </Section>
          )}

          {/* 🎁 CARD */}
          <Section style={styles.cardContainer}>
            <div
              style={{
                width: '200px',
                height: '120px',
                borderRadius: '12px',
                padding: '10px',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #5b5bf7, #c14ef0)',
                margin: '0 auto',
              }}
            >
              {/* TOP */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '10px',
                  opacity: 0.9,
                }}
              >
                <span style={{ maxWidth: 100, overflow: 'hidden' }}>
                  {branch ?? 'Gift'}
                </span>
                <span style={{ opacity: 0.7 }}>MXN</span>
              </div>

              {/* AMOUNT */}
              <p
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                ${amount}
              </p>

              {/* CODE */}
              <p
                style={{
                  fontSize: '10px',
                  opacity: 0.7,
                  fontFamily: 'monospace',
                  margin: 0,
                }}
              >
                {code.slice(0, 8)}
              </p>
            </div>
          </Section>

          {/* CTA */}
          <Section style={{ textAlign: 'center', marginTop: 20 }}>
            <Button href={claimLink} style={styles.primaryBtn}>
              Reclamar gift card
            </Button>
          </Section>

          {/* INFO */}
          <Section style={styles.card}>
            <Text style={styles.sectionTitle}>Detalles</Text>

            <Text style={styles.muted}>
              Código completo:
              <br />
              <strong>{code}</strong>
            </Text>

            <Text style={styles.muted}>
              Esta gift card puede usarse directamente en el establecimiento.
            </Text>
          </Section>

          {/* FOOTER */}
          <Text style={styles.footer}>
            Si no esperabas este regalo, puedes ignorar este correo.
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
    margin: 0,
  },
  h1: {
    fontSize: 30,
    fontWeight: 900,
    margin: 0,
    color: '#111827',
  },
  h1Accent: {
    color: '#6D28D9',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#374151',
  },
  coverWrapper: {
    marginTop: 16,
  },
  coverImg: {
    borderRadius: 16,
    objectFit: 'cover',
  },
  cardContainer: {
    marginTop: 20,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: '#111827',
    color: '#ffffff',
    padding: '12px 20px',
    borderRadius: 999,
    fontWeight: 700,
    textDecoration: 'none',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 800,
    marginBottom: 10,
  },
  muted: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
    color: '#6B7280',
  },
};
