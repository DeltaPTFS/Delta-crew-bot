# Delta Air Lines | Crew Bot

A **separate Discord application** for the Delta Crew server. Its website data source is `DeltaPTFS/Roblox-delta-web` and the main-server bot is `DeltaPTFS/deltaptfs-bot`. Nothing uses the unrelated `delta-bot` repository.

## RavenHost

| Setting | Value |
| --- | --- |
| Environment | Node.js 20 or newer |
| Install command | `npm install` |
| Build command | `npm run build` |
| Start command | `npm start` |
| Entry point | `src/index.js` |
| Health check | HTTP on `PORT` (default 3000) |

Deploy this repository on RavenHost. Populate the values from `.env.example` in RavenHost's **secret environment variables** (never commit them):

| Variable | Purpose |
| --- | --- |
| `DISCORD_TOKEN` | **Crew bot** token from Discord Developer Portal |
| `DELTA_CREW_GUILD_ID` | Crew Discord server ID (still needed from the server owner) |
| `DELTA_WEBSITE_URL` | `https://roblox-delta-web.vercel.app` or the current official site |
| `DELTA_CREW_API_SECRET` | Shared random 32+ character value, same as website |
| `CREW_ANNOUNCEMENTS_CHANNEL_ID` | Published form notices |
| `CREW_FORM_RESPONSES_CHANNEL_ID` | **Private HR-only** notification channel |
| `CREW_FLIGHTS_CHANNEL_ID` | Hosted flight announcements |
| `POLL_INTERVAL_MS` | 30000 (recommended) |

The Crew bot does not need Google Sheets credentials. The website persists authoritative forms and flights to PostgreSQL, the main bot mirrors to the Google Sheets workbook, and the Crew bot posts relevant website activity into Crew Discord.

## Crew Roles

| Role | ID | Default website access |
| --- | --- | --- |
| Board of Directors (BOD) | `1554665018690248714` | Form editor, responses |
| Leadership | `1554666461644197988` | Form editor, responses |
| Human Resources | `1554666482988875788` | Form editor, responses |
| Crew | `1554669633573888010` | Published forms matching crew role restrictions |
| Authentication required | `1554671178893885480` | No elevated form permissions |

## Commands

Run `/crew` with the appropriate `action`:

- **forms** — available forms with direct Discord-login website links
- **flights** — upcoming flights, with a crew fillout link
- **status** — show service health
- **sync** — retry unposted events (restricted to BOD/Leadership/HR)

## Delivery and authentication

The Crew bot polls an authenticated website outbox every 30 seconds, posts eligible notifications to configured channels, then confirms successful delivery. A crash between post and acknowledgement is handled by checking recent bot messages for an event marker. It never sends full application answers into a public channel.

Configure separate bot applications/tokens for the main server and Crew; on the website, set `DISCORD_BOT_TOKEN` for the main guild and `DISCORD_CREW_BOT_TOKEN` for the Crew guild. Configure `DISCORD_CREW_GUILD_ID` identically in Crew bot and website.

Enable **Server Members Intent**, invite the Crew bot with `bot` + `applications.commands` scopes, and grant access only to its announcement, flight and private HR channels. It needs read, send messages, embed links and read message history permissions.

Discord authorization is consent-based. Signing into the website may join the main Delta Air Lines guild only if the user grants Discord's `guilds.join` OAuth permission; it never silently adds users to the private Crew guild.


The SkyMiles signup announcement is maintained by the main `deltaptfs-bot`, not the Crew bot.
