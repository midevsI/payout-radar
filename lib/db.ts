import { createClient } from "@supabase/supabase-js";

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

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
	{ auth: { persistSession: false, autoRefreshToken: false } },
);

export async function getTrackedBounties(accountId?: string) {
	let query = supabase.from("tracked_bounty").select("*").order("account_id").order("bounty_id");
	if (accountId) query = query.eq("account_id", accountId);
	const { data, error } = await query;
	if (error) throw error;
	return data as TrackedBounty[];
}

export async function upsertTrackedBounty(accountId: string, bountyId: string, planTier: "free" | "pro") {
	const { error } = await supabase.from("tracked_bounty").upsert({
		bounty_id: bountyId, account_id: accountId, last_status: "open",
		thresholds_notified: [], plan_tier: planTier,
	}, { onConflict: "bounty_id", ignoreDuplicates: false });
	if (error) throw error;
}

export async function updateTrackedBounty(
	bountyId: string,
	values: Partial<Pick<TrackedBounty, "last_status" | "thresholds_notified" | "budget_bar_comment_id" | "post_mortem_posted">>,
) {
	const { error } = await supabase.from("tracked_bounty").update(values).eq("bounty_id", bountyId);
	if (error) throw error;
}

export async function getCreatorSettings(accountId: string) {
	const { data, error } = await supabase.from("creator_settings").select("threshold_pcts").eq("account_id", accountId).maybeSingle();
	if (error) throw error;
	return data?.threshold_pcts ?? [20];
}

export async function saveCreatorSettings(accountId: string, thresholdPcts: number[]) {
	const { error } = await supabase.from("creator_settings").upsert({ account_id: accountId, threshold_pcts: thresholdPcts });
	if (error) throw error;
}

export async function setAutoPostMortem(bountyId: string, enabled: boolean) {
	const { error } = await supabase.from("tracked_bounty").update({ auto_post_mortem: enabled }).eq("bounty_id", bountyId);
	if (error) throw error;
}
