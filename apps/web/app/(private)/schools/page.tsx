export const dynamic = "force-dynamic";

import SchoolSummarySection from "@/components/schools/SchoolSummarySection";

export default function SchoolsDashboardPage() {
	return (
		<div className="space-y-5 sm:space-y-6">
			<SchoolSummarySection />
		</div>
	);
}
