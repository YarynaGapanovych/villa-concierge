"use client";

import { useState } from "react";

import {
  ProposalView,
  ProposalViewFrame,
  type ProposalViewData,
} from "@/components/proposal-view";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ProposalPreviewDialogProps = {
  proposalId: string;
  memberFirstName: string;
  buildPreviewData: (data: ProposalViewData) => ProposalViewData;
  disabled?: boolean;
};

export function ProposalPreviewDialog({
  proposalId,
  memberFirstName,
  buildPreviewData,
  disabled = false,
}: ProposalPreviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [previewData, setPreviewData] = useState<ProposalViewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setPreviewData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/proposals/${proposalId}`);

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to load preview");
      }

      const data = (await response.json()) as ProposalViewData;
      setPreviewData(buildPreviewData(data));
    } catch (previewLoadError) {
      setError(
        previewLoadError instanceof Error
          ? previewLoadError.message
          : "Failed to load preview",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => void handleOpenChange(nextOpen)}>
      <DialogTrigger render={<Button variant="outline" size="sm" disabled={disabled} />}>
        Preview
      </DialogTrigger>
      <DialogContent className="grid h-[95vh] max-h-[95vh] w-full max-w-[95vw] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>Member preview</DialogTitle>
          <DialogDescription>
            This is what {memberFirstName} will see at their proposal link.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto overscroll-contain">
          {loading ? (
            <p className="px-6 py-12 text-lg text-muted-foreground">
              Loading preview…
            </p>
          ) : error ? (
            <p className="px-6 py-12 text-lg text-destructive" role="alert">
              {error}
            </p>
          ) : previewData ? (
            <ProposalViewFrame>
              <ProposalView proposal={previewData} />
            </ProposalViewFrame>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
