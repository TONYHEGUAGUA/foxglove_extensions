import { PanelExtensionContext } from "@foxglove/extension";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

type Waypoint = { x: number; y: number; z: number };

function PathPlannerPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [frameId, setFrameId] = useState<string>("map");
  const [pathTopic, setPathTopic] = useState<string>("/planned_path");
  const [markerTopic, setMarkerTopic] = useState<string>("/planned_path_markers");
  const [renderDone, setRenderDone] = useState<(() => void) | undefined>();

  // Basic render driver
  useLayoutEffect(() => {
    context.onRender = (_renderState, done) => {
      setRenderDone(() => done);
    };
    context.watch("topics");
    context.watch("currentFrame");
  }, [context]);

  useEffect(() => {
    renderDone?.();
  }, [renderDone]);

  // Simple mouse-to-plane mapping on a 2D canvas (XY in meters)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const state = {
      scale: 10, // pixels per meter
      originX: canvas.width / 2,
      originY: canvas.height / 2,
    };
    const toWorld = (cx: number, cy: number) => {
      const x = (cx - state.originX) / state.scale;
      const y = -(cy - state.originY) / state.scale;
      return { x, y, z: 0 };
    };
    const onClick = (ev: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = ev.clientX - rect.left;
      const cy = ev.clientY - rect.top;
      const p = toWorld(cx, cy);
      setWaypoints((prev) => [...prev, p]);
    };
    canvas.addEventListener("click", onClick);
    return () => {
      canvas.removeEventListener("click", onClick);
    };
  }, []);

  // Draw waypoints and lines
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const scale = 10;
    const originX = canvas.width / 2;
    const originY = canvas.height / 2;
    const toCanvas = (p: Waypoint) => ({
      x: originX + p.x * scale,
      y: originY - p.y * scale,
    });
    // clear
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // grid
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += scale) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += scale) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(canvas.width, j);
      ctx.stroke();
    }
    // axis
    ctx.strokeStyle = "#444";
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(canvas.width, originY);
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, canvas.height);
    ctx.stroke();
    // line strip
    if (waypoints.length > 1) {
      ctx.strokeStyle = "#0af";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const p0 = toCanvas(waypoints[0]!);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < waypoints.length; i++) {
        const pi = toCanvas(waypoints[i]!);
        ctx.lineTo(pi.x, pi.y);
      }
      ctx.stroke();
    }
    // points
    ctx.fillStyle = "#fff";
    for (const p of waypoints) {
      const c = toCanvas(p);
      ctx.beginPath();
      ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [waypoints]);

  function nowStamp() {
    const nowMs = Date.now();
    const sec = Math.floor(nowMs / 1000);
    const nsec = Math.floor((nowMs % 1000) * 1e6);
    return { sec, nsec };
  }

  function publishPath() {
    const stamp = nowStamp();
    const pathMsg = {
      header: { stamp, frame_id: frameId },
      poses: waypoints.map((p) => ({
        header: { stamp, frame_id: frameId },
        pose: { position: { x: p.x, y: p.y, z: p.z }, orientation: { x: 0, y: 0, z: 0, w: 1 } },
      })),
    };
    (context as any).publish?.({
      topic: pathTopic,
      schemaName: "nav_msgs/Path",
      value: pathMsg,
    });

    const markerMsg = {
      markers: [
        {
          ns: "path",
          id: 1,
          type: 4, // LINE_STRIP
          action: 0,
          header: { stamp, frame_id: frameId },
          scale: { x: 0.03, y: 0.0, z: 0.0 },
          color: { r: 0.0, g: 0.7, b: 1.0, a: 1.0 },
          points: waypoints.map((p) => ({ x: p.x, y: p.y, z: p.z })),
          lifetime: { sec: 0, nsec: 0 },
        },
        ...waypoints.map((p, idx) => ({
          ns: "path_points",
          id: 1000 + idx,
          type: 2, // SPHERE
          action: 0,
          header: { stamp, frame_id: frameId },
          scale: { x: 0.1, y: 0.1, z: 0.1 },
          color: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
          pose: { position: { x: p.x, y: p.y, z: p.z }, orientation: { x: 0, y: 0, z: 0, w: 1 } },
          lifetime: { sec: 0, nsec: 0 },
        })),
      ],
    };
    (context as any).publish?.({
      topic: markerTopic,
      schemaName: "visualization_msgs/MarkerArray",
      value: markerMsg,
    });
  }

  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: 8, height: "100%", padding: "1rem" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label>frame_id</label>
        <input value={frameId} onChange={(e) => setFrameId(e.target.value)} style={{ width: 120 }} />
        <label>Path topic</label>
        <input value={pathTopic} onChange={(e) => setPathTopic(e.target.value)} style={{ width: 160 }} />
        <label>Marker topic</label>
        <input value={markerTopic} onChange={(e) => setMarkerTopic(e.target.value)} style={{ width: 180 }} />
        <button onClick={() => setWaypoints([])}>清空</button>
        <button onClick={() => waypoints.length > 0 && publishPath()}>发布轨迹</button>
        <div>点数: {waypoints.length}</div>
      </div>
      <canvas ref={canvasRef} width={640} height={480} style={{ width: "100%", height: "100%", background: "#111" }} />
    </div>
  );
}

export function initPathPlannerPanel(context: PanelExtensionContext): () => void {
  const root = createRoot(context.panelElement);
  root.render(<PathPlannerPanel context={context} />);
  return () => root.unmount();
}

