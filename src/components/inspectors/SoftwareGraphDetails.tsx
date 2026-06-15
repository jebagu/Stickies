import type { SoftwareGraphEdgeMetadata, SoftwareGraphNodeMetadata } from "../../types/planning";

type SoftwareGraphDetailsProps = {
  metadata: SoftwareGraphNodeMetadata | SoftwareGraphEdgeMetadata | undefined;
  kindLabel: "Node kind" | "Edge kind";
};

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="read-only-field">
      <span className="read-only-field__label">{label}</span>
      <span className="read-only-field__value">{value || "None"}</span>
    </div>
  );
}

function formatValue(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function formatLineRange(metadata: SoftwareGraphNodeMetadata | SoftwareGraphEdgeMetadata) {
  if (metadata.lineStart === undefined && metadata.lineEnd === undefined) {
    return "";
  }

  if (metadata.lineStart !== undefined && metadata.lineEnd !== undefined) {
    return `${metadata.lineStart}-${metadata.lineEnd}`;
  }

  return formatValue(metadata.lineStart ?? metadata.lineEnd);
}

function formatMetadataSummary(metadata: Record<string, unknown> | undefined) {
  if (!metadata) {
    return "";
  }

  const entries = Object.entries(metadata);

  if (entries.length === 0) {
    return "";
  }

  return entries
    .slice(0, 6)
    .map(([key, value]) => `${key}: ${formatValue(value)}`)
    .join("\n");
}

export function SoftwareGraphDetails({ metadata, kindLabel }: SoftwareGraphDetailsProps) {
  if (!metadata) {
    return null;
  }

  const provenance = metadata.provenance;
  const kind = "nodeKind" in metadata ? metadata.nodeKind : metadata.edgeKind;

  return (
    <section className="inspector-stack software-graph-details" aria-label="Software graph metadata">
      <h3>Software graph</h3>
      <ReadOnlyField label={kindLabel} value={formatValue(kind)} />
      <ReadOnlyField label="Source path" value={formatValue(metadata.sourcePath ?? metadata.path)} />
      <ReadOnlyField label="Line range" value={formatLineRange(metadata)} />
      <ReadOnlyField label="Confidence" value={formatValue(metadata.confidence)} />
      <ReadOnlyField label="Source type" value={formatValue(provenance?.sourceType)} />
      <ReadOnlyField label="Extractor" value={formatValue(provenance?.extractor)} />
      <ReadOnlyField label="Observed at" value={formatValue(provenance?.observedAt)} />
      <ReadOnlyField label="Build ID" value={formatValue(metadata.buildId)} />
      <ReadOnlyField label="Snapshot ID" value={formatValue(metadata.snapshotId)} />
      <ReadOnlyField label="Metadata" value={formatMetadataSummary(metadata.metadata)} />
    </section>
  );
}
