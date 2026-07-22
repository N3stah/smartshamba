# SmartShamba Internal Data Access Policy

**Version:** 1.0
**Last Updated:** $(date +%Y-%m-%d)
**Scope:** This document defines the internal data access and modification policies for the SmartShamba platform. It applies to all system actors, including Super Admins, Admins, Farmers, and Buyers.

## 1. User Roles & Permissions

### Super Admin / Admin
Administrators have operational control over the platform via the `/admin` console. Authentication is handled via `httpOnly` session cookies (`smartshamba_admin`).

*   **Farmer Data:** Can view all registered farmers (including PII like phone numbers and National IDs). Can manually settle transactions on behalf of farmers. Cannot modify a farmer's core identity (Name, Phone, National ID) directly without an audit trail.
*   **Buyer Data:** Can view, create, edit, activate, and deactivate buyer profiles. All modifications are recorded in the Audit Log.
*   **Transaction Data:** Can view all transactions, manually settle transactions (requiring an M-PESA reference), and revert disputed transactions to SETTLED status.
*   **Audit Logs:** Have full access to view the immutable Audit Log trail.
*   **Dispute Notes:** Can add internal investigation notes to disputes. These notes are strictly internal and are never exposed to farmers or buyers.

### Farmer
Farmers interact with the system primarily via USSD (`*384*53374#`) and the web dashboard (`/dashboard`). Authentication is handled via OTP and the `smartshamba_farmer` session cookie.

*   **Farmer Data:** Can view and update their own location data (County, Ward, Village) during USSD registration. Can view their own transaction history and notifications.
*   **Buyer Data:** Can view the public buyer directory (Name, Location, Price per bag, and Average Rating). Cannot edit buyer data.
*   **Transaction Data:** Can create new pending transactions (Sell Maize flow). Can dispute their own SETTLED or DELIVERED transactions.
*   **Audit Logs:** No access.
*   **Dispute Notes:** No access to internal admin notes. Can only see the public status of their dispute (OPEN, UNDER_REVIEW, RESOLVED, CLOSED).

### Buyer
Buyers interact with the system via the web dashboard. Authentication is handled via OTP and the `smartshamba_buyer` session cookie (where implemented).

*   **Farmer Data:** Can view the name and location of farmers they are actively transacting with. Cannot view farmer PII (Phone, National ID) unless a transaction is confirmed.
*   **Buyer Data:** Can view and update their own profile details (Name, Location, Capacity, Price).
*   **Transaction Data:** Can view transactions assigned to them. Can confirm or reject pending transactions.
*   **Audit Logs:** No access.
*   **Dispute Notes:** No access to internal admin notes.

## 2. Data Classification

### Farmer Data
*   **Phone Number:** PII. Used for authentication, SMS notifications, and USSD routing. Visible to Admins. Visible to Buyers only upon confirmed transaction.
*   **National ID (KYC-lite):** PII. Collected during USSD registration. Used for identity validation. Visible to Admins only. Never exposed to Buyers or other Farmers.
*   **Location (County, Ward, Village):** Operational Data. Used for geographic expansion and matching. Visible to Admins and Buyers.
*   **Transactions:** Operational Data. Visible to the Farmer, Admins, and the associated Buyer.

### Buyer Data
*   **Visibility:** Public directory visible to all farmers. Profile details visible to the Buyer and Admins.
*   **Editing Permissions:** Only the Buyer themselves or an Admin can modify buyer profile data. Changes are logged in the Audit Log.

### Transaction Data
*   **Create:** Farmers create pending transactions via USSD or the web dashboard.
*   **Settle:** Admins can manually settle transactions via the `/admin` console. This requires an M-PESA reference code and is heavily audited.
*   **Dispute:** Farmers can dispute a transaction via USSD or the web dashboard. This atomically changes the transaction status to DISPUTED.
*   **Resolve:** Admins can resolve or close disputes via the `/admin` console. Resolving a dispute atomically reverts the transaction status to SETTLED.

## 3. Audit Logs & Dispute Notes

### Audit Logs
*   **Immutable Records:** Audit log entries (`AuditLog` model) are append-only. Once created, they cannot be edited or deleted by any user, including Super Admins.
*   **Retention:** Audit logs are retained indefinitely to provide a complete historical record of administrative actions.
*   **Visibility:** Accessible only to authenticated Admins via the `/admin/audit-logs` endpoint.

### Dispute Notes
*   **Internal Only:** The `adminNotes` field on the `Dispute` model is strictly for internal administrative use.
*   **Access:** Notes can be added by Admins via the `/admin/disputes` console.
*   **Restrictions:** Never exposed in API responses sent to Farmers or Buyers. Never displayed in the USSD flow.

## 4. Notification Data
*   **Delivery History:** The `Notification` model records the type, recipient, status (PENDING, SENT, FAILED), and timestamp of every SMS sent via Africa's Talking.
*   **Internal Access:** Delivery history is accessible only to Admins via the `/admin/notifications` endpoint.
*   **Preferences:** Farmers can toggle non-critical notification types (e.g., Weekly Market Report) via the `/dashboard/notifications` UI. OTP and Transactional notifications bypass preference gates.

## 5. Security Principles
*   **Least Privilege:** All API routes enforce role-based access control (`requireAdminAuth`, `requireFarmerAuth`). Middleware (`proxy.ts`) hard-blocks unauthorized access to route segments.
*   **Authentication:** Admins use a secure session cookie validated against `process.env.ADMIN_API_KEY`. Farmers use OTP-based authentication with a 5-minute expiry, issuing a `smartshamba_farmer` session cookie.
*   **Authorization:** API endpoints validate that the authenticated user has ownership of the resource being accessed (e.g., a farmer cannot view another farmer's transactions).
*   **Auditability:** Every state-changing administrative action (Settlement, Buyer Update, Dispute Resolution) is recorded with before/after state in the Audit Log.
