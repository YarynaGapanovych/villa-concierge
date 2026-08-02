import { Cormorant_Garamond, DM_Sans } from "next/font/google";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-proposal-display",
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-proposal-body",
});

export default function ProposalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${displayFont.variable} ${bodyFont.variable} min-h-full font-[family-name:var(--font-proposal-body)] text-stone-800 antialiased`}
    >
      {children}
    </div>
  );
}
