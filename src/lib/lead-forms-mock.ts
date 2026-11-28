export type LeadFormStatus = 'live' | 'draft' | 'paused';

export type LeadFormFieldType = 'text' | 'phone' | 'email' | 'chips' | 'select';

export interface LeadFormStepField {
  key: string;
  label: string;
  type: LeadFormFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface LeadFormStep {
  title: string;
  fields: LeadFormStepField[];
}

export interface LeadFormConfig {
  id: string;
  slug: string;
  title: string;
  headline: string;
  subheadline: string;
  brandColor: string;
  logoText: string;
  companyName: string;
  status: LeadFormStatus;
  trustBullets: string[];
  steps: LeadFormStep[];
  requireWhatsappOtp: boolean;
  duplicateStrategy?: 'merge' | 'create_new';
  thankYou: {
    title: string;
    message: string;
    bookingCta: boolean;
    whatsappCta: boolean;
    brochureCta: boolean;
    brochureUrl?: string;
  };
  automation?: {
    autoAssignRouting: boolean;
    instantWhatsappWelcome: boolean;
    whatsappTemplate: string;
    fireMetaCapi: boolean;
    defaultSourceTag: string;
    setuAiScoring: boolean;
  };
  stats: {
    views: number;
    starts: number;
    otpVerified: number;
    submissions: number;
    qualified: number;
    wonRevenueInr: number;
  };
  channels: {
    link: boolean;
    widget: boolean;
    qr: boolean;
  };
  updatedAt: string;
}

export function formatInr(amount: number): string {
  const safe = Math.round(Number(amount) || 0);
  return `₹${safe.toLocaleString('en-IN')}`;
}

export const BRAND_COLOR_PRESETS = [
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Indigo Pulse', hex: '#4F46E5' },
  { name: 'Emerald Mint', hex: '#059669' },
  { name: 'Cyan Tech', hex: '#0891B2' },
  { name: 'Amber Gold', hex: '#D97706' },
  { name: 'Rose Crimson', hex: '#E11D48' },
  { name: 'Violet Aura', hex: '#7C3AED' },
  { name: 'Slate Obsidian', hex: '#0F172A' },
];

export const MOCK_LEAD_FORMS: LeadFormConfig[] = [
  {
    id: 'frm_stab_01',
    slug: 'industrial-stabilizer-quote',
    title: 'Industrial Stabilizer Quote',
    headline: 'Get 18% GST Factory Rate Card in 60 Seconds',
    subheadline:
      'Direct OEM pricing on 3-Phase Servo Voltage Stabilizers & Transformers across Delhi-NCR & Pan-India.',
    brandColor: '#2563EB',
    logoText: 'WI',
    companyName: 'Webito Infotech Pvt Ltd',
    status: 'live',
    trustBullets: [
      'ISO 9001 & BIS Certified Heavy-Duty Copper Winding',
      'Instant 18% GST Tax Invoice & E-Way Bill Ready',
      '48-Hour Dispatch from Noida & Gurugram Hubs',
    ],
    steps: [
      {
        title: 'Requirement & Capacity',
        fields: [
          {
            key: 'capacity_kva',
            label: 'Select Required Capacity (KVA)',
            type: 'chips',
            required: true,
            options: ['15–30 KVA', '50–100 KVA', '150–300 KVA', '500+ KVA Custom'],
          },
          {
            key: 'cooling_type',
            label: 'Cooling & Phase Type',
            type: 'chips',
            required: true,
            options: ['Oil-Cooled 3-Phase', 'Air-Cooled 3-Phase', 'Isolation Transformer'],
          },
          {
            key: 'delivery_city',
            label: 'Plant / Delivery City',
            type: 'select',
            required: true,
            options: [
              'Delhi-NCR (Noida / Gurugram / Faridabad)',
              'Maharashtra (Pune / Mumbai)',
              'Gujarat (Ahmedabad / Surat)',
              'Pan-India Dispatch',
            ],
          },
        ],
      },
      {
        title: 'Your Verified Contact Details',
        fields: [
          {
            key: 'full_name',
            label: 'Full Name',
            type: 'text',
            required: true,
            placeholder: 'e.g. Rajesh Sharma',
          },
          {
            key: 'company_name',
            label: 'Company / Factory Name',
            type: 'text',
            required: false,
            placeholder: 'e.g. RS Switchgear Pvt. Ltd.',
          },
          {
            key: 'phone',
            label: 'WhatsApp Mobile Number',
            type: 'phone',
            required: true,
            placeholder: '98112 45678',
          },
          {
            key: 'email',
            label: 'Work Email (For PDF Proforma)',
            type: 'email',
            required: false,
            placeholder: 'procurement@company.in',
          },
        ],
      },
    ],
    requireWhatsappOtp: true,
    duplicateStrategy: 'merge',
    thankYou: {
      title: 'Rate Card & Quote Request Confirmed!',
      message:
        'Our Noida industrial specialist has received your requirement and dispatched the PDF datasheet to your WhatsApp.',
      bookingCta: true,
      whatsappCta: true,
      brochureCta: true,
      brochureUrl: 'https://leadsetu.app/brochures/servo-stabilizer-2026.pdf',
    },
    automation: {
      autoAssignRouting: true,
      instantWhatsappWelcome: true,
      whatsappTemplate: 'b2b_gst_proforma_instant_v2',
      fireMetaCapi: true,
      defaultSourceTag: 'Instant Form · Google Ads',
      setuAiScoring: true,
    },
    stats: {
      views: 1840,
      starts: 920,
      otpVerified: 412,
      submissions: 412,
      qualified: 248,
      wonRevenueInr: 2480000,
    },
    channels: {
      link: true,
      widget: true,
      qr: true,
    },
    updatedAt: '2 hours ago',
  },
  {
    id: 'frm_dealer_02',
    slug: 'dealer-partnership-inquiry',
    title: 'Dealer Partnership Inquiry',
    headline: 'Apply for Authorized Channel Dealership 2026',
    subheadline:
      'Protected district territory margins, marketing kits, and 30-day GST credit line for B2B distributors.',
    brandColor: '#059669',
    logoText: 'WI',
    companyName: 'Webito Infotech Pvt Ltd',
    status: 'live',
    trustBullets: [
      'Up to 22% Assured Channel Partner Margin',
      'Zero Dead-Stock Guarantee & Priority Dispatch',
      'Co-Branded Digital Leads Routed to Your Territory',
    ],
    steps: [
      {
        title: 'Business Profile',
        fields: [
          {
            key: 'partner_tier',
            label: 'Preferred Dealership Tier',
            type: 'chips',
            required: true,
            options: ['City Stockist', 'State Distributor', 'System Integrator'],
          },
          {
            key: 'monthly_turnover',
            label: 'Monthly Hardware Volume',
            type: 'select',
            required: true,
            options: ['₹5L – ₹15L / mo', '₹15L – ₹50L / mo', '₹50L+ / mo'],
          },
        ],
      },
      {
        title: 'Applicant Details',
        fields: [
          {
            key: 'full_name',
            label: 'Owner / Director Name',
            type: 'text',
            required: true,
            placeholder: 'e.g. Vikramaditya Rao',
          },
          {
            key: 'phone',
            label: 'WhatsApp Number',
            type: 'phone',
            required: true,
            placeholder: '98100 22334',
          },
          {
            key: 'gstin',
            label: '15-Digit Business GSTIN (Optional)',
            type: 'text',
            required: false,
            placeholder: '07AABCU9603R1ZM',
          },
        ],
      },
    ],
    requireWhatsappOtp: true,
    duplicateStrategy: 'merge',
    thankYou: {
      title: 'Dealership Application Received!',
      message:
        'Our Channel Head will review your territory availability and share the partner margin slab PDF shortly.',
      bookingCta: true,
      whatsappCta: true,
      brochureCta: true,
      brochureUrl: 'https://leadsetu.app/brochures/partner-program.pdf',
    },
    automation: {
      autoAssignRouting: true,
      instantWhatsappWelcome: true,
      whatsappTemplate: 'dealer_welcome_kit_v1',
      fireMetaCapi: true,
      defaultSourceTag: 'Instant Form · Dealer Portal',
      setuAiScoring: true,
    },
    stats: {
      views: 1120,
      starts: 610,
      otpVerified: 274,
      submissions: 289,
      qualified: 168,
      wonRevenueInr: 1850000,
    },
    channels: {
      link: true,
      widget: true,
      qr: false,
    },
    updatedAt: 'Yesterday',
  },
  {
    id: 'frm_expo_03',
    slug: 'expo-2026-booth-qr',
    title: 'Expo 2026 Booth QR',
    headline: 'Pragati Maidan Expo — Instant Sample & Catalog Pass',
    subheadline:
      'Scan at Hall 7 Booth #B-14 to unlock special exhibition pricing valid for 7 days.',
    brandColor: '#D97706',
    logoText: 'WI',
    companyName: 'Webito Infotech Pvt Ltd',
    status: 'paused',
    trustBullets: [
      'Extra 5% Exhibition Spot-Booking Rebate',
      'Instant Technical Spec Sheet on WhatsApp',
      'Direct Engineer Callback Within 1 Hour',
    ],
    steps: [
      {
        title: 'What Interested You at the Booth?',
        fields: [
          {
            key: 'booth_interest',
            label: 'Select Demo Product',
            type: 'chips',
            required: true,
            options: ['Servo Stabilizer', 'APFC Panel', 'Solar Inverter', 'AMC Plan'],
          },
          {
            key: 'full_name',
            label: 'Visitor Name',
            type: 'text',
            required: true,
            placeholder: 'Enter your name',
          },
          {
            key: 'phone',
            label: 'Mobile Number',
            type: 'phone',
            required: true,
            placeholder: '98711 00998',
          },
        ],
      },
    ],
    requireWhatsappOtp: false,
    duplicateStrategy: 'merge',
    thankYou: {
      title: 'Thanks for Visiting Our Booth!',
      message:
        'Your 5% Expo Rebate pass and product catalog have been delivered to your WhatsApp.',
      bookingCta: false,
      whatsappCta: true,
      brochureCta: true,
      brochureUrl: 'https://leadsetu.app/brochures/expo-catalog-2026.pdf',
    },
    automation: {
      autoAssignRouting: true,
      instantWhatsappWelcome: true,
      whatsappTemplate: 'expo_booth_followup',
      fireMetaCapi: false,
      defaultSourceTag: 'Expo 2026 · Pragati Maidan',
      setuAiScoring: true,
    },
    stats: {
      views: 640,
      starts: 418,
      otpVerified: 0,
      submissions: 304,
      qualified: 112,
      wonRevenueInr: 740000,
    },
    channels: {
      link: true,
      widget: false,
      qr: true,
    },
    updatedAt: '3 days ago',
  },
  {
    id: 'frm_insta_04',
    slug: 'instagram-catalog-request',
    title: 'Instagram Catalog Request',
    headline: 'Request Wholesale Price List & MOQ Guide',
    subheadline:
      'Tap below to receive our latest 2026 B2B catalog directly on WhatsApp in 10 seconds.',
    brandColor: '#7C3AED',
    logoText: 'WI',
    companyName: 'Webito Infotech Pvt Ltd',
    status: 'draft',
    trustBullets: [
      'Direct Manufacturer Rates (No Middlemen)',
      'Low Starter MOQ Starting 10 Units',
      'Pan-India Insured Courier & Transport',
    ],
    steps: [
      {
        title: 'Quick Buyer Details',
        fields: [
          {
            key: 'category',
            label: 'Category Needed',
            type: 'chips',
            required: true,
            options: ['Voltage Guard', 'Power Conditioning', 'Industrial UPS'],
          },
          {
            key: 'full_name',
            label: 'Your Name',
            type: 'text',
            required: true,
            placeholder: 'Your full name',
          },
          {
            key: 'phone',
            label: 'WhatsApp Number',
            type: 'phone',
            required: true,
            placeholder: '98114 77665',
          },
        ],
      },
    ],
    requireWhatsappOtp: true,
    duplicateStrategy: 'create_new',
    thankYou: {
      title: 'Catalog Sent to Your WhatsApp!',
      message: 'Check your WhatsApp messages for the downloadable PDF price list.',
      bookingCta: true,
      whatsappCta: true,
      brochureCta: true,
      brochureUrl: 'https://leadsetu.app/brochures/wholesale-catalog.pdf',
    },
    automation: {
      autoAssignRouting: true,
      instantWhatsappWelcome: true,
      whatsappTemplate: 'insta_catalog_v1',
      fireMetaCapi: true,
      defaultSourceTag: 'Instagram Bio Link',
      setuAiScoring: true,
    },
    stats: {
      views: 0,
      starts: 0,
      otpVerified: 0,
      submissions: 0,
      qualified: 0,
      wonRevenueInr: 0,
    },
    channels: {
      link: true,
      widget: false,
      qr: false,
    },
    updatedAt: 'Draft · Edited today',
  },
];

export function createBlankFormConfig(): LeadFormConfig {
  const rand = Math.floor(100 + Math.random() * 900);
  return {
    id: `frm_new_${rand}`,
    slug: `instant-quote-${rand}`,
    title: 'Untitled Form',
    headline: 'Get Your Custom 18% GST Quotation in 60 Seconds',
    subheadline:
      'Share your requirement and get verified manufacturer pricing directly on WhatsApp.',
    brandColor: '#2563EB',
    logoText: 'LS',
    companyName: 'Your Business Name',
    status: 'draft',
    trustBullets: [
      'Verified 18% GST Invoice & Transparent Rates',
      'Under 10-Second WhatsApp Catalog Delivery',
      'Direct Dedicated Sales Engineer Support',
    ],
    steps: [
      {
        title: 'Tell Us Your Requirement',
        fields: [
          {
            key: 'requirement_type',
            label: 'What are you looking for?',
            type: 'chips',
            required: true,
            options: ['Bulk Order Quote', 'Product Demo', 'Dealer Pricing'],
          },
          {
            key: 'city',
            label: 'Delivery City',
            type: 'text',
            required: false,
            placeholder: 'e.g. Noida / Delhi',
          },
        ],
      },
      {
        title: 'Where Should We Send Your Quote?',
        fields: [
          {
            key: 'full_name',
            label: 'Full Name',
            type: 'text',
            required: true,
            placeholder: 'e.g. Rajesh Sharma',
          },
          {
            key: 'phone',
            label: 'WhatsApp Mobile Number',
            type: 'phone',
            required: true,
            placeholder: '98112 45678',
          },
        ],
      },
    ],
    requireWhatsappOtp: true,
    duplicateStrategy: 'merge',
    thankYou: {
      title: 'Request Received — Check Your WhatsApp!',
      message:
        'Our specialist is preparing your quotation and will connect with you right away.',
      bookingCta: true,
      whatsappCta: true,
      brochureCta: true,
      brochureUrl: 'https://leadsetu.app/brochures/sample-catalog.pdf',
    },
    automation: {
      autoAssignRouting: true,
      instantWhatsappWelcome: true,
      whatsappTemplate: 'b2b_gst_proforma_instant_v2',
      fireMetaCapi: true,
      defaultSourceTag: 'Leadsetu Instant Form',
      setuAiScoring: true,
    },
    stats: {
      views: 0,
      starts: 0,
      otpVerified: 0,
      submissions: 0,
      qualified: 0,
      wonRevenueInr: 0,
    },
    channels: {
      link: true,
      widget: true,
      qr: true,
    },
    updatedAt: 'Just now',
  };
}

export function getMockFormBySlug(slug: string): LeadFormConfig {
  if (slug === 'new') {
    return createBlankFormConfig();
  }
  const found = MOCK_LEAD_FORMS.find(
    (item) => item.slug === slug || item.id === slug,
  );
  return found
    ? JSON.parse(JSON.stringify(found))
    : JSON.parse(JSON.stringify(MOCK_LEAD_FORMS[0]));
}
