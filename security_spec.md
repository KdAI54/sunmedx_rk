# Security Specification: SunMedx Hospital Operations Gateway

This document outlines the zero-trust Attribute-Based Access Control (ABAC) and security specifications designed for the SunMedx Medical Operations Cloud ERP system.

---

## 1. Data Invariants

Our clinical data-store enforces the following integrity laws:

*   **Log Immutability**: All records in the `activity_logs` collection are strictly write-once. Once generated, an audit log cannot be modified or deleted under any circumstances.
*   **Role-Based Partitioning**:
    *   **Admin**: Complete master access to update system catalogs (assets, parts, training courses).
    *   **Technician**: Authorized to read assets/spares, log & update service tickets, and complete safety checklists.
    *   **Procurement**: Authorized to manage and deduct stock metrics on parts catalogs but blocked from updating biomedical safety checklists.
*   **Self-Profile Integrity**: A user can only access their own `/users/{userId}` metadata. No user is authorized to update their own assigned operational tier (`role`) to prevent privilege escalation.
*   **Boundary Enforcement**: Identifiers must be alphanumeric, and string sizes must be strictly bounded to prevent Denial of Wallet index inflation.

---

## 2. "The Dirty Dozen" Malicious Payloads

The following 12 attack payloads represent structural threats blocked by our security architecture.

### Playloads 1-3: Identity Spoofing & Privilege Escalation

#### Impact Path: `/users/{userId}` (Malicious Profile Changes)

1.  **Attack P1 (Self-Assigned Admin Role Update)**: Signed-in Technician tries to modify their profile key to escalate permissions.
    ```json
    // PATH: /users/tech_uid_123 (Authenticated as tech_uid2)
    {
      "email": "technician@sunmedx.com",
      "role": "Admin", 
      "authProvider": "email"
    }
    ```
2.  **Attack P2 (Shadow Identity Hijacking)**: Authenticated attacker attempts to edit another physician's profile document.
    ```json
    // PATH: /users/doctor_uid_456 (Authenticated as attacker_uid)
    {
      "email": "doctor@sunmedx.com",
      "role": "Procurement"
    }
    ```
3.  **Attack P3 (Unverified Email Write)**: Attacker attempts to register/write with an unverified corporate domain email.
    ```json
    // auth.token.email_verified == false
    {
      "email": "fake.technician@yahoo.com",
      "role": "Technician"
    }
    ```

### Payloads 4-6: State Shortcutting & Unauthorized Writes

#### Impact Path: `/activity_logs/{logId}`

4.  **Attack P4 (Audit Log Erasure/Modification)**: Malicious actor attempts to delete or alter a clinical error trace.
    ```json
    // PATH: /activity_logs/log_999 (Action: DELETE)
    {}
    ```
5.  **Attack P5 (Audit Trail Hijacking/Spoofing)**: Attacker attempts to log an action claiming to be a system Administrator.
    ```json
    // PATH: /activity_logs/log_999 (Authenticated as Technician)
    {
      "userEmail": "admin@sunmedx.com",
      "userRole": "Admin",
      "action": "Complete Overwrite"
    }
    ```

#### Impact Path: `/assets/{assetId}`

6.  **Attack P6 (Unauthorized Equipment Calibration Tampering)**: Role-less guest tries to update the calibration status of a critical MRI scanner.
    ```json
    // PATH: /assets/mri_scanner_1 (Authenticated as Guest / No Role)
    {
      "status": "Operational",
      "calibrationDate": "2026-06-17"
    }
    ```

### Payloads 7-9: Resource Poisoning & Denial of Wallet Checks

#### Impact Path: `/tickets/{ticketId}`

7.  **Attack P7 (Junk ID Poisoning)**: Submitting a Service Ticket with a 2MB randomized character string as the ID to bloat Firestore indexed sizes.
    ```json
    // PATH: /tickets/random_junk_999999999999999... (1MB long string)
    {
      "id": "too_long...",
      "assetId": "vent_1",
      "issue": "Ventilator error"
    }
    ```
8.  **Attack P8 (Field Size Index Exploit)**: Attacker inserts an infinite size string into the clinical ticket `issue` field.
    ```json
    {
      "id": "t1",
      "assetId": "v1",
      "issue": "REPEATED_1000000_TIMES_A...",
      "priority": "High",
      "status": "Open",
      "loggedBy": "tech@sunmedx.com",
      "loggedAt": "2026-06-17"
    }
    ```
9.  **Attack P9 (Unbounded Array Injection)**: Attacker attempts to inject an array of 5,000 components to cause rendering freezes.
    ```json
    {
      "id": "t2",
      "assetId": "v1",
      "issue": "Check sensor stability",
      "priority": "Medium",
      "status": "In Progress",
      "loggedBy": "tech@sunmedx.com",
      "notes": [ "n1", "n2", "n3", ... "n5000" ] // Unbounded list
    }
    ```

### Payloads 10-12: Relational Sync Breaches

#### Impact Path: `/spares/{sparePartId}`

10. **Attack P10 (Negative Price Hijack)**: Submitting a negative price for surgical spares to trick the checkout engine into issuing refunds.
    ```json
    // PATH: /spares/sensor_99
    {
      "id": "sensor_99",
      "price": -500.0,
      "stock": 100
    }
    ```
11. **Attack P11 (Stock Drain Manipulation)**: Technician attempts to reset spare part prices or SKU codes during stock consumption checkouts.
    ```json
    // Only 'stock' field update is authorized during checkouts. Overwriting 'price' is blocked.
    {
      "price": 1.0,
      "stock": 5
    }
    ```
12. **Attack P12 (Orphaned Service Ticket Creation)**: Injecting a service ticket referencing a non-existent asset ID, leading to operational pipeline inconsistencies.
    ```json
    // PATH: /tickets/t_123
    {
      "assetId": "non_existent_biomedical_machine_id",
      "assetName": "Ghost Device"
    }
    ```

---

## 3. Test Verification Rules

All 12 attacks are guaranteed to yield a `PERMISSION_DENIED` rejection code due to strict role-verification rules, validation helpers (`isValidUser`, `isValidAsset`, `isValidSpare`, `isValidTicket`, `isValidLog`), immutability criteria (`createdAt == request.time`), size restrictions (`id.size() <= 128`), and `affectedKeys().hasOnly(...)` modifiers.
