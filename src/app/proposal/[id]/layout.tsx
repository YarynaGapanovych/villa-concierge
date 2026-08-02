import { ProposalViewFrame } from "@/components/proposal-view";

export default function ProposalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProposalViewFrame>{children}</ProposalViewFrame>;
}
