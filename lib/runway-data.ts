import { listBountiesByStatuses, listBountiesSafe } from "@/lib/bounty-api";
import type { Bounty } from "@/lib/bounty-types";
import { getCreatorSettings, getTrackedBounties } from "@/lib/db";
import { getPlanTier, type PlanTier } from "@/lib/plan";

export function pctRemaining(bounty: Bounty) {
	if (!bounty.budget_amount) return 0;
	return Math.max(0, 1 - bounty.gross_paid_out_amount / bounty.budget_amount);
}

export function daysRunning(createdAt: string) {
	return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000));
}

export type RunwayData = {
	tier: PlanTier;
	thresholds: number[];
	trackedCount: number;
	canTrackMore: boolean;
	trackedBounties: Array<{
		row: Awaited<ReturnType<typeof getTrackedBounties>>[number];
		bounty: Bounty;
	}>;
	trackCandidates: Array<{ id: string; status: string }>;
};

export async function getRunwayData(companyId: string): Promise<RunwayData> {
	const [tracked, tier, thresholds, open, terminal] = await Promise.all([
		getTrackedBounties(companyId),
		getPlanTier(companyId),
		getCreatorSettings(companyId),
		listBountiesSafe(companyId, "open"),
		listBountiesByStatuses(companyId, ["closed", "completed", "canceled", "scheduled"]),
	]);

	const trackedSet = new Set(tracked.map((row) => row.bounty_id));
	const allBounties = [...open, ...terminal];
	const bountyById = new Map(allBounties.map((bounty) => [bounty.id, bounty]));
	const trackedBounties = tracked
		.map((row) => ({
			row,
			bounty: bountyById.get(row.bounty_id),
		}))
		.filter((item): item is { row: typeof tracked[number]; bounty: Bounty } => Boolean(item.bounty));
	const trackCandidates = open
		.filter((bounty) => !trackedSet.has(bounty.id))
		.map((bounty) => ({ id: bounty.id, status: bounty.status }));

	return {
		tier,
		thresholds,
		trackedCount: tracked.length,
		canTrackMore: tier === "pro" || tracked.length < 1,
		trackedBounties,
		trackCandidates,
	};
}
