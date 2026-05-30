import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Landing } from "./components/Landing";
import { CommandCenter } from "./components/CommandCenter";
import { DetectionEngine } from "./components/DetectionEngine";
import { GlobalMap } from "./components/GlobalMap";
import { RiskPrediction } from "./components/RiskPrediction";
import { AuraCopilot } from "./components/AuraCopilot";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      { index: true, element: <Landing /> },
      { path: "command", element: <CommandCenter /> },
      { path: "detection", element: <DetectionEngine /> },
      { path: "map", element: <GlobalMap /> },
      { path: "risk", element: <RiskPrediction /> },
      { path: "aura", element: <AuraCopilot /> },
    ],
  },
]);
