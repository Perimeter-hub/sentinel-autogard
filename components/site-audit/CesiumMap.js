"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import "cesium/Build/Cesium/Widgets/widgets.css";

const CesiumMap = forwardRef(function CesiumMap({ onMetricsChange, onStatusChange }, ref) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const cesiumRef = useRef(null);
  const drawingHandlerRef = useRef(null);
  const drawingEntitiesRef = useRef([]);

  useEffect(() => {
    let cancelled = false;

    async function initializeCesium() {
      const Cesium = await import("cesium");
      if (cancelled || !containerRef.current) return;
      cesiumRef.current = Cesium;

      const viewer = new Cesium.Viewer(containerRef.current, {
        animation: false,
        timeline: false,
        baseLayerPicker: true,
        geocoder: true,
        homeButton: true,
        sceneModePicker: true,
        navigationHelpButton: false,
        fullscreenButton: true,
        terrainProvider: new Cesium.EllipsoidTerrainProvider()
      });

      viewerRef.current = viewer;
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(8.2275, 46.8182, 550000)
      });
    }

    initializeCesium();

    return () => {
      cancelled = true;
      drawingHandlerRef.current?.destroy();
      if (viewerRef.current && !viewerRef.current.isDestroyed()) viewerRef.current.destroy();
    };
  }, []);

  function clearDrawings() {
    const viewer = viewerRef.current;
    drawingHandlerRef.current?.destroy();
    drawingHandlerRef.current = null;
    if (!viewer) return;
    drawingEntitiesRef.current.forEach((entity) => viewer.entities.remove(entity));
    drawingEntitiesRef.current = [];
  }

  async function locate(query) {
    const Cesium = cesiumRef.current;
    const viewer = viewerRef.current;
    if (!Cesium || !viewer || !query.trim()) return false;

    const coordinateMatch = query.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,; ]\s*(-?\d+(?:\.\d+)?)$/);
    let longitude;
    let latitude;

    if (coordinateMatch) {
      latitude = Number(coordinateMatch[1]);
      longitude = Number(coordinateMatch[2]);
    } else {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ch&q=${encodeURIComponent(query)}`);
        const results = await response.json();
        if (!results.length) return false;
        latitude = Number(results[0].lat);
        longitude = Number(results[0].lon);
      } catch {
        return false;
      }
    }

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 2500),
      duration: 1.8
    });
    return true;
  }

  function startPolygonDrawing() {
    const Cesium = cesiumRef.current;
    const viewer = viewerRef.current;
    if (!Cesium || !viewer) return;

    clearDrawings();
    onMetricsChange?.({ perimeterMeters: null, areaSquareMeters: null });
    onStatusChange?.("Click perimeter vertices; double-click to finish");

    const positions = [];
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    drawingHandlerRef.current = handler;

    const dynamicPolygon = viewer.entities.add({
      polygon: {
        hierarchy: new Cesium.CallbackProperty(() => positions.length >= 3 ? new Cesium.PolygonHierarchy(positions) : undefined, false),
        material: Cesium.Color.CYAN.withAlpha(0.25),
        outline: true,
        outlineColor: Cesium.Color.CYAN
      }
    });
    drawingEntitiesRef.current.push(dynamicPolygon);

    handler.setInputAction((movement) => {
      const position = viewer.scene.pickPosition(movement.position) || viewer.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
      if (!position) return;
      positions.push(position);
      const point = viewer.entities.add({ position, point: { pixelSize: 8, color: Cesium.Color.WHITE, outlineColor: Cesium.Color.CYAN, outlineWidth: 2 } });
      drawingEntitiesRef.current.push(point);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction(() => {
      if (positions.length < 3) return;
      handler.destroy();
      drawingHandlerRef.current = null;

      const cartographics = positions.map((position) => Cesium.Cartographic.fromCartesian(position));
      let perimeterMeters = 0;
      for (let index = 0; index < cartographics.length; index += 1) {
        const next = (index + 1) % cartographics.length;
        perimeterMeters += new Cesium.EllipsoidGeodesic(cartographics[index], cartographics[next]).surfaceDistance;
      }

      const centerLatitude = cartographics.reduce((sum, point) => sum + point.latitude, 0) / cartographics.length;
      const radius = Cesium.Ellipsoid.WGS84.maximumRadius;
      const projected = cartographics.map((point) => ({ x: radius * point.longitude * Math.cos(centerLatitude), y: radius * point.latitude }));
      let signedArea = 0;
      for (let index = 0; index < projected.length; index += 1) {
        const next = (index + 1) % projected.length;
        signedArea += projected[index].x * projected[next].y - projected[next].x * projected[index].y;
      }
      const areaSquareMeters = Math.abs(signedArea) / 2;

      onMetricsChange?.({ perimeterMeters, areaSquareMeters });
      onStatusChange?.("Perimeter defined");
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  }

  useImperativeHandle(ref, () => ({ locate, startPolygonDrawing, clearDrawings }));

  return <div ref={containerRef} className="cesium-container" aria-label="Site Audit geospatial viewer" />;
});

export default CesiumMap;
