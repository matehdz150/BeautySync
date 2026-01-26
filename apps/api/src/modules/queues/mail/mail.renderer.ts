import { render } from '@react-email/render';
import * as React from 'react';

// eslint-disable-next-line @typescript-eslint/require-await
export async function renderEmail(
  component: React.ReactElement,
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
  return render(component, { pretty: true });
}
