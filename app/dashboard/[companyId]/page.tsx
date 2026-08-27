import { headers } from "next/headers";
import Link from "next/link";
import { RunwayDashboard } from "@/app/_components/RunwayDashboard";
import { getRunwayData } from "@/lib/runway-data";
import { whopsdk } from "@/lib/whop-sdk";

export default async function DashboardPage({ params }: { params: Promise<{ companyId: string }> }) {
	try {
		const { companyId } = await params;
		await whopsdk.verifyUserToken(await headers());
		const data = await getRunwayData(companyId);
		return <RunwayDashboard accountId={companyId} data={data} scopeLabel="Company dashboard" />;
	} catch {
		return (
			<main className="p-8 max-w-3xl mx-auto">
				<div className="rounded-2xl border border-red-200 bg-red-50 p-6 space-y-3">
					<h1 className="text-xl font-semibold text-red-900">Unable to load Payout Radar</h1>
					<p className="text-red-800">Please verify Whop and Supabase environment variables, then try again.</p>
					<Link href="https://vercel.com" target="_blank" className="underline text-red-900">
						View deployment logs
					</Link>
				</div>
			</main>
		);
	}
}
