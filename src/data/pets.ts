// Pet policy for direct bookings — applies to every property.
// Flat fee per pet, charged once per stay (not per night).
export const PET_FEE_PER_PET = 50; // USD
export const MAX_PETS = 2;

export function petFeeFor(pets: number): number {
  const n = Math.max(0, Math.min(MAX_PETS, Math.floor(pets || 0)));
  return n * PET_FEE_PER_PET;
}
