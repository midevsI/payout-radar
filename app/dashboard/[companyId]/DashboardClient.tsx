"use client";

import { useState } from "react";

export function ThresholdForm({ accountId, initial }: { accountId: string; initial: number[] }) {
	const [value, setValue] = useState(initial.join(","));
	const [saved, setSaved] = useState(false);
	return <form className="flex gap-2 items-center" onSubmit={async (event) => {
		event.preventDefault();
		await fetch("/api/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accountId, thresholds: value.split(",").map(Number) }) });
		setSaved(true);
	}}>
		<label htmlFor="thresholds">Alert at (%)</label>
		<input id="thresholds" className="border rounded px-2 py-1 w-32" value={value} onChange={(event) => setValue(event.target.value)} />
		<button className="rounded bg-black text-white px-3 py-1" type="submit">Save</button>
		{saved && <span className="text-sm text-green-700">Saved</span>}
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
