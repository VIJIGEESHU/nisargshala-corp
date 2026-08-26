export interface VoucherProduct {
  code: 'INDIVIDUAL' | 'FAMILY' | 'KIDS';
  title: string;
  subtitle: string;
  faceValue: number;
  regularValueText: string;
  eligibleExperiences: string[];
  description: string;
  optionsDescription: string[];
  terms: string[];
}

export interface RetailExperience {
  code: string;
  title: string;
  description: string;
  currentPrice: number;
  ageMin?: number;
  ageMax?: number;
}

export const LOCKED_VOUCHER_PRODUCTS: Record<string, VoucherProduct> = {
  INDIVIDUAL: {
    code: 'INDIVIDUAL',
    title: 'Individual Experience Voucher',
    subtitle: 'Overnight Camping + Adventure',
    faceValue: 4000,
    regularValueText: 'Includes Camping Stay & Adventure Experience',
    eligibleExperiences: ['CAMPING_OVERNIGHT', 'ADVENTURE'],
    description: 'Designed for 1 individual employee for an overnight tent camping stay and full adventure module.',
    optionsDescription: [
      'Overnight Tent Camping Stay',
      'Adventure Experience Module'
    ],
    terms: [
      'Valid for 12 months from payment confirmation date',
      'Redeemable exclusively on nisargshala.in',
      'Single-use voucher, non-refundable for cash',
      'Covers 1 individual participant'
    ]
  },
  FAMILY: {
    code: 'FAMILY',
    title: 'Family Experience Voucher',
    subtitle: 'Family Camping + Adventure OR Kutuhal',
    faceValue: 12000,
    regularValueText: 'Includes Overnight Family Camping & Kutuhal Experience',
    eligibleExperiences: ['FAMILY_CAMPING', 'FAMILY_ADVENTURE', 'KUTUHAL_ADULT', 'KUTUHAL_CHILD'],
    description: 'Designed for a family of 2 Adults + 1 Child. Usable for either Overnight Family Camping OR Kutuhal Family Experience.',
    optionsDescription: [
      'OPTION A: Overnight Family Camping + Adventure (2 Adults + 1 Child)',
      'OPTION B: Kutuhal Family Experience (2 Adults + 1 Child < 7 yrs)'
    ],
    terms: [
      'Valid for 12 months from payment confirmation date',
      'Redeemable exclusively on nisargshala.in',
      'Cannot be split across multiple bookings',
      'Employee pays price difference if retail experience price exceeds voucher face value',
      'No cash refund if selected experience costs less than voucher face value'
    ]
  },
  KIDS: {
    code: 'KIDS',
    title: 'Kids Experience Voucher',
    subtitle: 'Huppya OR Sahas Outdoor Camp',
    faceValue: 7000,
    regularValueText: 'Includes Huppya OR Sahas Outdoor Camp',
    eligibleExperiences: ['HUPPYA', 'SAHAS'],
    description: 'Designed for 1 child for Nisargshala specialized outdoor experience camps.',
    optionsDescription: [
      'OPTION A: Huppya Outdoor Camp',
      'OPTION B: Sahas Adventure Camp'
    ],
    terms: [
      'Valid for 12 months from payment confirmation date',
      'Redeemable exclusively on nisargshala.in',
      'Valid for 1 child meeting the age criteria for the selected camp',
      'No cash refund for unused voucher balance'
    ]
  }
};

/**
 * Calculate corporate order total amount from quantities.
 * GST Rate is configurable via business settings (defaults to system setting).
 */
export function calculateOrderTotal(
  quantities: {
    individual: number;
    family: number;
    kids: number;
  },
  gstRate: number = 18
): {
  subtotal: number;
  gst: number;
  gstRate: number;
  total: number;
  breakdown: Array<{ code: string; title: string; count: number; unitPrice: number; total: number }>;
} {
  const breakdown = [];
  let subtotal = 0;

  if (quantities.individual > 0) {
    const itemTotal = quantities.individual * LOCKED_VOUCHER_PRODUCTS.INDIVIDUAL.faceValue;
    subtotal += itemTotal;
    breakdown.push({
      code: 'INDIVIDUAL',
      title: LOCKED_VOUCHER_PRODUCTS.INDIVIDUAL.title,
      count: quantities.individual,
      unitPrice: LOCKED_VOUCHER_PRODUCTS.INDIVIDUAL.faceValue,
      total: itemTotal
    });
  }

  if (quantities.family > 0) {
    const itemTotal = quantities.family * LOCKED_VOUCHER_PRODUCTS.FAMILY.faceValue;
    subtotal += itemTotal;
    breakdown.push({
      code: 'FAMILY',
      title: LOCKED_VOUCHER_PRODUCTS.FAMILY.title,
      count: quantities.family,
      unitPrice: LOCKED_VOUCHER_PRODUCTS.FAMILY.faceValue,
      total: itemTotal
    });
  }

  if (quantities.kids > 0) {
    const itemTotal = quantities.kids * LOCKED_VOUCHER_PRODUCTS.KIDS.faceValue;
    subtotal += itemTotal;
    breakdown.push({
      code: 'KIDS',
      title: LOCKED_VOUCHER_PRODUCTS.KIDS.title,
      count: quantities.kids,
      unitPrice: LOCKED_VOUCHER_PRODUCTS.KIDS.faceValue,
      total: itemTotal
    });
  }

  const gst = Math.round(subtotal * (gstRate / 100) * 100) / 100;
  const total = subtotal + gst;

  return { subtotal, gst, gstRate, total, breakdown };
}

