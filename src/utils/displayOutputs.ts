export interface DisplayPortItem {
  type: 'DP' | 'HDMI' | 'USBC' | 'DVI';
  label: string;
}

export function parseDisplayOutputs(outputsStr?: string): DisplayPortItem[] {
  const ports: DisplayPortItem[] = [];
  if (!outputsStr) {
    return [
      { type: 'DP', label: 'DisplayPort' },
      { type: 'DP', label: 'DisplayPort' },
      { type: 'DP', label: 'DisplayPort' },
      { type: 'HDMI', label: 'HDMI' },
    ];
  }

  const parts = outputsStr.split(',').map((s) => s.trim()).filter(Boolean);

  parts.forEach((part) => {
    const match = part.match(/^(\d+)\s*x?\s*(.+)$/i);
    if (match) {
      const count = parseInt(match[1], 10);
      const name = match[2];

      let type: 'DP' | 'HDMI' | 'USBC' | 'DVI' = 'DP';
      const upper = name.toUpperCase();
      if (upper.includes('HDMI')) {
        type = 'HDMI';
      } else if (upper.includes('USB') || upper.includes('TYPE-C')) {
        type = 'USBC';
      } else if (upper.includes('DVI')) {
        type = 'DVI';
      }

      for (let i = 0; i < count; i++) {
        ports.push({ type, label: `${name} #${i + 1}` });
      }
    } else {
      let type: 'DP' | 'HDMI' | 'USBC' | 'DVI' = 'DP';
      const upper = part.toUpperCase();
      if (upper.includes('HDMI')) type = 'HDMI';
      else if (upper.includes('USB') || upper.includes('TYPE-C')) type = 'USBC';
      else if (upper.includes('DVI')) type = 'DVI';

      ports.push({ type, label: part });
    }
  });

  if (ports.length === 0) {
    return [
      { type: 'DP', label: 'DisplayPort' },
      { type: 'DP', label: 'DisplayPort' },
      { type: 'DP', label: 'DisplayPort' },
      { type: 'HDMI', label: 'HDMI' },
    ];
  }

  return ports;
}
