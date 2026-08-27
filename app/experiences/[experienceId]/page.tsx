import { headers } from "next/headers";
import Link from "next/link";
import { RunwayDashboard } from "@/app/_components/RunwayDashboard";
import { getRunwayData } from "@/lib/runway-data";
import { whopsdk } from "@/lib/whop-sdk";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	try {
		const { experienceId } = await params;
		await whopsdk.verifyUserToken(await headers());
		const experience = await whopsdk.experiences.retrieve(experienceId);
		const companyId = experience.company.id;
		const data = await getRunwayData(companyId);
		return <RunwayDashboard accountId={companyId} data={data} scopeLabel={`Experience ${experienceId}`} />;
	} catch {
		return (
			<main className="p-8 max-w-3xl mx-auto">
				<div className="rounded-2xl border border-red-200 bg-red-50 p-6 space-y-3">
					<h1 className="text-xl font-semibold text-red-900">Unable to load this Whop app view</h1>
					<p className="text-red-800">Verify app permissions and environment variables in Vercel, then reload.</p>
					<Link href="https://vercel.com" target="_blank" className="underline text-red-900">
						View deployment logs
					</Link>
				</div>
			</main>
		);
	}
}
