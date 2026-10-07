# MavunoWise Dataset Data Dictionary

**Dataset Version:** 2024-05-20_v001
**Format:** CSV
**Canonical Unit:** KES/kg

## Columns

| Column | Description | Type | Unit | Source | Source Field | Timestamp Meaning | Nullable | Transformation | Leakage Considerations |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `date` | The date the price was observed/published. | Date (YYYY-MM-DD) | N/A | NCPB_Bulletin | Publication Date | Point-in-time valid | NO | Parsed to standard ISO format | None |
| `county` | The geographic region of the market. | String | N/A | NCPB_Bulletin | Region | N/A | NO | Normalized to "National" for NCPB | None |
| `market` | The specific market or buyer entity. | String | N/A | NCPB_Bulletin | Market Name | N/A | NO | Normalized to "NCPB" | None |
| `commodity` | The agricultural product being priced. | String | N/A | NCPB_Bulletin | Crop | N/A | NO | Normalized to "Maize" | None |
| `price_kes_per_kg` | The price of the commodity per kilogram in Kenyan Shillings. | Float | KES/kg | NCPB_Bulletin | Price per 90kg Bag | N/A | NO | Converted from 4000 KES/90kg to 44.44 KES/kg | Target variable. No future dates used. |
| `source` | The origin of the data record. | String | N/A | NCPB_Bulletin | N/A | N/A | NO | Direct mapping | None |

## Privacy & Consent
- No PII (names, phones, national IDs) is present in this dataset.
- No internal MavunoWise user data is included in this export version.
