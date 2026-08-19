# Geo-Video Audit Intelligence

## Purpose

Geo-Video Audit is the evidence-driven inspection layer of Sentinel Autogard. It combines geospatial context, imagery, video, photographs, public information, and AI analysis to identify existing security assets, vulnerabilities, investigation points, and modernization opportunities.

## Evidence Sources

Supported source classes include:

- satellite imagery;
- aerial imagery;
- street-level imagery;
- map and geospatial datasets;
- cadastral and planning datasets where legally accessible;
- customer photographs;
- inspection photographs;
- inspection video;
- drone imagery where authorized;
- public project information;
- public procurement information;
- public news and social-media information;
- AI-generated observations and classifications.

Every observation should preserve provenance whenever available: source type, source reference, capture/publication timestamp, geographic position, processing method, and confidence.

## Evidence Model

Sentinel distinguishes three states:

1. **Observed** — directly supported by source evidence.
2. **Inferred** — derived by AI or analytical rules from available evidence.
3. **Validated** — reviewed and confirmed by an authorized human.

AI-generated conclusions must not be represented as confirmed facts without supporting evidence or human validation.

## Audit Objects

The audit workspace can contain:

- site boundary;
- buildings;
- fences;
- vehicle gates;
- pedestrian gates;
- barriers;
- road blockers;
- turnstiles;
- CCTV;
- ANPR;
- access-control points;
- parking areas;
- roads and circulation routes;
- checkpoints;
- loading areas;
- restricted zones;
- other security-relevant assets.

## Findings

A Finding represents an observed or inferred condition requiring attention. Examples:

- uncontrolled vehicle access;
- weak pedestrian access control;
- perimeter exposure;
- potential blind zone;
- insufficient vehicle standoff;
- obsolete or incomplete access equipment;
- unclear security coverage;
- infrastructure requiring further inspection.

Each Finding should include severity, confidence, evidence references, geographic position, explanation, and review status.

## Opportunities

An Opportunity represents a commercially relevant improvement identified from a Finding, existing asset, project stage, or site condition.

Opportunity types:

- New Installation;
- Modernization;
- Replacement;
- Expansion;
- Service;
- Further Investigation.

An Opportunity may reference one or more AUTOGARD products only when the product knowledge base provides a defensible match. Sentinel must be able to return **No matching product identified** rather than inventing a recommendation.

## AI Pipeline

```text
Source Acquisition
        ↓
Normalization / Geolocation
        ↓
Evidence Registry
        ↓
Computer Vision / Multimodal AI
        ↓
Object Detection
        ↓
Security Interpretation
        ↓
Finding Generation
        ↓
Human Validation
        ↓
Opportunity Mapping
        ↓
Product Matching
        ↓
Business Opportunity
```

## Privacy and Compliance

Sentinel must use imagery, video, social content, and location information only through lawful, licensed, publicly accessible, customer-authorized, or otherwise authorized sources. Personal data should be minimized and handled according to applicable privacy requirements. The system should retain source provenance and access controls for auditability.
