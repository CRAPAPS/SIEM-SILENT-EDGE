import express, { Request, Response, NextFunction } from "express";
import Dockerode from "dockerode";

const app = express();
app.use(express.json({ limit: "2mb" }));

const docker = new Dockerode({ socketPath: "/var/run/docker.sock" });
const ALLOWED = (process.env.LAB_ALLOWED_CONTAINERS ?? "osint-unit,redteam-unit")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const SECRET = process.env.LAB_GATEWAY_SECRET ?? "";
const OUTPUT_ROOT = process.env.LAB_OUTPUT_ROOT ?? "/opt/silent-edge/lab";

// ── Auth middleware ───────────────────────────────────────────

function auth(req: Request, res: Response, next: NextFunction): void {
  if (!SECRET) {
    res.status(500).json({ error: "Gateway secret not configured" });
    return;
  }
  const header = req.headers["authorization"] ?? "";
  if (header !== `Bearer ${SECRET}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

function assertAllowed(unitId: string, res: Response): boolean {
  if (!ALLOWED.includes(unitId)) {
    res.status(403).json({ error: `Unit '${unitId}' is not in the allowed list` });
    return false;
  }
  return true;
}

function blockDangerousScript(script: string, res: Response): boolean {
  const forbidden = ["/proc/1", "/etc/shadow", "/etc/passwd", "docker.sock", ".."];
  for (const token of forbidden) {
    if (script.includes(token)) {
      res.status(400).json({ error: `Blocked: script references '${token}'` });
      return true;
    }
  }
  return false;
}

// ── Routes ───────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ ok: true, allowedUnits: ALLOWED });
});

app.get("/status", auth, async (_req, res) => {
  try {
    const results = await Promise.all(
      ALLOWED.map(async (id) => {
        try {
          const info = await docker.getContainer(id).inspect();
          return {
            id,
            status: info.State.Paused
              ? "paused"
              : info.State.Running
                ? "running"
                : "stopped",
            startedAt: info.State.StartedAt,
          };
        } catch {
          return { id, status: "not_found" };
        }
      })
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/units/:unitId/wake", auth, async (req, res) => {
  const { unitId } = req.params;
  if (!assertAllowed(unitId, res)) return;
  try {
    const container = docker.getContainer(unitId);
    const info = await container.inspect().catch(() => null);
    if (!info) {
      res.status(404).json({ error: "Container not found" });
      return;
    }
    if (info.State.Paused) {
      await container.unpause();
    } else if (!info.State.Running) {
      await container.start();
    }
    res.json({ ok: true, status: "running" });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/units/:unitId/suspend", auth, async (req, res) => {
  const { unitId } = req.params;
  if (!assertAllowed(unitId, res)) return;
  try {
    await docker.getContainer(unitId).pause();
    res.json({ ok: true, status: "paused" });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/units/:unitId/execute", auth, async (req, res) => {
  const { unitId } = req.params;
  if (!assertAllowed(unitId, res)) return;

  const { script } = req.body as { script?: string };
  if (!script || typeof script !== "string") {
    res.status(400).json({ error: "Missing 'script' in request body" });
    return;
  }
  if (blockDangerousScript(script, res)) return;

  try {
    const container = docker.getContainer(unitId);
    const exec = await container.exec({
      Cmd: ["/bin/bash", "-c", script],
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start({ hijack: true, stdin: false });

    let stdout = "";
    let stderr = "";

    await new Promise<void>((resolve, reject) => {
      container.modem.demuxStream(
        stream,
        { write: (chunk: Buffer) => { stdout += chunk.toString(); } },
        { write: (chunk: Buffer) => { stderr += chunk.toString(); } }
      );
      stream.on("end", resolve);
      stream.on("error", reject);
      setTimeout(() => resolve(), 110_000); // 110s hard cap
    });

    const inspected = await exec.inspect().catch(() => ({ ExitCode: -1 }));
    res.json({
      exitCode: inspected.ExitCode ?? 0,
      stdout: stdout.slice(0, 50_000),
      stderr: stderr.slice(0, 10_000),
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(9100, "0.0.0.0", () => {
  console.log(`[lab-gateway] listening on :9100  allowed=${ALLOWED.join(",")}`);
});
