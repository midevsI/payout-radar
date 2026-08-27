import { whopsdk } from "@/lib/whop-sdk";
import type { Bounty, BountySubmission } from "@/lib/bounty-types";

type ListResponse<T> = { data?: T[] } | T[];

function list<T>(response: ListResponse<T>): T[] {
	return Array.isArray(response) ? response : response.data ?? [];
}

export async function listBounties(accountId: string, status: string) {
	const response = await whopsdk.get<ListResponse<Bounty>>("/bounties", {
		query: { account_id: accountId, status },
	});
	return list(response);
}

function isInvalidStatusError(error: unknown) {
	if (!error || typeof error !== "object") return false;
	const candidate = error as { status?: number; message?: string; error?: { param?: string; message?: string } };
	if (candidate.error?.param === "status") return true;
	if (candidate.status !== 400) return false;
	const message = `${candidate.message ?? ""} ${candidate.error?.message ?? ""}`;
	return message.includes("parameter 'status'") || message.includes('parameter "status"');
}

export async function listBountiesSafe(accountId: string, status: string) {
	const candidates = status === "canceled" ? ["canceled", "cancelled"] : [status];
	for (const candidate of candidates) {
		try {
			return await listBounties(accountId, candidate);
		} catch (error) {
			if (isInvalidStatusError(error)) continue;
			throw error;
		}
	}
	return [];
}

export async function listBountiesByStatuses(accountId: string, statuses: string[]) {
	const lists = await Promise.all(statuses.map((status) => listBountiesSafe(accountId, status)));
	const deduped = new Map<string, Bounty>();
	for (const bounty of lists.flat()) deduped.set(bounty.id, bounty);
	return [...deduped.values()];
}

export async function listInFlightSubmissions(bountyId: string) {
	const response = await whopsdk.get<ListResponse<BountySubmission>>("/bounty_submissions", {
		query: { bounty_id: bountyId, status: "in_progress" },
	});
	return list(response);
}

export async function createNotification(body: Record<string, unknown>) {
	return whopsdk.post("/notifications", { body });
}

export async function createForumReply(body: Record<string, unknown>) {
	return whopsdk.post("/forum_posts", { body });
}

export async function updateForumPost(id: string, body: Record<string, unknown>) {
	return whopsdk.patch(`/forum_posts/${id}`, { body });
}
