import { useEffect, useState } from "react";
import { loadDriveProject } from "../../lib/googleDrive/openDriveProject";
import { rememberDriveRecentFile } from "../../lib/googleDrive/recents";
import { useProjectStore } from "../../state/projectStore";
import { useDialog } from "../ui/DialogProvider";

function getDriveFileIdFromLocation() {
  if (typeof window === "undefined") {
    return null;
  }

  return new URLSearchParams(window.location.search).get("driveFileId");
}

export function DriveFileLinkPrompt() {
  const [prompted, setPrompted] = useState(false);
  const dialog = useDialog();
  const importProject = useProjectStore((state) => state.importProject);
  const setCloudFile = useProjectStore((state) => state.setCloudFile);

  useEffect(() => {
    const driveFileId = getDriveFileIdFromLocation();

    if (!driveFileId || prompted) {
      return;
    }

    setPrompted(true);

    void (async () => {
      const confirmed = await dialog.confirm({
        title: "Open shared Drive file?",
        message: "This link points to a Google Drive file. Open it with Stickies?",
        confirmLabel: "Open from Google Drive",
      });

      if (!confirmed) {
        return;
      }

      try {
        const result = await loadDriveProject(driveFileId);
        importProject(result.project);
        setCloudFile(result.cloudFile);
        rememberDriveRecentFile(result.cloudFile);
      } catch (error) {
        await dialog.alert({
          title: "Open shared Drive file failed",
          message: error instanceof Error ? error.message : "The Google Drive file could not be opened.",
        });
      }
    })();
  }, [dialog, importProject, prompted, setCloudFile]);

  return null;
}
