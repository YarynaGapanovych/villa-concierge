import { ProposalViewFrame } from "@/components/proposal-view";

export default function ConciergeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProposalViewFrame>
      <div className="flex min-h-full flex-col bg-stone-50">{children}</div>
    </ProposalViewFrame>
  );
}
