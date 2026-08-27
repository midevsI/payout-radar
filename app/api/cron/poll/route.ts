import { NextResponse } from "next/server";
import { createForumReply, createNotification, listBountiesByStatuses, listBountiesSafe, listInFlightSubmissions, updateForumPost } from "@/lib/bounty-api";
import { getCreatorSettings, getTrackedBounties, updateTrackedBounty } from "@/lib/db";
import { getPlanTier } from "@/lib/plan";
import type { Bounty } from "@/lib/bounty-types";

export const dynamic = "force-dynamic";

function progressBar(pct: number) {
	const filled = Math.round(Math.max(0, Math.min(1, pct)) * 20);
	return `[${"#".repeat(filled)}${"-".repeat(20 - filled)}] ${Math.round(pct * 100)}%`;
}

function amount(value: number) {
	return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

async function processOpenBounty(bounty: Bounty, tracked: Awaited<ReturnType<typeof getTrackedBounties>>[number], pro: boolean) {
	const pct = bounty.budget_amount > 0 ? 1 - bounty.gross_paid_out_amount / bounty.budget_amount : 0;
	const content = `**Budget runway:** ${progressBar(pct)}\n\n` +
		`- Spots remaining: **${bounty.spots_remaining}/${bounty.accepted_submissions_limit}**\n` +
		`- Paid out: **${amount(bounty.gross_paid_out_amount)} / ${amount(bounty.budget_amount)}**`;
	let commentId = tracked.budget_bar_comment_id;
	if (commentId) await updateForumPost(commentId, { content });
	else {
		const created = await createForumReply({
			content, parent_id: bounty.discussion_post_id, experience_id: bounty.discussion_experience_id,
		}) as { id?: string };
		commentId = created.id ?? null;
	}
	const thresholds = pro ? await getCreatorSettings(bounty.account_id) : [20];
	const notified = tracked.thresholds_notified ?? [];
	const hit = thresholds.filter((threshold) => pct * 100 <= threshold && !notified.includes(threshold));
	for (const threshold of hit) {
		await createNotification({ account_id: bounty.account_id, user_ids: [bounty.account_id], content: `Bounty ${bounty.id} has ${Math.round(pct * 100)}% budget remaining.` });
		notified.push(threshold);
	}
	await updateTrackedBounty(bounty.id, { budget_bar_comment_id: commentId, thresholds_notified: notified, last_status: bounty.status });
}

async function processClosedBounty(bounty: Bounty, tracked: Awaited<ReturnType<typeof getTrackedBounties>>[number], pro: boolean) {
	const newlyClosed = tracked.last_status === "open" || tracked.last_status === "scheduled";
	if (newlyClosed) {
		const submissions = await listInFlightSubmissions(bounty.id);
		const userIds = submissions.map((submission) => submission.user_id ?? submission.user?.id).filter((id): id is string => Boolean(id));
		if (userIds.length) await createNotification({ experience_id: bounty.discussion_experience_id, user_ids: userIds, content: `Bounty ${bounty.id} closed. Your in-progress attempt is no longer eligible.` });
		if (pro && !tracked.post_mortem_posted && tracked.auto_post_mortem) {
			const end = bounty.submissions_closed_at ?? bounty.updated_at ?? bounty.created_at;
			await createForumReply({
				parent_id: bounty.discussion_post_id, experience_id: bounty.discussion_experience_id,
				content: `## Bounty recap\n\n- Total paid: **${amount(bounty.gross_paid_out_amount)}**\n- Accepted: **${bounty.accepted_submissions_count}** · Denied: **${bounty.denied_submissions_count ?? 0}**\n- Duration: **${Math.max(0, Math.round((new Date(end).getTime() - new Date(bounty.created_at).getTime()) / 86_400_000))} days**`,
			});
			await updateTrackedBounty(bounty.id, { post_mortem_posted: true });
		}
	}
	await updateTrackedBounty(bounty.id, { last_status: bounty.status });
}

export async function GET(request: Request) {
	const configuredSecret = process.env.CRON_SECRET;
	const authorization = request.headers.get("authorization");
	const cronSecretHeader = request.headers.get("x-cron-secret");
	const validSecret = authorization === `Bearer ${configuredSecret}` || cronSecretHeader === configuredSecret;
	if (configuredSecret && !validSecret) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	let stage = "loading tracked bounties";
	try {
		const tracked = await getTrackedBounties();
		for (const accountId of [...new Set(tracked.map((row) => row.account_id))]) {
			stage = `checking plan for account ${accountId}`;
			const tier = await getPlanTier(accountId);
			const rows = tracked.filter((row) => row.account_id === accountId);
			stage = `loading open bounties for account ${accountId}`;
			const open = await listBountiesSafe(accountId, "open");
			stage = `loading completed bounties for account ${accountId}`;
			const terminal = await listBountiesByStatuses(accountId, ["closed", "completed", "canceled"]);
			for (const bounty of open) {
				const row = rows.find((item) => item.bounty_id === bounty.id);
				if (row) {
					stage = `processing open bounty ${bounty.id}`;
					await processOpenBounty(bounty, row, tier === "pro");
				}
			}
			for (const bounty of terminal) {
				const row = rows.find((item) => item.bounty_id === bounty.id);
				if (row) {
					stage = `processing closed bounty ${bounty.id}`;
					await processClosedBounty(bounty, row, tier === "pro");
				}
			}
		}
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[CRON POLL FAILED]", { stage, error });
		return NextResponse.json({ error: `Polling failed during ${stage}. Check Vercel function logs.` }, { status: 500 });
	}
}
