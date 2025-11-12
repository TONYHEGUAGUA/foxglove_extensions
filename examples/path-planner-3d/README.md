# Path Planner 3D

A full-featured 3D path planning panel for Foxglove with:

- **Complete 3D scene** with Three.js (grid, axes, camera controls)
- **Mouse interaction** - Click on the ground plane to add waypoints
- **Topic subscriptions** - Optionally subscribe to MarkerArray topics to visualize robot data
- **Path publishing** - Publishes `nav_msgs/Path` and `visualization_msgs/MarkerArray` to configurable topics
- **3D visualization** - See your planned path in real-time with 3D waypoint spheres and connecting lines

## Features

- **3D Camera Controls**: 
  - Left mouse drag: Rotate view
  - Right mouse drag: Pan
  - Mouse wheel: Zoom
  - Click ground plane: Add waypoint

- **Topic Integration**:
  - Subscribe to MarkerArray topics to visualize robot state, sensors, etc.
  - All visualization happens in the same 3D scene

- **Path Planning**:
  - Click to add waypoints in 3D space
  - Visual feedback with spheres and connecting lines
  - Publish as ROS Path message

## Usage

1. Install dependencies: `npm install`
2. Local install to Foxglove: `npm run local-install`
3. In Foxglove, add the panel "Path Planner 3D"
4. Click on the ground plane to add waypoints
5. Configure frame_id and topics in the toolbar
6. Click "发布轨迹" to publish the path

## Configuration

- **frame_id**: ROS frame for published messages (default: "map")
- **Path topic**: Topic to publish nav_msgs/Path (default: "/planned_path")
- **Marker topic**: Topic to publish visualization_msgs/MarkerArray (default: "/planned_path_markers")
- **Subscribe to Markers**: Enable to subscribe to a MarkerArray topic and visualize it in the 3D scene

