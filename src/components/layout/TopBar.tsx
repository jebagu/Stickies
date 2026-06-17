import type { CSSProperties } from "react";
import { Monitor, Presentation, Settings } from "lucide-react";
import { isPublicViewMode } from "../../lib/appMode";
import { STICKIES_DRIVE_FOLDER_NAME } from "../../lib/googleDrive/driveClient";
import { loadStickiesDriveFolder } from "../../lib/googleDrive/stickiesFolder";
import { THEME_OPTIONS, formatThemeLabel } from "../../lib/options";
import { useProjectStore } from "../../state/projectStore";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { Toggle } from "../ui/Toggle";

const logoMaskStyle = {
  "--top-bar-logo-url": `url("${import.meta.env.BASE_URL}favicon.svg")`,
} as CSSProperties;

function formatLocalStatusLabel(saveStatus: ReturnType<typeof useProjectStore.getState>["saveStatus"]) {
  if (saveStatus === "saving") {
    return "Saving locally";
  }

  if (saveStatus === "unsaved") {
    return "Not saved";
  }

  if (saveStatus === "error") {
    return "Local save failed";
  }

  return "Locally saved";
}

function formatDriveStatusLabel(cloudSaveStatus: ReturnType<typeof useProjectStore.getState>["cloudSaveStatus"]) {
  if (cloudSaveStatus === "saving") {
    return "Saving to Drive";
  }

  if (cloudSaveStatus === "saved") {
    return "Saved to Drive";
  }

  if (cloudSaveStatus === "error") {
    return "Not saved to Drive";
  }

  if (cloudSaveStatus === "read-only") {
    return "View-only Drive file";
  }

  return "Not saved to Drive";
}

function formatProjectSaveLocation(args: {
  cloudFile: ReturnType<typeof useProjectStore.getState>["cloudFile"];
  cloudSaveStatus: ReturnType<typeof useProjectStore.getState>["cloudSaveStatus"];
  fallbackDriveFolderName?: string;
  projectName: string;
  saveStatus: ReturnType<typeof useProjectStore.getState>["saveStatus"];
}) {
  if (!args.cloudFile || args.cloudSaveStatus === "local") {
    return `${args.projectName} (${formatLocalStatusLabel(args.saveStatus)})`;
  }

  const drivePath = [
    "Google Drive",
    args.cloudFile.folderName ?? args.fallbackDriveFolderName,
    args.cloudFile.name,
  ]
    .filter(Boolean)
    .join(" / ");

  return `${drivePath} (${formatDriveStatusLabel(args.cloudSaveStatus)})`;
}

export function TopBar() {
  const {
    cloudError,
    cloudFile,
    cloudSaveStatus,
    project,
    saveStatus,
    viewMode,
    setTheme,
    toggleAdminMode,
    toggleMiniMap,
    togglePresentationMode,
  } = useProjectStore();
  const presentationMode = project.settings.presentationMode;
  const readOnly = isPublicViewMode(viewMode);
  const fallbackDriveFolderName = cloudFile?.folderName
    ? undefined
    : (loadStickiesDriveFolder()?.name ?? STICKIES_DRIVE_FOLDER_NAME);
  const projectSaveLocation = formatProjectSaveLocation({
    cloudFile,
    cloudSaveStatus,
    fallbackDriveFolderName,
    projectName: project.projectName,
    saveStatus,
  });

  return (
    <header className="top-bar">
      <div className="top-bar__title">
        <div className="top-bar__brand">
          <span className="top-bar__logo" style={logoMaskStyle} aria-hidden="true" />
          <h1>Stickies</h1>
        </div>
        <p title={cloudError ?? undefined}>
          {projectSaveLocation}
        </p>
      </div>

      <div className="top-bar__actions">
        <Select
          aria-label="Theme"
          value={project.settings.themeId}
          onChange={(event) => setTheme(event.target.value as typeof project.settings.themeId)}
        >
          {THEME_OPTIONS.map((themeId) => (
            <option key={themeId} value={themeId}>
              {formatThemeLabel(themeId)}
            </option>
          ))}
        </Select>

        <Toggle checked={project.settings.showMiniMap} label="MiniMap" onChange={toggleMiniMap} />
        {presentationMode || readOnly ? null : (
          <Button variant={project.settings.adminMode ? "primary" : "secondary"} onClick={toggleAdminMode}>
            <Settings size={16} aria-hidden="true" />
            Settings
          </Button>
        )}
        {readOnly ? null : (
          <Button
            variant={project.settings.presentationMode ? "primary" : "secondary"}
            onClick={togglePresentationMode}
          >
            {project.settings.presentationMode ? (
              <Monitor size={16} aria-hidden="true" />
            ) : (
              <Presentation size={16} aria-hidden="true" />
            )}
            {project.settings.presentationMode ? "Exit" : "Present"}
          </Button>
        )}
      </div>
    </header>
  );
}
