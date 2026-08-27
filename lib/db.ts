export type TrackedBounty = {
	bounty_id: string;
	account_id: string;
	last_status: string;
	thresholds_notified: number[];
	budget_bar_comment_id: string | null;
	post_mortem_posted: boolean;
	auto_post_mortem: boolean;
	plan_tier: "free" | "pro";
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function supabaseRequest<T>(table: string, init: RequestInit = {}, query = "") {
	if (!supabaseUrl || !supabaseUrl.startsWith("https://") || !serviceRoleKey) {
		throw new Error("Supabase environment variables are missing or invalid");
	}
	const response = await fetch(`${supabaseUrl}/rest/v1/${table}${query}`, {
		...init,
		headers: {
			apikey: serviceRoleKey,
			authorization: `Bearer ${serviceRoleKey}`,
			"content-type": "application/json",
			...(init.headers ?? {}),
		},
		cache: "no-store",
	});
	if (!response.ok) throw new Error(`Supabase request failed (${response.status}): ${await response.text()}`);
	return response.status === 204 ? null : await response.json() as T;
}

export async function getTrackedBounties(accountId?: string) {
	const filter = accountId ? `&account_id=eq.${encodeURIComponent(accountId)}` : "";
	return (await supabaseRequest<TrackedBounty[]>("tracked_bounty", {}, `?select=*&order=account_id,bounty_id${filter}`)) ?? [];
}

export async function upsertTrackedBounty(accountId: string, bountyId: string, planTier: "free" | "pro") {
	await supabaseRequest("tracked_bounty", {
		method: "POST",
		headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
		body: JSON.stringify({
		bounty_id: bountyId, account_id: accountId, last_status: "open",
		thresholds_notified: [], plan_tier: planTier,
		}),
	}, "?on_conflict=bounty_id");
}

export async function deleteTrackedBounty(accountId: string, bountyId: string) {
	await supabaseRequest(
		"tracked_bounty",
		{ method: "DELETE", headers: { Prefer: "return=minimal" } },
		`?account_id=eq.${encodeURIComponent(accountId)}&bounty_id=eq.${encodeURIComponent(bountyId)}`,
	);
}

export async function updateTrackedBounty(
	bountyId: string,
	values: Partial<Pick<TrackedBounty, "last_status" | "thresholds_notified" | "budget_bar_comment_id" | "post_mortem_posted">>,
) {
	await supabaseRequest("tracked_bounty", { method: "PATCH", body: JSON.stringify(values) }, `?bounty_id=eq.${encodeURIComponent(bountyId)}`);
}

export async function getCreatorSettings(accountId: string) {
	const data = await supabaseRequest<{ threshold_pcts: number[] }[]>("creator_settings", {}, `?select=threshold_pcts&account_id=eq.${encodeURIComponent(accountId)}&limit=1`);
	return data?.[0]?.threshold_pcts ?? [20];
}

export async function saveCreatorSettings(accountId: string, thresholdPcts: number[]) {
	await supabaseRequest("creator_settings", {
		method: "POST",
		headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
		body: JSON.stringify({ account_id: accountId, threshold_pcts: thresholdPcts }),
	}, "?on_conflict=account_id");
}

export async function setAutoPostMortem(bountyId: string, enabled: boolean) {
	await supabaseRequest("tracked_bounty", { method: "PATCH", body: JSON.stringify({ auto_post_mortem: enabled }) }, `?bounty_id=eq.${encodeURIComponent(bountyId)}`);
}
