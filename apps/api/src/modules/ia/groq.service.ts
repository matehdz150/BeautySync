import { Injectable } from '@nestjs/common';
import Groq from 'groq-sdk';

@Injectable()
export class GroqService {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY!,
    });
  }

  async generateBranchDescription(input: {
    branchName: string;
    branchAddress?: string | null;
    services: { name: string }[];
  }) {
    const { branchName, branchAddress, services } = input;

    const servicesText =
      services.length > 0
        ? services.map((s) => `- ${s.name}`).join('\n')
        : '- (sin servicios registrados aún)';

    const prompt = `
Eres un copywriter experto en negocios locales (barberías, salones, spas, clínicas, etc).
Genera una descripción corta y atractiva para un negocio.

REGLAS:
- Escribe en español neutro.
- Máximo 2-3 líneas.
- Sonido premium y moderno.
- NO uses emojis.
- NO uses comillas.
- NO menciones "branchId".
- NO inventes servicios que no existan.

DATOS:
Nombre: ${branchName}
Dirección: ${branchAddress || 'No especificada'}
Servicios:
${servicesText}

Devuelve SOLO la descripción final.
    `.trim();

    const completion = await this.groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      temperature: 0.8,
      max_tokens: 120,
      messages: [
        {
          role: 'system',
          content:
            'Eres un asistente experto en copywriting para negocios locales.',
        },
        { role: 'user', content: prompt },
      ],
    });

    const text = completion.choices?.[0]?.message?.content?.trim() ?? '';

    return text;
  }
}
