import { AuctionProduct } from '../types';

export interface ParsedTextItem {
  title: string;
  category: string;
  condition: 'Brand New' | 'Open Box' | 'Refurbished' | 'Fairly Used';
  startingPrice: number;
  bidIncrement: number;
  estimatedMarketValue: number;
  durationSeconds: number;
  description: string;
  sellerLocation: string;
}

export function parseProductTextFile(content: string): { items: ParsedTextItem[]; errors: string[] } {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const items: ParsedTextItem[] = [];
  const errors: string[] = [];

  // Check if it is JSON text
  if (content.trim().startsWith('[') || content.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(content);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      for (const obj of arr) {
        if (!obj.title) continue;
        items.push({
          title: String(obj.title),
          category: obj.category || 'Electronics',
          condition: (obj.condition as ParsedTextItem['condition']) || 'Brand New',
          startingPrice: Number(obj.startingPrice) || 100000,
          bidIncrement: Number(obj.bidIncrement) || 5000,
          estimatedMarketValue: Number(obj.estimatedMarketValue) || (Number(obj.startingPrice) ? Number(obj.startingPrice) * 1.3 : 150000),
          durationSeconds: Number(obj.durationSeconds) || 90,
          description: obj.description || 'Imported product listing via text upload.',
          sellerLocation: obj.sellerLocation || 'Ikeja, Lagos'
        });
      }
      return { items, errors };
    } catch {
      // Fall through to plain text / CSV parser
    }
  }

  // Parse plain text / CSV / Pipe-delimited lines
  lines.forEach((line, index) => {
    // Skip comment lines starting with # or //
    if (line.startsWith('#') || line.startsWith('//') || line.toLowerCase().startsWith('title,')) {
      return;
    }

    // Delimiter can be pipe '|', comma ',', or tab '\t'
    let parts: string[] = [];
    if (line.includes('|')) {
      parts = line.split('|').map(p => p.trim());
    } else if (line.includes('\t')) {
      parts = line.split('\t').map(p => p.trim());
    } else if (line.includes(',')) {
      parts = line.split(',').map(p => p.trim());
    } else {
      // Single line product title with optional price at the end
      parts = [line];
    }

    if (parts.length === 0 || !parts[0]) return;

    const title = parts[0];
    const startingPrice = parts[1] ? parseNairaNumber(parts[1]) : 50000;
    const bidIncrement = parts[2] ? parseNairaNumber(parts[2]) : (startingPrice >= 200000 ? 10000 : 5000);
    const category = parts[3] || 'Gadgets';
    const condition = parseCondition(parts[4]);
    const estValue = parts[5] ? parseNairaNumber(parts[5]) : Math.round(startingPrice * 1.35);
    const location = parts[6] || 'Lagos, Nigeria';

    if (title.length < 2) {
      errors.push(`Line ${index + 1}: Title too short.`);
      return;
    }

    items.push({
      title,
      category,
      condition,
      startingPrice: Math.max(1000, startingPrice),
      bidIncrement: Math.max(500, bidIncrement),
      estimatedMarketValue: Math.max(startingPrice, estValue),
      durationSeconds: 90,
      description: `Premium auction item: ${title}. High quality verified batch for live auction.`,
      sellerLocation: location
    });
  });

  return { items, errors };
}

function parseNairaNumber(val: string): number {
  const cleaned = val.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 50000 : num;
}

function parseCondition(val?: string): 'Brand New' | 'Open Box' | 'Refurbished' | 'Fairly Used' {
  if (!val) return 'Brand New';
  const lower = val.toLowerCase();
  if (lower.includes('fair') || lower.includes('used')) return 'Fairly Used';
  if (lower.includes('refurb')) return 'Refurbished';
  if (lower.includes('open')) return 'Open Box';
  return 'Brand New';
}

export function convertProductsToTextFile(products: AuctionProduct[]): string {
  const header = '# Live Auction Product Queue\n# Format: Title | Starting Price (NGN) | Bid Increment (NGN) | Category | Condition | Est Market Value | Location\n';
  const rows = products.map(p => 
    `${p.title} | ${p.startingPrice} | ${p.bidIncrement} | ${p.category} | ${p.condition} | ${p.estimatedMarketValue} | ${p.seller.location}`
  ).join('\n');
  return header + rows;
}
