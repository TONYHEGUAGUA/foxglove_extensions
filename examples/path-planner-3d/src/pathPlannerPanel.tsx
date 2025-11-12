import { PanelExtensionContext } from "@foxglove/extension";
import { useEffect, useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";

type Waypoint = { x: number; y: number; z: number };

type PanelState = {
  frameId?: string;
  pathTopic?: string;
  markerTopic?: string;
};

function PathPlannerPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [renderDone, setRenderDone] = useState<(() => void) | undefined>();

  const [state, setState] = useState<PanelState>(() => {
    return (context.initialState as PanelState) ?? {
      frameId: "map",
      pathTopic: "/planned_path",
      markerTopic: "/planned_path_markers",
    };
  });

  useEffect(() => {
    context.saveState(state);
  }, [context, state]);

  useLayoutEffect(() => {
    context.onRender = (_, done) => {
      setRenderDone(() => done);
    };
  }, [context]);

  useEffect(() => {
    renderDone?.();
  }, [renderDone]);

  function nowStamp() {
    const nowMs = Date.now();
    const sec = Math.floor(nowMs / 1000);
    const nsec = Math.floor((nowMs % 1000) * 1e6);
    return { sec, nsec };
  }

  function publishPath() {
    if (waypoints.length === 0) {
      return;
    }

    const stamp = nowStamp();
    const pathMsg = {
      header: { stamp, frame_id: state.frameId ?? "map" },
      poses: waypoints.map((p) => ({
        header: { stamp, frame_id: state.frameId ?? "map" },
        pose: { position: { x: p.x, y: p.y, z: p.z }, orientation: { x: 0, y: 0, z: 0, w: 1 } },
      })),
    };
    
    (context as any).publish?.({
      topic: state.pathTopic ?? "/planned_path",
      schemaName: "nav_msgs/Path",
      value: pathMsg,
    });

    alert(`已发布 ${waypoints.length} 个路径点到话题 ${state.pathTopic}`);
  }

  function addWaypoint() {
    const newWaypoint = {
      x: Math.random() * 10 - 5,
      y: Math.random() * 10 - 5, 
      z: 0
    };
    setWaypoints(prev => [...prev, newWaypoint]);
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h3>3D 路径规划器</h3>
      
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div>
          <label>frame_id: </label>
          <input
            value={state.frameId ?? "map"}
            onChange={(e) => setState({ ...state, frameId: e.target.value })}
            style={{ width: "100px" }}
          />
        </div>
        <div>
          <label>Path topic: </label>
          <input
            value={state.pathTopic ?? "/planned_path"}
            onChange={(e) => setState({ ...state, pathTopic: e.target.value })}
            style={{ width: "150px" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button onClick={addWaypoint}>添加随机路径点</button>
        <button onClick={() => setWaypoints([])}>清空路径</button>
        <button onClick={publishPath} disabled={waypoints.length === 0}>
          发布轨迹 ({waypoints.length})
        </button>
      </div>

      <div>
        <h4>当前路径点:</h4>
        <div style={{ maxHeight: "200px", overflow: "auto", border: "1px solid #ccc", padding: "8px" }}>
          {waypoints.map((wp, index) => (
            <div key={index}>
              点 {index + 1}: ({wp.x.toFixed(2)}, {wp.y.toFixed(2)}, {wp.z.toFixed(2)})
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "16px", padding: "8px", background: "#f0f0f0", borderRadius: "4px" }}>
        <strong>说明:</strong> 这是一个简化版本的路径规划器。点击"添加随机路径点"来创建路径，然后点击"发布轨迹"将路径发布为ROS消息。
      </div>
    </div>
  );
}

export function initPathPlannerPanel(context: PanelExtensionContext): () => void {
  const root = createRoot(context.panelElement);
  root.render(<PathPlannerPanel context={context} />);
  return () => root.unmount();
}