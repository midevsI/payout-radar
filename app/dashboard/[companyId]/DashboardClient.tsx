"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ThresholdForm({ accountId, initial }: { accountId: string; initial: number[] }) {
	const [value, setValue] = useState(initial.join(","));
	const [saved, setSaved] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	return <form className="flex gap-2 items-center" onSubmit={async (event) => {
		event.preventDefault();
		setSaved(null);
		setError(null);
		const values = value
			.split(",")
			.map((item) => Number(item.trim()))
			.filter((item) => Number.isInteger(item) && item > 0 && item <= 100);
		if (values.length === 0) {
			setError("Use one or more values from 1-100, comma-separated.");
			return;
		}
		const uniqueSorted = [...new Set(values)].sort((a, b) => a - b);
		const response = await fetch("/api/settings", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ accountId, thresholds: uniqueSorted }),
		});
		if (!response.ok) {
			setError("Could not save thresholds.");
			return;
		}
		setSaved("Saved");
		setValue(uniqueSorted.join(","));
	}}>
		<label htmlFor="thresholds">Alert at (%)</label>
		<input id="thresholds" className="border rounded px-2 py-1 w-32" value={value} onChange={(event) => setValue(event.target.value)} />
		<button className="rounded bg-black text-white px-3 py-1" type="submit">Save</button>
		{saved && <span className="text-sm text-green-700">{saved}</span>}
		{error && <span className="text-sm text-red-700">{error}</span>}
	</form>;
}

export function PostMortemToggle({ accountId, bountyId, enabled }: { accountId: string; bountyId: string; enabled: boolean }) {
	const [checked, setChecked] = useState(enabled);
	return <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={checked} onChange={async (event) => {
		const next = event.target.checked;
		setChecked(next);
		await fetch("/api/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accountId, bountyId, autoPostMortem: next }) });
	}} /> Auto post-mortem</label>;
}

export function TrackBountyForm({
	accountId,
	candidates,
	canTrackMore,
}: {
	accountId: string;
	candidates: Array<{ id: string; status: string }>;
	canTrackMore: boolean;
}) {
	const router = useRouter();
	const [selectedBounty, setSelectedBounty] = useState(candidates[0]?.id ?? "");
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	return (
		<form
			className="flex flex-wrap items-center gap-2"
			onSubmit={async (event) => {
				event.preventDefault();
				setMessage(null);
				setError(null);
				if (!selectedBounty) {
					setError("Select a bounty first.");
					return;
				}
				const response = await fetch("/api/bounties/track", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ accountId, bountyId: selectedBounty }),
				});
				if (!response.ok) {
					const body = await response.json().catch(() => ({}));
					setError(body.error ?? "Could not track bounty.");
					return;
				}
				setMessage("Tracking enabled.");
				router.refresh();
			}}
		>
			<select
				className="border rounded px-2 py-1 min-w-64"
				value={selectedBounty}
				onChange={(event) => setSelectedBounty(event.target.value)}
				disabled={!canTrackMore || candidates.length === 0}
			>
				{candidates.length === 0 && <option value="">No open bounties available</option>}
				{candidates.map((bounty) => (
					<option key={bounty.id} value={bounty.id}>
						{bounty.id} ({bounty.status})
					</option>
				))}
			</select>
			<button
				className="rounded bg-black text-white px-3 py-1 disabled:opacity-60"
				type="submit"
				disabled={!canTrackMore || candidates.length === 0}
			>
				Track bounty
			</button>
			{message && <span className="text-sm text-green-700">{message}</span>}
			{error && <span className="text-sm text-red-700">{error}</span>}
		</form>
	);
}

export function UntrackButton({
	accountId,
	bountyId,
}: {
	accountId: string;
	bountyId: string;
}) {
	const router = useRouter();
	const [pending, setPending] = useState(false);

	return (
		<button
			type="button"
			className="rounded border px-2 py-1 text-sm disabled:opacity-60"
			disabled={pending}
			onClick={async () => {
				setPending(true);
				const response = await fetch("/api/bounties/track", {
					method: "DELETE",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ accountId, bountyId }),
				});
				setPending(false);
				if (response.ok) router.refresh();
			}}
		>
			{pending ? "Removing..." : "Untrack"}
		</button>
	);
}
