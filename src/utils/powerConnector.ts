// src/utils/powerConnector.ts
export interface PowerSocketItem {
  type: '8-pin' | '6-pin' | '12VHPWR';
  cols: number;
  hasSense: boolean;
  pinCount: number;
}

export interface PowerConnectorSpec {
  items: PowerSocketItem[];
  count: number;
  totalPins: number;
  label: string;
}

export function parsePowerConnectors(connector: string): PowerConnectorSpec {
  if (!connector) {
    return {
      items: [{ type: '8-pin', cols: 4, hasSense: false, pinCount: 8 }],
      count: 1,
      totalPins: 8,
      label: '8-pin'
    };
  }

  const norm = connector.replace(/\s+/g, '').toLowerCase();

  // 12VHPWR / 12V-2x6 / 16-pin
  if (norm.includes('12vhpwr') || norm.includes('12v-2x6') || norm.includes('16-pin')) {
    return {
      items: [{ type: '12VHPWR', cols: 6, hasSense: true, pinCount: 16 }],
      count: 1,
      totalPins: 16,
      label: connector
    };
  }

  const items: PowerSocketItem[] = [];

  const match8 = norm.match(/^(\d+)x8/);
  if (match8) {
    const count = parseInt(match8[1], 10);
    for (let i = 0; i < count; i++) {
      items.push({ type: '8-pin', cols: 4, hasSense: false, pinCount: 8 });
    }
  } else {
    const match6 = norm.match(/^(\d+)x6/);
    if (match6) {
      const count = parseInt(match6[1], 10);
      for (let i = 0; i < count; i++) {
        items.push({ type: '6-pin', cols: 3, hasSense: false, pinCount: 6 });
      }
    }
  }

  if (items.length === 0) {
    if (norm.includes('8-pin') && norm.includes('6-pin')) {
      items.push({ type: '8-pin', cols: 4, hasSense: false, pinCount: 8 });
      items.push({ type: '6-pin', cols: 3, hasSense: false, pinCount: 6 });
    } else if (norm.includes('6-pin')) {
      items.push({ type: '6-pin', cols: 3, hasSense: false, pinCount: 6 });
    } else {
      items.push({ type: '8-pin', cols: 4, hasSense: false, pinCount: 8 });
    }
  }

  const totalPins = items.reduce((sum, item) => sum + item.pinCount, 0);

  return {
    items,
    count: items.length,
    totalPins,
    label: connector
  };
}

export function getPinCount(connector: string): number {
  return parsePowerConnectors(connector).totalPins;
}

