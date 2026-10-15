# Geo-Video Audit Data Sources

Sentinel Site Audit is designed as a multi-source evidence system. No single imagery or mapping provider is treated as the complete truth.

## Source classes

### Geospatial and mapping
- Google Maps Platform / Google Earth ecosystem where licensed APIs permit use
- OpenStreetMap
- Esri ArcGIS services
- HERE
- Mapbox
- Cesium ion and compatible 3D Tiles
- Swiss federal and cantonal open geodata
- Swiss cadastral and planning data where legally accessible

### Satellite and aerial imagery
- Commercial satellite providers where licensed
- Public satellite imagery
- National and municipal orthophoto/open-data sources
- Licensed aerial imagery

### Street-level and ground imagery
- Google Street View where API terms permit use
- Mapillary
- KartaView
- User-supplied photographs
- Customer-provided inspection imagery

### Video
- Customer-uploaded inspection video
- Drone imagery where the operator has the required rights and permissions
- Publicly available project videos where reuse is permitted
- Time-indexed video frames as evidence objects

### Social and public information
- Public company and project social profiles
- Public posts and media where access and reuse are permitted
- News and project announcements
- Public procurement portals
- Public planning and construction information

### AI analysis
AI services may be used for:
- object detection;
- segmentation;
- OCR;
- image classification;
- video frame analysis;
- geospatial feature extraction;
- evidence summarization;
- finding generation;
- opportunity generation;
- confidence scoring.

## Evidence principle

Every AI-generated finding should retain provenance: source, capture time where available, source URL or asset reference, geographic position, model/action used, and confidence.

AI output is an analytical hypothesis until validated. Sentinel must distinguish observed evidence from inferred conclusions.

## Privacy and compliance

Source connectors must respect provider terms, copyright, privacy, access controls, and applicable law. Sensitive imagery or personal data should not be collected or processed merely because it is technically accessible.
