// Smart Safety Hub — Cloudflare Worker API
// Replaces Flask server.py for cloud deployment.
// State is stored in Cloudflare KV (free tier: 100K reads + 1K writes/day).

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const DEFAULT_STATE = JSON.stringify({
  speed: 0,
  speed_limit: 50,
  alerts: [],
  detected_objects: [],
  timestamp: null,
  message: "Detection not running. Start local detector and set API_URL.",
});

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    // Health check
    if (pathname === "/" || pathname === "/health") {
      return new Response("Smart Safety Hub API — Running on Cloudflare", {
        headers: CORS,
      });
    }

    // GET /status — returns latest detection state
    if (pathname === "/status") {
      const data = (await env.STATE.get("detection")) ?? DEFAULT_STATE;
      return new Response(data, {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // POST /update-state — called by local YOLO detector every frame
    if (pathname === "/update-state" && request.method === "POST") {
      const body = await request.text();
      // State expires after 5 min of no updates (detector stopped)
      await env.STATE.put("detection", body, { expirationTtl: 300 });
      return new Response('{"ok":true}', {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // GET /accident-data
    if (pathname === "/accident-data") {
      return new Response(
        JSON.stringify({ image_name: "crash_image.jpg", latitude: 13.0827, longitude: 80.2707 }),
        { headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    return new Response("Not Found", { status: 404, headers: CORS });
  },
};
