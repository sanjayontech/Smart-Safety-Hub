import { createFileRoute } from "@tanstack/react-router";
import { CommandCenter } from "@/components/CommandCenter";

export const Route = createFileRoute("/command")({
  head: () => ({ meta: [{ title: "Command Center — Smart Safety Hub" }] }),
  component: CommandCenter,
});
