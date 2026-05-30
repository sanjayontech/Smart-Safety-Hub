import { createFileRoute } from "@tanstack/react-router";
import { DetectionEngine } from "@/components/DetectionEngine";

export const Route = createFileRoute("/detection")({
  head: () => ({ meta: [{ title: "Live Detection — Smart Safety Hub" }] }),
  component: DetectionEngine,
});
