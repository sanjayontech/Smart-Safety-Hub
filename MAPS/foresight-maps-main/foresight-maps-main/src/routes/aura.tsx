import { createFileRoute } from "@tanstack/react-router";
import { AuraCopilot } from "@/components/AuraCopilot";

export const Route = createFileRoute("/aura")({
  head: () => ({ meta: [{ title: "AURA AI Copilot — Smart Safety Hub" }] }),
  component: AuraCopilot,
});
