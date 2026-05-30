import { createFileRoute } from "@tanstack/react-router";
import { RiskPrediction } from "@/components/RiskPrediction";

export const Route = createFileRoute("/risk")({
  head: () => ({ meta: [{ title: "Risk Engine — Smart Safety Hub" }] }),
  component: RiskPrediction,
});
