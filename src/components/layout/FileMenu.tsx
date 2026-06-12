import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  ChevronDown,
  Download,
  FilePlus2,
  FolderOpen,
  History,
  Menu,
  Save,
  Share2,
  XCircle,
} from "lucide-react";
import { downloadProjectExport, parseProjectJsonFile, type ProjectExportFormat } from "../../lib/exportImport";
import {
  createPublishSlug,
  downloadPublishedProject,
  getPublishedProjectTargetPath,
  getPublishedProjectUrl,
} from "../../lib/publish";
import { useProjectStore } from "../../state/projectStore";
import { Button } from "../ui/Button";
import { useDialog } from "../ui/DialogProvider";

export function FileMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialog = useDialog();
  const { project, createNewProject, closeProject, createSnapshot, importProject } = useProjectStore();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const result = await parseProjectJsonFile(file);

    if (!result.ok) {
      await dialog.alert({
        title: "Open failed",
        message: result.error,
      });
      event.target.value = "";
      return;
    }

    if (
      await dialog.confirm({
        title: "Open native project",
        message: "Replace the current project with this native project file?",
        confirmLabel: "Open",
      })
    ) {
      importProject(result.project);
    }

    event.target.value = "";
  }

  async function handleNewProject() {
    if (
      await dialog.confirm({
        title: "New blank project",
        message: "Replace the current browser project with a new blank project? Export first if you need a file copy.",
        confirmLabel: "New Project",
        danger: true,
      })
    ) {
      createNewProject();
    }
  }

  async function handleCloseProject() {
    if (
      await dialog.confirm({
        title: "Close project",
        message: "Close the current browser project and switch to a blank project? Export first if you need a file copy.",
        confirmLabel: "Close Project",
        danger: true,
      })
    ) {
      closeProject();
    }
  }

  async function handleSaveSnapshot() {
    const label = await dialog.prompt({
      title: "Snapshot label",
      defaultValue: `Snapshot ${project.snapshots.length + 1}`,
      confirmLabel: "Save Snapshot",
    });

    if (label !== null) {
      createSnapshot(label);
    }
  }

  async function handleExport() {
    const format = await dialog.choose<ProjectExportFormat>({
      title: "Export project",
      message: "Choose the export format.",
      confirmLabel: "Export",
      choices: [
        {
          value: "native",
          label: "native",
          description: "the format this flowchart app uses",
        },
        {
          value: "markdown",
          label: "markdown",
          description: "good to import into AI tools",
        },
        {
          value: "docx",
          label: "DOCX",
          description: "human readable doc",
        },
      ],
    });

    if (format) {
      downloadProjectExport(project, format);
    }
  }

  async function handlePublish() {
    const confirmed = await dialog.confirm({
      title: "Publish read-only link",
      message:
        "Publish creates a frozen read-only snapshot. People with the link can view this version, but later edits will not update it.",
      confirmLabel: "Publish",
    });

    if (!confirmed) {
      return;
    }

    const slug = createPublishSlug();
    const publicUrl = getPublishedProjectUrl(slug);
    const targetPath = getPublishedProjectTargetPath(slug);

    downloadPublishedProject(project, slug);

    try {
      await navigator.clipboard?.writeText(publicUrl);
      await dialog.alert({
        title: "Published snapshot prepared",
        message: `The read-only link was copied to your clipboard:\n${publicUrl}\n\nSave the downloaded JSON as ${targetPath}, then deploy the static app so other people can open it.`,
      });
    } catch {
      await dialog.alert({
        title: "Published snapshot prepared",
        message: `Read-only link:\n${publicUrl}\n\nSave the downloaded JSON as ${targetPath}, then deploy the static app so other people can open it.`,
      });
    }
  }

  async function showVersionHistory() {
    if (project.snapshots.length === 0) {
      await dialog.alert({
        title: "Version history",
        message: "No snapshots yet.",
      });
      return;
    }

    await dialog.alert({
      title: "Version history",
      message: project.snapshots
        .slice(0, 8)
        .map((snapshot) => `${snapshot.label} - ${new Date(snapshot.createdAt).toLocaleString()}`)
        .join("\n"),
    });
  }

  function runMenuAction(action: () => void | Promise<void>) {
    setOpen(false);
    void action();
  }

  return (
    <div ref={menuRef} className="file-menu">
      <Button
        className="file-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
      >
        <Menu size={16} aria-hidden="true" />
        File
        <ChevronDown size={14} aria-hidden="true" />
      </Button>

      {open ? (
        <div className="file-menu__panel" role="menu" aria-label="File actions">
          <button type="button" role="menuitem" onClick={() => runMenuAction(handleNewProject)}>
            <FilePlus2 size={15} aria-hidden="true" />
            <span>New</span>
          </button>
          <button type="button" role="menuitem" onClick={() => runMenuAction(() => fileInputRef.current?.click())}>
            <FolderOpen size={15} aria-hidden="true" />
            <span>Open</span>
          </button>
          <button type="button" role="menuitem" onClick={() => runMenuAction(handleCloseProject)}>
            <XCircle size={15} aria-hidden="true" />
            <span>Close</span>
          </button>
          <span className="file-menu__separator" aria-hidden="true" />
          <button type="button" role="menuitem" onClick={() => runMenuAction(handleSaveSnapshot)}>
            <Save size={15} aria-hidden="true" />
            <span>Save</span>
          </button>
          <button type="button" role="menuitem" onClick={() => runMenuAction(handlePublish)}>
            <Share2 size={15} aria-hidden="true" />
            <span>Publish</span>
          </button>
          <button type="button" role="menuitem" onClick={() => runMenuAction(handleExport)}>
            <Download size={15} aria-hidden="true" />
            <span>Export</span>
          </button>
          <button type="button" role="menuitem" onClick={() => runMenuAction(showVersionHistory)}>
            <History size={15} aria-hidden="true" />
            <span>Version History</span>
          </button>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        className="hidden"
        type="file"
        accept="application/json,.json"
        onChange={handleImport}
      />
    </div>
  );
}
