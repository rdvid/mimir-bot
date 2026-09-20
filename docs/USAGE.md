# Usage

How to use **Mimir Bot** day to day. The bot is a thin Telegram interface over [mimir-api](https://github.com/rdvid/mimir-api) — the API owns all persistence and business logic.

## Before you start

1. mimir-api is running (default: `http://localhost:5000`).
2. `.env` is filled (`TELEGRAM_BOT_TOKEN`, `API_URL`, `TELEGRAM_ALLOWED_USER_ID`, `API_EMAIL`, `API_PASSWORD`).
3. The bot is running (`npm run dev` or `npm start`).
4. You message the bot from the Telegram account matching `TELEGRAM_ALLOWED_USER_ID`. Other users are ignored (no reply).

On startup the bot:

- Logs in to mimir-api (`POST /auth/login`) and caches the JWT
- Resolves the default **"Other"** category for new expenses

---

## Commands

### `/start`

Shows a short help message:

```text
💰 Personal Finance

Add an expense:
200 groceries
45 lunch

Commands:
/today
/week
/summary
```

### `/today`

Lists today's transactions (America/Sao_Paulo calendar day) and the expense total.

```text
💸 Today

R$ 42,00  Lunch
R$ 18,50  Uber
R$ 200,00 Groceries

Total: R$ 260,50
```

If there are none:

```text
No transactions today.
```

### `/week`

Shows the last 7 days (including today), one line per day with expense totals:

```text
📅 Last 7 days

Seg  R$ 120,00
Ter  R$ 85,50
Qua  R$ 340,00
Qui  R$ 45,00
Sex  R$ 210,00
Sáb  R$ 0,00
Dom  R$ 0,00

Total: R$ 800,50
```

Days with no expenses still appear as `R$ 0,00`.

### `/summary`

Income, expenses, and balance for the **current calendar month** (from the 1st through today):

```text
📊 Summary

Income:   R$ 5.000,00
Expenses: R$ 2.400,00
Balance:  R$ 2.600,00
```

---

## Adding expenses

Send a plain text message (not a command). Format:

```text
<amount> <description>
```

### Examples

| You send | Result |
|----------|--------|
| `200 groceries` | Expense R$ 200,00 — groceries |
| `45.50 lunch` | Expense R$ 45,50 — lunch |
| `45,50 lunch` | Same (comma decimals OK) |
| `12 coffee` | Expense R$ 12,00 — coffee |

Confirmation reply:

```text
✅ R$ 200,00 — groceries
```

### Rules

- First token must be a positive number (optional decimals with `.` or `,`)
- Everything after the amount is the description (`note` on the API)
- MVP treats all plain messages as **expenses** (type `expense`)
- Category is always the auto-resolved **"Other"** category
- Date is always **today** (America/Sao_Paulo)

### What gets sent to the API

```text
200 groceries
```

→

```http
POST /transactions
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "categoryId": "<Other UUID>",
  "type": "expense",
  "amount": 200,
  "date": "YYYY-MM-DD",
  "note": "groceries"
}
```

### Malformed input

If the message cannot be parsed:

```text
I couldn't understand that.

Example:
200 groceries
```

Examples of invalid input: `groceries`, `200`, `-10 coffee`, empty messages.

---

## Errors

Technical details are logged to the server console. Telegram replies stay short:

| Situation | Reply |
|-----------|--------|
| API unreachable | `❌ Couldn't reach the finance API.` |
| Auth failure | `❌ Authentication with the finance API failed.` |
| Other API error | `❌ Finance API request failed.` |

---

## Security notes

- Only `TELEGRAM_ALLOWED_USER_ID` can use the bot.
- Bot token, API credentials, and transaction payloads are not logged.
- Do not share your bot with other Telegram accounts unless you change the allowed user ID.

---

## Quick reference

| Action | How |
|--------|-----|
| Help | `/start` |
| Add expense | `200 groceries` |
| Today | `/today` |
| Last 7 days | `/week` |
| Month summary | `/summary` |
