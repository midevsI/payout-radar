import type { RunwayData } from "@/lib/runway-data";
import { daysRunning, pctRemaining } from "@/lib/runway-data";
import { PostMortemToggle, ThresholdForm, TrackBountyForm, UntrackButton } from "./RunwayControls";

export function RunwayDashboard({
	accountId,
	data,
	scopeLabel,
}: {
	accountId: string;
	data: RunwayData;
	scopeLabel: string;
}) {
	return (
		<main className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
			<header className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6">
				<p className="text-sm text-gray-600">{scopeLabel}</p>
				<h1 className="text-3xl font-bold tracking-tight mt-1">Payout Radar</h1>
				<p className="text-gray-600 mt-2">Track bounty runway, warn contributors early, and prevent budget surprises.</p>
			</header>

			<section className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3 shadow-sm">
				<div className="flex items-center justify-between gap-3">
					<h2 className="font-semibold text-lg">Tracking</h2>
					<span className="text-sm text-gray-600">Plan: {data.tier.toUpperCase()} · {data.trackedCount} tracked</span>
				</div>
				<TrackBountyForm accountId={accountId} candidates={data.trackCandidates} canTrackMore={data.canTrackMore} />
				{!data.canTrackMore && (
					<p className="text-sm text-amber-700">Free plan limit reached. Untrack the current bounty or upgrade for multi-bounty tracking.</p>
				)}
			</section>

			{data.tier === "pro" && (
				<section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
					<h2 className="font-semibold text-lg mb-3">Threshold alerts</h2>
					<ThresholdForm accountId={accountId} initial={data.thresholds} />
				</section>
			)}

			<section className="space-y-3">
				{data.trackedBounties.length === 0 && (
					<div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-gray-600">
						No tracked bounties yet. Start by tracking an open bounty above.
					</div>
				)}
				{data.trackedBounties.map(({ row, bounty }) => {
					const pct = pctRemaining(bounty);
					const days = daysRunning(bounty.created_at);
					return (
						<article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3" key={bounty.id}>
							<div className="flex justify-between items-center gap-3">
								<div>
									<p className="text-xs text-gray-500 uppercase tracking-wide">Bounty</p>
									<h3 className="font-semibold">{bounty.id}</h3>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{bounty.status}</span>
									<UntrackButton accountId={accountId} bountyId={bounty.id} />
								</div>
							</div>
							<div className="h-3 rounded-full bg-gray-200 overflow-hidden">
								<div className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-400" style={{ width: `${pct * 100}%` }} />
							</div>
							<p className="text-sm text-gray-700">
								{Math.round(pct * 100)}% budget remaining · {bounty.spots_remaining} spots · {days} days running
							</p>
							{data.tier === "pro" && (
								<PostMortemToggle accountId={accountId} bountyId={bounty.id} enabled={row.auto_post_mortem} />
							)}
						</article>
					);
				})}
			</section>
		</main>
	);
}
