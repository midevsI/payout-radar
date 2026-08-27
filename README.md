Payout Radar is a self-hosted Next.js Whop app that polls bounty budgets and warns creators and active workers before a bounty closes.

# Whop NextJS App Template

To run this project:

1. Install dependencies with: `pnpm i`

2. Create a Whop App on your [whop developer dashboard](https://whop.com/dashboard/developer/), then go to the "Hosting" section and:
	- Ensure the "Base URL" is set to the domain you intend to deploy the site on.
	- Ensure the "App path" is set to `/experiences/[experienceId]`
	- Ensure the "Dashboard path" is set to `/dashboard/[companyId]`
	- Ensure the "Discover path" is set to `/discover`

3. Copy the environment variables from the `.env.development` into a `.env.local`. Ensure to use real values from the whop dashboard.

4. Go to a whop created in the same org as the app you created. Navigate to the tools section and add your app.

5. Run `pnpm dev` to start the dev server. Then in the top right of the window find a translucent settings icon. Select "localhost". The default port 3000 should work.

## Production setup

This app is intended for Vercel hosting (not `whop.app` hosting). Create a Supabase project, run `db/schema.sql` in its SQL editor, and configure `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, and `WHOP_PRO_PLAN_ID` in Vercel. Keep the service-role key server-only.

Vercel Hobby does not support 15-minute Cron Jobs, so schedule `https://your-domain.vercel.app/api/cron/poll` every 15 minutes with [cron-job.org](https://cron-job.org). Configure an `Authorization` header with the value `Bearer <CRON_SECRET>`. The endpoint rejects requests without that header.

Alternatively, use the included GitHub Actions workflow. Add repository secrets named `PAYOUT_RADAR_POLL_URL` (the full endpoint URL) and `CRON_SECRET`; it runs every 15 minutes and can also be triggered manually. GitHub schedules may be delayed during high-load periods. cron-job.org may also send the secret as an `X-Cron-Secret` header.

In the Whop developer dashboard, grant `bounty:basic:read`, `notification:create`, and `forum:post:create`. The cron route uses the beta `/bounties` and `/bounty_submissions` endpoints only; no bounty webhooks are used.

## Deploying

1. Upload your fork / copy of this template to github.

2. Go to [Vercel](https://vercel.com/new) and link the repository. Deploy your application with the environment variables from your `.env.local`

3. If necessary update you "Base Domain" and webhook callback urls on the app settings page on the whop dashboard.

## Troubleshooting

**App not loading properly?** Make sure to set the "App path" in your Whop developer dashboard. The placeholder text in the UI does not mean it's set - you must explicitly enter `/experiences/[experienceId]` (or your chosen path name)
a

**Make sure to add env.local** Make sure to get the real app environment vairables from your whop dashboard and set them in .env.local


For more info, see our docs at https://dev.whop.com/introduction
