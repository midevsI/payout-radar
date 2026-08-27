import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { getCreatorSettings, getTrackedBounties } from "@/lib/db";
import { getPlanTier } from "@/lib/plan";
import { listBounties } from "@/lib/bounty-api";
import type { Bounty } from "@/lib/bounty-types";
import { PostMortemToggle, ThresholdForm, TrackBountyForm, UntrackButton } from "./DashboardClient";

function pctRemaining(bounty: Bounty) {
	if (!bounty.budget_amount) return 0;
	return Math.max(0, 1 - bounty.gross_paid_out_amount / bounty.budget_amount);
}

function daysRunning(createdAt: string) {
	return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000));
}

export default async function DashboardPage({ params }: { params: Promise<{ companyId: string }> }) {
	const { companyId } = await params;
	await whopsdk.verifyUserToken(await headers());
	const [tracked, tier, thresholds, open, closed, completed, canceled] = await Promise.all([
		getTrackedBounties(companyId),
		getPlanTier(companyId),
		getCreatorSettings(companyId),
		listBounties(companyId, "open"),
		listBounties(companyId, "closed"),
		listBounties(companyId, "completed"),
		listBounties(companyId, "canceled"),
	]);

	const trackedSet = new Set(tracked.map((row) => row.bounty_id));
	const allBounties = [...open, ...closed, ...completed, ...canceled];
	const bountyById = new Map(allBounties.map((bounty) => [bounty.id, bounty]));
	const trackedBounties = tracked
		.map((row) => ({
			row,
			bounty: bountyById.get(row.bounty_id),
		}))
		.filter((item): item is { row: typeof tracked[number]; bounty: Bounty } => Boolean(item.bounty));
	const trackCandidates = open.filter((bounty) => !trackedSet.has(bounty.id));
	const canTrackMore = tier === "pro" || tracked.length < 1;

	return (
		<main className="p-8 max-w-4xl mx-auto space-y-6">
			<header>
				<p className="text-sm text-gray-600">Payout Radar</p>
				<h1 className="text-3xl font-bold">Bounty runway</h1>
				<p className="text-gray-600">Know when campaign budget is about to run out.</p>
			</header>

			<section className="rounded border p-4 space-y-3">
				<div className="flex items-center justify-between gap-3">
					<h2 className="font-semibold">Tracking</h2>
					<span className="text-sm text-gray-600">
						Plan: {tier.toUpperCase()} · {tracked.length} tracked
					</span>
				</div>
				<TrackBountyForm
					accountId={companyId}
					candidates={trackCandidates.map((bounty) => ({ id: bounty.id, status: bounty.status }))}
					canTrackMore={canTrackMore}
				/>
				{!canTrackMore && (
					<p className="text-sm text-amber-700">
						Free plan limit reached. Untrack the current bounty or upgrade for multi-bounty tracking.
					</p>
				)}
			</section>

			{tier === "pro" && (
				<section className="rounded border p-4">
					<h2 className="font-semibold mb-3">Threshold alerts</h2>
					<ThresholdForm accountId={companyId} initial={thresholds} />
				</section>
			)}

			<section className="space-y-3">
				{trackedBounties.length === 0 && <p className="text-gray-600">No tracked bounties yet.</p>}
				{trackedBounties.map(({ row, bounty }) => {
					const pct = pctRemaining(bounty);
					const days = daysRunning(bounty.created_at);
					return (
						<article className="rounded border p-4 space-y-2" key={bounty.id}>
							<div className="flex justify-between items-center gap-3">
								<h2 className="font-semibold">{bounty.id}</h2>
								<div className="flex items-center gap-2">
									<span className="text-sm text-gray-600">{bounty.status}</span>
									<UntrackButton accountId={companyId} bountyId={bounty.id} />
								</div>
							</div>
							<div className="mt-2 h-3 rounded bg-gray-200">
								<div className="h-3 rounded bg-green-500" style={{ width: `${pct * 100}%` }} />
							</div>
							<p className="text-sm">
								{Math.round(pct * 100)}% budget remaining · {bounty.spots_remaining} spots · {days} days running
							</p>
							{tier === "pro" && (
								<PostMortemToggle accountId={companyId} bountyId={bounty.id} enabled={row.auto_post_mortem} />
							)}
						</article>
					);
				})}
			</section>
		</main>
	);
}
