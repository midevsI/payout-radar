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
