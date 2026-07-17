"use client";

import { useEffect, useRef } from "react";
import "cesium/Build/Cesium/Widgets/widgets.css";

export default function CesiumMap() {
  const containerRef = useRef(null);

  useEffect(() => {
    let viewer;

    async function initializeCesium() {
      const Cesium = await import("cesium");

      viewer = new Cesium.Viewer(containerRef.current, {
        animation: false,
        timeline: false,
        baseLayerPicker: true,
        geocoder: true,
        homeButton: true,
        sceneModePicker: true,
        navigationHelpButton: false,
        fullscreenButton: true
      });

      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(8.2275, 46.8182, 550000)
      });
    }

    initializeCesium();

    return () => {
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
    };
  }, []);

  return <div ref={containerRef} className="cesium-container" aria-label="Site Audit geospatial viewer" />;
}
