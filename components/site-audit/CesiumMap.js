"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import "cesium/Build/Cesium/Widgets/widgets.css";

const CesiumMap = forwardRef(function CesiumMap({ onMetricsChange, onStatusChange, onGeometryChange, onLocationSelected }, ref) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const cesiumRef = useRef(null);
  const drawingHandlerRef = useRef(null);
  const mapSelectionHandlerRef = useRef(null);
  const drawingEntitiesRef = useRef([]);

  useEffect(() => {
    let cancelled = false;

    async function initializeCesium() {
      const Cesium = await import("cesium");
      if (cancelled || !containerRef.current) return;
      const ionToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
      if (ionToken) Cesium.Ion.defaultAccessToken = ionToken;
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
      viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(8.2275, 46.8182, 550000) });
    }

    initializeCesium();
    return () => {
      cancelled = true;
      drawingHandlerRef.current?.destroy();
      mapSelectionHandlerRef.current?.destroy();
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
    onGeometryChange?.(null);
  }

  async function locate(query) {
    const Cesium = cesiumRef.current;
    const viewer = viewerRef.current;
    if (!Cesium || !viewer || !query.trim()) return false;

    const coordinateMatch = query.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,; ]\s*(-?\d+(?:\.\d+)?)$/);
    let longitude;
    let latitude;
    let displayName = query.trim();

    if (coordinateMatch) {
      latitude = Number(coordinateMatch[1]);
      longitude = Number(coordinateMatch[2]);
    } else {
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        if (!response.ok) return false;
        const result = await response.json();
        if (!result.data?.length) return false;
        const first = result.data[0];
        latitude = Number(first.latitude);
        longitude = Number(first.longitude);
        displayName = first.displayName || displayName;
      } catch {
        return false;
      }
    }

    viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 2500), duration: 1.8 });
    return { latitude, longitude, displayName };
  }

  function enableMapSelection() {
    const Cesium = cesiumRef.current;
    const viewer = viewerRef.current;
    if (!Cesium || !viewer) return;

    mapSelectionHandlerRef.current?.destroy();
    onStatusChange?.("Click the map to select a site location");
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    mapSelectionHandlerRef.current = handler;

    handler.setInputAction((movement) => {
      const position = viewer.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
      if (!position) return;
      const cartographic = Cesium.Cartographic.fromCartesian(position);
      const latitude = Cesium.Math.toDegrees(cartographic.latitude);
      const longitude = Cesium.Math.toDegrees(cartographic.longitude);
      const marker = viewer.entities.add({
        position,
        point: { pixelSize: 11, color: Cesium.Color.CYAN, outlineColor: Cesium.Color.WHITE, outlineWidth: 2 }
      });
      drawingEntitiesRef.current.push(marker);
      handler.destroy();
      mapSelectionHandlerRef.current = null;
      onStatusChange?.("Map location selected — define the site boundary");
      onLocationSelected?.({ latitude, longitude, displayName: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` });
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  function startPolygonDrawing() {
    const Cesium = cesiumRef.current;
    const viewer = viewerRef.current;
    if (!Cesium || !viewer) return;

    clearDrawings();
    onMetricsChange?.({ perimeterMeters: null, areaSquareMeters: null });
    onStatusChange?.("Click boundary vertices; double-click to finish");

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
      const perimeterMeters = cartographics.reduce((total, current, index) => {
        const next = cartographics[(index + 1) % cartographics.length];
        return total + new Cesium.EllipsoidGeodesic(current, next).surfaceDistance;
      }, 0);

      const centerLatitude = cartographics.reduce((sum, point) => sum + point.latitude, 0) / cartographics.length;
      const radius = Cesium.Ellipsoid.WGS84.maximumRadius;
      const projected = cartographics.map((point) => ({
        longitude: Cesium.Math.toDegrees(point.longitude),
        latitude: Cesium.Math.toDegrees(point.latitude),
        x: radius * point.longitude * Math.cos(centerLatitude),
        y: radius * point.latitude
      }));

      let signedArea = 0;
      for (let index = 0; index < projected.length; index += 1) {
        const next = (index + 1) % projected.length;
        signedArea += projected[index].x * projected[next].y - projected[next].x * projected[index].y;
      }

      onGeometryChange?.(projected.map(({ longitude, latitude }) => [longitude, latitude]));
      onMetricsChange?.({ perimeterMeters, areaSquareMeters: Math.abs(signedArea) / 2 });
      onStatusChange?.("Site boundary defined");
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  }

  useImperativeHandle(ref, () => ({ locate, startPolygonDrawing, clearDrawings, enableMapSelection }));
  return <div ref={containerRef} className="cesium-container" aria-label="Site Audit geospatial viewer" />;
});

export default CesiumMap;
