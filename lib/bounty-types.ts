export type BountyStatus = "scheduled" | "open" | "closed" | "completed" | "canceled" | "cancelled";

export type Bounty = {
	id: string;
	account_id: string;
	status: BountyStatus;
	budget_amount: number;
	gross_paid_out_amount: number;
	spots_remaining: number;
	accepted_submissions_limit: number;
	accepted_submissions_count: number;
	denied_submissions_count?: number;
	discussion_experience_id: string;
	discussion_post_id: string;
	created_at: string;
	submissions_closed_at?: string | null;
	updated_at?: string | null;
};

export type BountySubmission = { user_id?: string; user?: { id: string } };
