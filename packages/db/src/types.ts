// Client-safe types from Prisma schema - no runtime imports
// Only type imports are safe for client-side bundling

// Import only types (no runtime code)
export type * from './generated/prisma/index.js';

// Manually define enum constants to avoid runtime imports
export const Gender = {
  male: 'male' as const,
  female: 'female' as const,
  non_binary: 'non_binary' as const,
};
export type Gender = typeof Gender[keyof typeof Gender];

export const ManagedStatus = {
  full: 'full' as const,
  partial: 'partial' as const,
};
export type ManagedStatus = typeof ManagedStatus[keyof typeof ManagedStatus];

export const DatePrecision = {
  YEAR: 'YEAR' as const,
  MONTH: 'MONTH' as const,
  DAY: 'DAY' as const,
  TIME: 'TIME' as const,
  TIMESTAMP: 'TIMESTAMP' as const,
};
export type DatePrecision = typeof DatePrecision[keyof typeof DatePrecision];

export const UserUserRelationCategory = {
  family: 'family' as const,
  other: 'other' as const,
};
export type UserUserRelationCategory = typeof UserUserRelationCategory[keyof typeof UserUserRelationCategory];

// Re-export $Enums namespace for compatibility
export const $Enums = {
  Gender,
  ManagedStatus,
  DatePrecision,
  UserUserRelationCategory,
};

// Import Prisma namespace as type only (no runtime)
export type { Prisma } from './generated/prisma/index.js';
