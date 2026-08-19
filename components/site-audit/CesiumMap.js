"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import "cesium/Build/Cesium/Widgets/widgets.css";

const CesiumMap = forwardRef(function CesiumMap({ onMetricsChange, onStatusChange, onGeometryChange, onLocationSelected, onBoundaryDetected }, ref) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const cesiumRef = useRef(null);
  const drawingHandlerRef = useRef(null);
  const mapSelectionHandlerRef = useRef(null);
  const drawingEntitiesRef = useRef([]);
  const detectedBoundaryRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function initializeCesium() {
      const Cesium = await import("cesium");
      if (cancelled || !containerRef.current) return;
      const ionToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
      if (ionToken) Cesium.Ion.defaultAccessToken = ionToken;
      cesiumRef.current = Cesium;
      const viewer = new Cesium.Viewer(containerRef.current, { animation: false, timeline: false, baseLayerPicker: true, geocoder: true, homeButton: true, sceneModePicker: true, navigationHelpButton: false, fullscreenButton: true, terrainProvider: new Cesium.EllipsoidTerrainProvider() });
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

  function removeEntity(entity) {
    const viewer = viewerRef.current;
    if (viewer && entity) viewer.entities.remove(entity);
    drawingEntitiesRef.current = drawingEntitiesRef.current.filter((item) => item !== entity);
  }

  function clearDrawings() {
    const viewer = viewerRef.current;
    drawingHandlerRef.current?.destroy();
    drawingHandlerRef.current = null;
    mapSelectionHandlerRef.current?.destroy();
    mapSelectionHandlerRef.current = null;
    if (!viewer) return;
    drawingEntitiesRef.current.forEach((entity) => viewer.entities.remove(entity));
    drawingEntitiesRef.current = [];
    detectedBoundaryRef.current = null;
    onGeometryChange?.(null);
    onBoundaryDetected?.(null);
  }

  function renderBoundary(geometry, options = {}) {
    const Cesium = cesiumRef.current;
    const viewer = viewerRef.current;
    if (!Cesium || !viewer || !geometry?.length) return null;
    const positions = geometry.map(([longitude, latitude]) => Cesium.Cartesian3.fromDegrees(longitude, latitude));
    const entity = viewer.entities.add({ polygon: { hierarchy: new Cesium.PolygonHierarchy(positions), material: (options.color || Cesium.Color.YELLOW).withAlpha(options.alpha ?? 0.16), outline: true, outlineColor: options.color || Cesium.Color.YELLOW, outlineWidth: options.outlineWidth || 3 } });
    drawingEntitiesRef.current.push(entity);
    return entity;
  }

  function previewDetectedBoundary(boundingBox) {
    const Cesium = cesiumRef.current;
    const viewer = viewerRef.current;
    if (!Cesium || !viewer || !boundingBox || boundingBox.length !== 4) return null;
    const [south, north, west, east] = boundingBox.map(Number);
    if (![south, north, west, east].every(Number.isFinite) || south >= north || west >= east) return null;
    if (detectedBoundaryRef.current) removeEntity(detectedBoundaryRef.current);
    const geometry = [[west, south], [east, south], [east, north], [west, north]];
    detectedBoundaryRef.current = renderBoundary(geometry, { color: Cesium.Color.YELLOW, alpha: 0.12 });
    viewer.camera.flyTo({ destination: Cesium.Rectangle.fromDegrees(west, south, east, north), duration: 1.2 });
    onBoundaryDetected?.(geometry);
    return geometry;
  }

  function finalizeGeometry(coordinates, status = "Site boundary defined") {
    const Cesium = cesiumRef.current;
    if (!Cesium || coordinates.length < 3) return false;
    const cartographics = coordinates.map(([longitude, latitude]) => Cesium.Cartographic.fromDegrees(longitude, latitude));
    const perimeterMeters = cartographics.reduce((total, current, index) => total + new Cesium.EllipsoidGeodesic(current, cartographics[(index + 1) % cartographics.length]).surfaceDistance, 0);
    const centerLatitude = cartographics.reduce((sum, point) => sum + point.latitude, 0) / cartographics.length;
    const radius = Cesium.Ellipsoid.WGS84.maximumRadius;
    const projected = cartographics.map((point) => ({ x: radius * point.longitude * Math.cos(centerLatitude), y: radius * point.latitude }));
    let signedArea = 0;
    for (let index = 0; index < projected.length; index += 1) {
      const next = (index + 1) % projected.length;
      signedArea += projected[index].x * projected[next].y - projected[next].x * projected[index].y;
    }
    onGeometryChange?.(coordinates);
    onMetricsChange?.({ perimeterMeters, areaSquareMeters: Math.abs(signedArea) / 2 });
    onStatusChange?.(status);
    return true;
  }

  function acceptDetectedBoundary() {
    const detected = detectedBoundaryRef.current;
    if (!detected) return null;
    const Cesium = cesiumRef.current;
    const hierarchy = detected.polygon?.hierarchy?.getValue?.(Cesium.JulianDate.now());
    const positions = hierarchy?.positions || [];
    if (positions.length < 3) return null;
    const coordinates = positions.map((position) => {
      const cartographic = Cesium.Cartographic.fromCartesian(position);
      return [Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude)];
    });
    removeEntity(detected);
    detectedBoundaryRef.current = null;
    onBoundaryDetected?.(null);
    finalizeGeometry(coordinates, "Detected boundary accepted");
    return coordinates;
  }

  async function locate(query) {
    const Cesium = cesiumRef.current;
    const viewer = viewerRef.current;
    if (!Cesium || !viewer || !query.trim()) return false;
    const coordinateMatch = query.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,; ]\s*(-?\d+(?:\.\d+)?)$/);
    let longitude; let latitude; let displayName = query.trim(); let boundingBox = null;
    if (coordinateMatch) { latitude = Number(coordinateMatch[1]); longitude = Number(coordinateMatch[2]); }
    else {
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        if (!response.ok) return false;
        const result = await response.json();
        if (!result.data?.length) return false;
        const first = result.data[0];
        latitude = Number(first.latitude); longitude = Number(first.longitude); displayName = first.displayName || displayName; boundingBox = first.boundingBox || null;
      } catch { return false; }
    }
    viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 2500), duration: 1.8 });
    if (boundingBox) previewDetectedBoundary(boundingBox);
    return { latitude, longitude, displayName, boundingBox };
  }

  function enableMapSelection() {
    const Cesium = cesiumRef.current; const viewer = viewerRef.current;
    if (!Cesium || !viewer) return;
    mapSelectionHandlerRef.current?.destroy();
    onStatusChange?.("Click the map to select a site location");
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    mapSelectionHandlerRef.current = handler;
    handler.setInputAction((movement) => {
      const position = viewer.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
      if (!position) return;
      const cartographic = Cesium.Cartographic.fromCartesian(position);
      const latitude = Cesium.Math.toDegrees(cartographic.latitude); const longitude = Cesium.Math.toDegrees(cartographic.longitude);
      drawingEntitiesRef.current.push(viewer.entities.add({ position, point: { pixelSize: 11, color: Cesium.Color.CYAN, outlineColor: Cesium.Color.WHITE, outlineWidth: 2 } }));
      handler.destroy(); mapSelectionHandlerRef.current = null;
      onStatusChange?.("Map location selected — define the site boundary");
      onLocationSelected?.({ latitude, longitude, displayName: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, boundingBox: null });
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  function startPolygonDrawing() {
    const Cesium = cesiumRef.current; const viewer = viewerRef.current;
    if (!Cesium || !viewer) return;
    clearDrawings();
    onMetricsChange?.({ perimeterMeters: null, areaSquareMeters: null });
    onStatusChange?.("Click boundary vertices; double-click to finish");
    const positions = [];
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    drawingHandlerRef.current = handler;
    drawingEntitiesRef.current.push(viewer.entities.add({ polygon: { hierarchy: new Cesium.CallbackProperty(() => positions.length >= 3 ? new Cesium.PolygonHierarchy(positions) : undefined, false), material: Cesium.Color.CYAN.withAlpha(0.25), outline: true, outlineColor: Cesium.Color.CYAN } }));
    handler.setInputAction((movement) => {
      const position = viewer.scene.pickPosition(movement.position) || viewer.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
      if (!position) return;
      positions.push(position);
      drawingEntitiesRef.current.push(viewer.entities.add({ position, point: { pixelSize: 8, color: Cesium.Color.WHITE, outlineColor: Cesium.Color.CYAN, outlineWidth: 2 } }));
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    handler.setInputAction(() => {
      if (positions.length < 3) return;
      handler.destroy(); drawingHandlerRef.current = null;
      const coordinates = positions.map((position) => { const cartographic = Cesium.Cartographic.fromCartesian(position); return [Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude)]; });
      finalizeGeometry(coordinates);
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  }

  useImperativeHandle(ref, () => ({ locate, startPolygonDrawing, clearDrawings, enableMapSelection, acceptDetectedBoundary }));
  return <div ref={containerRef} className="cesium-container" aria-label="Site Audit geospatial viewer" />;
});

export default CesiumMap;
