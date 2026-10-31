# Email Forwarding System

## Overview

The email forwarding system allows you to automatically forward order notification emails to multiple recipients. When a new order is detected and a notification email is sent to a configured source email (e.g., `admin@example.com`), the system automatically sends copies of that email to all configured forwarding recipients (Gmail addresses or any other email).

## Database Setup

### Table: `forward_email`

A new table has been created to store email forwarding configurations:

```sql
CREATE TABLE forward_email (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_email TEXT NOT NULL,
  forward_to_email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique identifier for the forwarding rule
- `source_email`: The email that receives the notification (e.g., `admin@example.com`)
- `forward_to_email`: The Gmail or other email address that will receive a copy
- `is_active`: Whether this forwarding rule is enabled
- `created_at`: When the rule was created
- `updated_at`: When the rule was last updated

### Migration

Run the migration file to create the table:

```bash
# Execute in Supabase SQL Editor
-- Paste contents of: architecture/db_schema_full.sql (forward_email section)
```

**Default Rule:**
When the migration runs, it automatically creates one rule:
- Source: `admin@example.com`
- Forward To: `admin@example.com` (placeholder)

Update this value in the SQL file before running, or use the API to modify it later.

## How It Works

### Email Flow

1. **Order Created**: When a customer places an order (cash or bank transfer)
2. **Email Sent**: An order notification email is sent to the customer's email address
3. **Forwarding Check**: If the customer's email matches a source email in `forward_email` table, forwarded copies are sent to all active recipients
4. **Delivery**: All recipients receive the email with a "Forwarded" header

### Example Flow

Customer places an order → Email sent to customer with order details → System checks forwarding rules:
- If customer email = `admin@example.com` → Forward to all configured Gmail addresses
- If no matching rule → Email is only sent to customer

## Integration Points

### 1. Checkout Endpoint
**File:** `app/api/checkout/route.ts`

When orders are created, the system sends emails using `sendAndForwardEmail` instead of `sendEmail`:

```typescript
import { sendAndForwardEmail } from '@/lib/email-forwarder';

// For cash orders and pending orders
sendAndForwardEmail({
  to: customerInfo.email,
  subject: emailSubject,
  html: emailHtml,
});
```

### 2. Payment Webhook
**File:** `app/api/payment/webhook/route.ts`

When payment is confirmed, the confirmation email is sent with forwarding:

```typescript
sendAndForwardEmail({
  to: order.customer_email,
  subject: confirmationSubject,
  html: emailHtml,
});
```

### 3. Email Forwarder Utility
**File:** `lib/email-forwarder.ts`

Core functions:
- `sendAndForwardEmail()` - Send email and forward to configured recipients
- `getForwardingRules()` - Fetch active forwarding rules for a source email
- `addForwardingRule()` - Create a new forwarding rule
- `toggleForwardingRule()` - Enable/disable a rule
- `deleteForwardingRule()` - Delete a rule

## Admin API

### Endpoints

All endpoints require authentication (Bearer token) and admin privileges.

#### GET /api/admin/email-forwarding
Fetch all forwarding rules.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "source_email": "admin@example.com",
      "forward_to_email": "admin@gmail.com",
      "is_active": true,
      "created_at": "2024-03-01T10:00:00Z",
      "updated_at": "2024-03-01T10:00:00Z"
    }
  ]
}
```

#### POST /api/admin/email-forwarding
Add a new forwarding rule.

**Request:**
```json
{
  "sourceEmail": "admin@example.com",
  "forwardToEmail": "newadmin@gmail.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Forwarding rule added successfully"
}
```

#### PATCH /api/admin/email-forwarding
Toggle a forwarding rule's active status.

**Request:**
```json
{
  "id": "rule-uuid",
  "isActive": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Forwarding rule updated successfully"
}
```

#### DELETE /api/admin/email-forwarding
Delete a forwarding rule.

**Request:**
```json
{
  "id": "rule-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Forwarding rule deleted successfully"
}
```

## Configuration

### Update Default Forward Email

Before deploying, update the default Gmail address in the migration file:

**File:** `architecture/db_schema_full.sql` (forward_email section)

```sql
INSERT INTO forward_email (source_email, forward_to_email, is_active)
VALUES ('admin@example.com', 'admin@example.com', TRUE)
ON CONFLICT DO NOTHING;
```

### Add More Forwarding Rules

Use the admin API to add additional forwarding recipients:

```bash
curl -X POST http://localhost:3000/api/admin/email-forwarding \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceEmail": "admin@example.com",
    "forwardToEmail": "another-admin@gmail.com"
  }'
```

## Email Headers

Forwarded emails include a visual indicator at the top:

```
This is a forwarded email from: admin@example.com
```

This helps recipients understand that the email was originally sent to a different address.

## Error Handling

If forwarding fails:
- The email is still sent to the customer
- A forwarding error is logged to console
- Other forwarding recipients still receive their copies (if configured)
- The response includes an `errors` array with details

**Example response:**
```json
{
  "success": true,
  "primarySent": true,
  "forwardedTo": ["admin1@gmail.com"],
  "errors": ["Failed to forward to admin2@gmail.com: SMTP error"]
}
```

## Testing

### Test Email Forwarding Locally

1. Create a forwarding rule via API
2. Place a test order via the checkout page
3. Check the configured Gmail inbox for the forwarded email

### Test via Admin Dashboard (Future Implementation)

An admin interface can be added to manage forwarding rules without API calls.

## Security

- Only admins can view/manage forwarding rules (RLS enforced)
- All API endpoints require authentication
- Email validation is performed
- Forwarding is logged for debugging

## Troubleshooting

### Forwarded emails not arriving

1. Check that the rule is marked `is_active = TRUE`
2. Verify the forward email address is correct
3. Check SMTP credentials in `.env.local`
4. Check server logs for SMTP errors

### Wrong email format

Ensure email addresses are valid:
- Source: Usually `admin@example.com`
- Forward To: Valid Gmail or email address

## Performance

- Forwarding is non-blocking (fire-and-forget)
- Customer receives email immediately
- Forwarding happens asynchronously
- No impact on checkout/payment flow

## Future Enhancements

- [ ] Admin dashboard UI for managing forwarding rules
- [ ] Email templates for forwarded notifications
- [ ] Forwarding history/logs
- [ ] Conditional forwarding (e.g., forward only high-value orders)
- [ ] Multiple source emails support
