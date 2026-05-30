import { createFileRoute } from "@tanstack/react-router";
import { GlobalMap } from "@/components/GlobalMap";

export const Route = createFileRoute("/map")({
  head: () => ({ meta: [{ title: "Smart Map — Smart Safety Hub" }] }),
  component: GlobalMap,
});
