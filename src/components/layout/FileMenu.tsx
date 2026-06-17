import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  ChevronDown,
  CheckCircle2,
  CloudUpload,
  Download,
  FilePlus2,
  FolderOpen,
  History,
  Menu,
  Share2,
  XCircle,
} from "lucide-react";
import {
  downloadProjectExport,
  parseProjectJsonFile,
  type ProjectExportFormat,
} from "../../lib/exportImport";
import { useProjectStore } from "../../state/projectStore";
import { useDriveOpenActions } from "../drive/useDriveOpenActions";
import { useDrivePublishActions } from "../drive/useDrivePublishActions";
import { useDriveSaveActions } from "../drive/useDriveSaveActions";
import { Button } from "../ui/Button";
import { useDialog } from "../ui/DialogProvider";

export function FileMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialog = useDialog();
  const { openRecentDriveFile } = useDriveOpenActions();
  const { publishToDrive } = useDrivePublishActions();
  const { saveToDrive } = useDriveSaveActions();
  const {
    project,
    createNewProject,
    closeProject,
    createSnapshot,
    importProject,
  } = useProjectStore();

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
        message: "Replace the current browser project with a new blank project? Save a local file first if you need a file copy.",
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
        message: "Close the current browser project and switch to a blank project? Save a local file first if you need a file copy.",
        confirmLabel: "Close Project",
        danger: true,
      })
    ) {
      closeProject();
    }
  }

  async function handleSaveSnapshot() {
    const label = await dialog.prompt({
      title: "Checkpoint label",
      message: "Save a named checkpoint inside this Stickies project. Restore from Version history is planned but not available yet.",
      defaultValue: `Checkpoint ${project.snapshots.length + 1}`,
      confirmLabel: "Save Checkpoint",
    });

    if (label !== null) {
      createSnapshot(label);
    }
  }

  async function handleExport() {
    const format = await dialog.choose<ProjectExportFormat>({
      title: "Save local file",
      message: "Choose the local file format.",
      confirmLabel: "Save local file",
      choices: [
        {
          value: "native",
          label: "Stickies project file",
          description: "round-trips schema v1/v2 project data and metadata",
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
        "Publish creates a frozen read-only Google Drive snapshot and gives you a public link. Later edits will not update this published version.",
      confirmLabel: "Publish",
    });

    if (!confirmed) {
      return;
    }

    await publishToDrive();
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
      message: [
        "Checkpoint restore is planned but not available in this menu yet.",
        "",
        ...project.snapshots
          .slice(0, 8)
          .map((snapshot) => `${snapshot.label} - ${new Date(snapshot.createdAt).toLocaleString()}`),
      ].join("\n"),
    });
  }

  function runMenuAction(action: () => unknown | Promise<unknown>) {
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
            <span>Open local file</span>
          </button>
          <button type="button" role="menuitem" onClick={() => runMenuAction(handleExport)}>
            <Download size={15} aria-hidden="true" />
            <span>Save local file</span>
          </button>
          <button type="button" role="menuitem" onClick={() => runMenuAction(handleCloseProject)}>
            <XCircle size={15} aria-hidden="true" />
            <span>Close</span>
          </button>
          <span className="file-menu__separator" aria-hidden="true" />
          <button type="button" role="menuitem" onClick={() => runMenuAction(openRecentDriveFile)}>
            <History size={15} aria-hidden="true" />
            <span>Open recent</span>
          </button>
          <button type="button" role="menuitem" onClick={() => runMenuAction(saveToDrive)}>
            <CloudUpload size={15} aria-hidden="true" />
            <span>Save to Google Drive</span>
          </button>
          <span className="file-menu__separator" aria-hidden="true" />
          <button type="button" role="menuitem" onClick={() => runMenuAction(handlePublish)}>
            <Share2 size={15} aria-hidden="true" />
            <span>Publish</span>
          </button>
          <span className="file-menu__separator" aria-hidden="true" />
          <button type="button" role="menuitem" onClick={() => runMenuAction(handleSaveSnapshot)}>
            <CheckCircle2 size={15} aria-hidden="true" />
            <span>Save checkpoint</span>
          </button>
          <button type="button" role="menuitem" onClick={() => runMenuAction(showVersionHistory)}>
            <History size={15} aria-hidden="true" />
            <span>Version history</span>
          </button>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        className="hidden"
        type="file"
        accept=".stickies,.json,.stickies.json,application/json"
        onChange={handleImport}
      />
    </div>
  );
}
