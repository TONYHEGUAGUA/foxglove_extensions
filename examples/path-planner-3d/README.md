# Path Planner 3D

An interactive Foxglove extension panel to place waypoints with the mouse and publish:

- `nav_msgs/Path` to a configurable topic
- `visualization_msgs/MarkerArray` for visualization in the 3D panel

Usage:
1. Install deps: `npm install`
2. Local install to Foxglove: `npm run local-install`
3. In Foxglove add the panel "Path Planner 3D", click canvas to add waypoints, then "发布轨迹"

Notes:
- Coordinates are on the XY plane in meters with a simple 2D canvas for interaction.
- Configure `frame_id`, path and marker topics in the toolbar.

