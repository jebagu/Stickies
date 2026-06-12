import type { ProjectFile } from "../types/planning";
import { isPlanningNodeData } from "../types/planning";
import { formatDateTimeForFilename } from "../utils/dates";
import { validateProjectFile } from "./validation";

export type ProjectExportFormat = "native" | "markdown" | "docx";

export type ImportProjectResult =
  | {
      ok: true;
      project: ProjectFile;
    }
  | {
      ok: false;
      error: string;
    };

export function createProjectJson(project: ProjectFile) {
  return JSON.stringify(project, null, 2);
}

export function createProjectExportFilename(format: ProjectExportFormat = "native", date = new Date()) {
  const extension = format === "native" ? "json" : format === "markdown" ? "md" : format;
  return `project-planner-${formatDateTimeForFilename(date)}.${extension}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadProjectJson(project: ProjectFile) {
  const blob = new Blob([createProjectJson(project)], {
    type: "application/json;charset=utf-8",
  });

  downloadBlob(blob, createProjectExportFilename("native"));
}

function normalizeLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function formatAssociated(project: ProjectFile, associatedIds: string[]) {
  return associatedIds
    .map((personId) => project.people.find((person) => person.id === personId)?.name ?? personId)
    .join(", ");
}

function formatWorkstream(project: ProjectFile, workstreamId: string | undefined) {
  return workstreamId
    ? project.workstreams.find((workstream) => workstream.id === workstreamId)?.name ?? workstreamId
    : "";
}

function formatTags(project: ProjectFile, tagIds: string[] | undefined) {
  return (tagIds ?? []).map((tagId) => project.tags.find((tag) => tag.id === tagId)?.label ?? tagId).join(", ");
}

function appendDetail(lines: string[], label: string, value: string | undefined) {
  const normalizedValue = normalizeLine(value ?? "");

  if (normalizedValue) {
    lines.push(`  - ${label}: ${normalizedValue}`);
  }
}

export function createProjectMarkdown(project: ProjectFile) {
  const lines: string[] = [];
  const planningNodeCount = project.tabs.reduce(
    (count, tab) => count + tab.nodes.filter((node) => node.type === "planningNode").length,
    0,
  );
  const edgeCount = project.tabs.reduce((count, tab) => count + tab.edges.length, 0);

  lines.push(`# ${project.projectName}`);
  lines.push("");
  lines.push(`Updated: ${new Date(project.updatedAt).toLocaleString()}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Tabs: ${project.tabs.length}`);
  lines.push(`- Planning items: ${planningNodeCount}`);
  lines.push(`- Dependencies: ${edgeCount}`);
  lines.push("");

  project.tabs.forEach((tab) => {
    const planningNodes = tab.nodes.filter((node) => node.type === "planningNode" && isPlanningNodeData(node.data));
    const nodeTitleById = new Map(
      planningNodes.map((node) => [node.id, isPlanningNodeData(node.data) ? node.data.title : node.id]),
    );

    lines.push(`## ${tab.name}`);
    lines.push("");

    if (tab.description?.trim()) {
      lines.push(tab.description.trim());
      lines.push("");
    }

    const orderedStages = [...tab.stages].sort((a, b) => a.order - b.order);
    const stageIds = new Set(orderedStages.map((stage) => stage.id));
    const stageSections = [
      ...orderedStages.map((stage) => ({
        id: stage.id,
        name: stage.name,
      })),
      {
        id: "",
        name: "No stage",
      },
    ];

    stageSections.forEach((stage) => {
      const stageNodes = planningNodes
        .filter((node) => {
          if (!isPlanningNodeData(node.data)) {
            return false;
          }

          return stage.id
            ? node.data.stageId === stage.id
            : !node.data.stageId || !stageIds.has(node.data.stageId);
        })
        .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);

      if (stageNodes.length === 0) {
        return;
      }

      lines.push(`### ${stage.name}`);
      lines.push("");

      stageNodes.forEach((node) => {
        if (!isPlanningNodeData(node.data)) {
          return;
        }

        const data = node.data;

        lines.push(`- **${data.title}**`);
        appendDetail(lines, "Status", data.status);
        appendDetail(lines, "Workstream", formatWorkstream(project, data.workstreamId));
        appendDetail(lines, "Associated", formatAssociated(project, data.associatedIds));
        appendDetail(lines, "Priority", data.priority);
        appendDetail(lines, "Target date", data.targetDate);
        appendDetail(lines, "Confidence", data.confidence);
        appendDetail(lines, "Tags", formatTags(project, data.tagIds));
        appendDetail(lines, "Notes", data.notes);

        if (data.links?.length) {
          lines.push(
            `  - Links: ${data.links.map((link) => `[${link.label || link.url}](${link.url})`).join(", ")}`,
          );
        }
      });

      lines.push("");
    });

    lines.push("### Dependencies");
    lines.push("");

    if (tab.edges.length === 0) {
      lines.push("- None");
      lines.push("");
      return;
    }

    tab.edges.forEach((edge) => {
      const sourceTitle = nodeTitleById.get(edge.source) ?? edge.source;
      const targetTitle = nodeTitleById.get(edge.target) ?? edge.target;

      lines.push(`- **${sourceTitle}** -> **${targetTitle}**`);
      appendDetail(lines, "Line type", edge.data.lineType);
    });

    lines.push("");
  });

  return `${lines.join("\n").trim()}\n`;
}

export function downloadProjectMarkdown(project: ProjectFile) {
  const blob = new Blob([createProjectMarkdown(project)], {
    type: "text/markdown;charset=utf-8",
  });

  downloadBlob(blob, createProjectExportFilename("markdown"));
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function markdownToPlainText(value: string) {
  return value
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/\*\*/g, "")
    .replace(/`/g, "");
}

function createWordParagraph(line: string) {
  const trimmedLine = line.trim();

  if (!trimmedLine) {
    return "<w:p/>";
  }

  const headingMatch = trimmedLine.match(/^(#{1,3})\s+(.+)$/);

  if (headingMatch) {
    const level = headingMatch[1].length;
    const size = level === 1 ? 32 : level === 2 ? 26 : 22;
    const after = level === 1 ? 220 : 160;

    return `<w:p><w:pPr><w:spacing w:after="${after}"/><w:outlineLvl w:val="${level - 1}"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="${size}"/></w:rPr><w:t>${escapeXml(markdownToPlainText(headingMatch[2]))}</w:t></w:r></w:p>`;
  }

  const bulletMatch = line.match(/^(\s*)-\s+(.+)$/);

  if (bulletMatch) {
    const depth = Math.min(Math.floor(bulletMatch[1].length / 2), 2);
    const left = 360 + depth * 360;

    return `<w:p><w:pPr><w:ind w:left="${left}"/></w:pPr><w:r><w:t>- ${escapeXml(markdownToPlainText(bulletMatch[2]))}</w:t></w:r></w:p>`;
  }

  return `<w:p><w:r><w:t>${escapeXml(markdownToPlainText(trimmedLine))}</w:t></w:r></w:p>`;
}

function createDocumentXml(markdown: string) {
  const body = markdown.split("\n").map(createWordParagraph).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`;
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc ^= byte;

    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function dateToDosTime(date: Date) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();

  return { dosDate, dosTime };
}

function writeUint16(output: number[], value: number) {
  output.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeUint32(output: number[], value: number) {
  output.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function createZip(files: { name: string; content: string }[]) {
  const encoder = new TextEncoder();
  const output: number[] = [];
  const centralDirectory: number[] = [];
  const { dosDate, dosTime } = dateToDosTime(new Date());

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const contentBytes = encoder.encode(file.content);
    const checksum = crc32(contentBytes);
    const localHeaderOffset = output.length;

    writeUint32(output, 0x04034b50);
    writeUint16(output, 20);
    writeUint16(output, 0);
    writeUint16(output, 0);
    writeUint16(output, dosTime);
    writeUint16(output, dosDate);
    writeUint32(output, checksum);
    writeUint32(output, contentBytes.length);
    writeUint32(output, contentBytes.length);
    writeUint16(output, nameBytes.length);
    writeUint16(output, 0);
    output.push(...nameBytes, ...contentBytes);

    writeUint32(centralDirectory, 0x02014b50);
    writeUint16(centralDirectory, 20);
    writeUint16(centralDirectory, 20);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, dosTime);
    writeUint16(centralDirectory, dosDate);
    writeUint32(centralDirectory, checksum);
    writeUint32(centralDirectory, contentBytes.length);
    writeUint32(centralDirectory, contentBytes.length);
    writeUint16(centralDirectory, nameBytes.length);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint32(centralDirectory, 0);
    writeUint32(centralDirectory, localHeaderOffset);
    centralDirectory.push(...nameBytes);
  });

  const centralDirectoryOffset = output.length;
  output.push(...centralDirectory);
  writeUint32(output, 0x06054b50);
  writeUint16(output, 0);
  writeUint16(output, 0);
  writeUint16(output, files.length);
  writeUint16(output, files.length);
  writeUint32(output, centralDirectory.length);
  writeUint32(output, centralDirectoryOffset);
  writeUint16(output, 0);

  return new Uint8Array(output);
}

export function createProjectDocx(project: ProjectFile) {
  const markdown = createProjectMarkdown(project);
  const coreDate = new Date(project.updatedAt).toISOString();

  return createZip([
    {
      name: "[Content_Types].xml",
      content:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>',
    },
    {
      name: "_rels/.rels",
      content:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>',
    },
    {
      name: "word/document.xml",
      content: createDocumentXml(markdown),
    },
    {
      name: "docProps/core.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${escapeXml(project.projectName)}</dc:title><dc:creator>SS React Flow Charts</dc:creator><cp:lastModifiedBy>SS React Flow Charts</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${coreDate}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${coreDate}</dcterms:modified></cp:coreProperties>`,
    },
    {
      name: "docProps/app.xml",
      content:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>SS React Flow Charts</Application></Properties>',
    },
  ]);
}

export function downloadProjectDocx(project: ProjectFile) {
  const blob = new Blob([createProjectDocx(project)], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  downloadBlob(blob, createProjectExportFilename("docx"));
}

export function downloadProjectExport(project: ProjectFile, format: ProjectExportFormat) {
  if (format === "markdown") {
    downloadProjectMarkdown(project);
    return;
  }

  if (format === "docx") {
    downloadProjectDocx(project);
    return;
  }

  downloadProjectJson(project);
}

export async function parseProjectJsonFile(file: File): Promise<ImportProjectResult> {
  if (!file.name.toLowerCase().endsWith(".json")) {
    return {
      ok: false,
      error: "Choose a native .json project file.",
    };
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text) as unknown;
    const validation = validateProjectFile(parsed);

    if (!validation.ok) {
      return {
        ok: false,
        error: validation.errors.join(" "),
      };
    }

    return {
      ok: true,
      project: validation.project,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Project file could not be imported.",
    };
  }
}
