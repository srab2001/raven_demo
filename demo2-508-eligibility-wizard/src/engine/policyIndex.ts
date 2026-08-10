// Static "retrieved chunk" text for each citation. In a production build this
// would be a top-k lookup over precomputed embeddings; five programs is a
// small enough set that a direct lookup table is the retrieval index.
export const POLICY_CHUNKS: Record<string, string> = {
  '38 CFR § 63.4(a)(2)': 'HUD-VASH intake eligibility — discharge character and time-since-separation thresholds for housing voucher referral.',
  '38 CFR § 61.80': 'Grant Per Diem (GPD) program eligibility criteria for homeless veterans.',
  '38 CFR § 62.30': 'Supportive Services for Veteran Families (SSVF) referral criteria for veterans at risk of homelessness.',
  '38 CFR § 21.40': 'Vocational Rehabilitation and Employment (Chapter 31) basic period of eligibility.',
  '38 CFR § 17.36': 'VA Health Care enrollment priority group assignment by discharge status and service history.',
}
