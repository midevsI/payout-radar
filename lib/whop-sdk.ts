import { Whop } from "@whop/sdk";

export const whopsdk = new Whop({
	appID: process.env.WHOP_APP_ID ?? process.env.NEXT_PUBLIC_WHOP_APP_ID,
	apiKey: process.env.WHOP_API_KEY,
	webhookKey: process.env.WHOP_WEBHOOK_SECRET,
});
