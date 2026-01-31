import { render } from '@react-email/render';
import * as React from 'react';

export async function renderEmail(
  component: React.ReactElement,
): Promise<string> {
  return render(component, { pretty: true });
}
