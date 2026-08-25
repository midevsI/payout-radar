import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { saveCreatorSettings, setAutoPostMortem } from "@/lib/db";
import { whopsdk } from "@/lib/whop-sdk";

export async function POST(request: Request) {
	const { userId } = await whopsdk.verifyUserToken(await headers());
	const body = await request.json() as { accountId?: string; thresholds?: number[]; bountyId?: string; autoPostMortem?: boolean };
	if (!body.accountId || !userId) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
	if (body.thresholds) {
		const thresholds = body.thresholds.filter((value) => Number.isInteger(value) && value > 0 && value <= 100);
		await saveCreatorSettings(body.accountId, thresholds);
	}
	if (body.bountyId && typeof body.autoPostMortem === "boolean") await setAutoPostMortem(body.bountyId, body.autoPostMortem);
	return NextResponse.json({ ok: true });
}
