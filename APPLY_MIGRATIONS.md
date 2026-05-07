# Apply Supabase Migrations + Email Setup

SQL Editor: https://supabase.com/dashboard/project/xpzamlsgjosexohhoncv/sql/new

---

## BEFORE YOU RUN ANYTHING — Enable pgvector

1. Go to: https://supabase.com/dashboard/project/xpzamlsgjosexohhoncv/database/extensions
2. Search for **vector**
3. Click **Enable**

---

## Step 1 — Schema (0001)
Already ran successfully. Skip.

---

## Step 2 — RLS Policies (0002) — FIXED

**Why it failed before:** Supabase does not allow creating functions in the `auth` schema.
The fixed version creates the helper functions in `public` schema instead.

Paste the entire contents of:
`apps/engine/supabase/migrations/0002_rls.sql`

→ https://supabase.com/dashboard/project/xpzamlsgjosexohhoncv/sql/new

---

## Step 3 — Functions & Realtime (0003) — FIXED

**Why it failed before:** The original tried to re-create `pg_net` (already built into Supabase)
and had schema path issues. Fixed version removes that and qualifies all functions with `public.`.

Paste the entire contents of:
`apps/engine/supabase/migrations/0003_functions.sql`

→ https://supabase.com/dashboard/project/xpzamlsgjosexohhoncv/sql/new

---

## Step 4 — Make Yourself Admin

After creating your user account, run this in the SQL editor (replace the UUID):

```sql
UPDATE profiles SET role = 'admin' WHERE id = 'YOUR-USER-UUID-HERE';
```

To find your UUID: Dashboard > Authentication > Users > click your user

---

## Email Setup (Supabase Auth)

### A. SMTP Configuration
Go to: https://supabase.com/dashboard/project/xpzamlsgjosexohhoncv/settings/auth

Scroll to **SMTP Settings** and enter:

| Field | Value |
|---|---|
| Enable Custom SMTP | ON |
| Sender name | SHEL INFOSEC SOC |
| Sender email | SIEM@shelinfosec.com |
| Host | smtp.hostinger.com |
| Port | 587 |
| Username | SIEM@shelinfosec.com |
| Password | Your Hostinger email password for this address |

**SMTP: Hostinger (your confirmed setup)**
- Host: `smtp.hostinger.com`
- Port: `587`
- Encryption: `STARTTLS`
- Username: `SIEM@shelinfosec.com`
- Password: Hostinger webmail password for this address
- **Gmail** — `smtp.gmail.com:587` with an App Password (2FA required)
- **Resend** (recommended for delivery) — `smtp.resend.com:465`, free 3,000 emails/mo

### B. Email Templates
Go to: https://supabase.com/dashboard/project/xpzamlsgjosexohhoncv/auth/templates

Customize each template to match the Silent Edge cyber-noir aesthetic.
**Confirm signup** template suggestion:

```html
<div style="background:#050607;color:#f4f6f5;font-family:'JetBrains Mono',monospace;padding:32px;max-width:480px">
  <div style="font-size:11px;letter-spacing:0.1em;color:#3d7eff;margin-bottom:16px">
    SHEL/infosec · SILENT EDGE PLATFORM
  </div>
  <div style="font-size:18px;font-weight:700;margin-bottom:8px">
    ACCESS REQUEST RECEIVED
  </div>
  <div style="font-size:12px;color:rgba(244,246,245,0.6);margin-bottom:24px">
    Confirm your operator credentials to gain clearance.
  </div>
  <a href="{{ .ConfirmationURL }}"
     style="display:inline-block;background:#3d7eff;color:#fff;padding:10px 24px;
            font-size:11px;letter-spacing:0.08em;text-decoration:none;border-radius:2px">
    ./confirm --credentials ◢
  </a>
  <div style="margin-top:24px;font-size:10px;color:rgba(244,246,245,0.2)">
    AUTHORIZED ACCESS ONLY · SHEL INFOSEC · SIEM@shelinfosec.com
  </div>
</div>
```

### C. Site URL + Redirect URLs
Go to: https://supabase.com/dashboard/project/xpzamlsgjosexohhoncv/settings/auth

| Setting | Value |
|---|---|
| Site URL | https://console.shelinfosec.com |
| Redirect URLs | http://localhost:3000/**, https://console.shelinfosec.com/** |

---

## MCP Access (Give Claude Direct Supabase Access)

The MCP is currently connected to a different Supabase account. To give Claude access to YOUR Silent Edge project:

1. Go to: https://supabase.com/dashboard/account/tokens
2. Click **Generate new token**
3. Name it: `Claude MCP — Silent Edge`
4. Copy the token

5. Find your MCP config file. In Claude Desktop it's at:
   - Windows: `C:\Users\User\AppData\Roaming\Claude\claude_desktop_config.json`

6. Update the Supabase MCP entry to add your token:
   ```json
   {
     "mcpServers": {
       "supabase": {
         "command": "npx",
         "args": ["-y", "@supabase/mcp-server-supabase@latest", "--access-token", "YOUR_TOKEN_HERE"]
       }
     }
   }
   ```

7. Restart Claude Desktop — I will then have full access to your Silent Edge project.
