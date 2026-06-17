import { getGoogleDriveAccessToken } from "../../lib/googleDrive/auth";
import {
  GOOGLE_DRIVE_PICKER_KEY_HELP_MESSAGE,
  getGoogleDriveConfigIssue,
  isGoogleDriveConfigured,
} from "../../lib/googleDrive/config";
import { loadDriveProject } from "../../lib/googleDrive/openDriveProject";
import { pickDriveFile } from "../../lib/googleDrive/picker";
import { forgetDriveRecentFile, loadDriveRecentFiles, rememberDriveRecentFile } from "../../lib/googleDrive/recents";
import { loadPublicGalleryFiles, loadPublicGallerySources, type PublicGalleryFile } from "../../lib/publicGallery";
import { useProjectStore } from "../../state/projectStore";
import { useDialog } from "../ui/DialogProvider";

function getGoogleDriveUnavailableMessage() {
  const issue = getGoogleDriveConfigIssue();
  return issue ? `${issue}\n\n${GOOGLE_DRIVE_PICKER_KEY_HELP_MESSAGE}` : GOOGLE_DRIVE_PICKER_KEY_HELP_MESSAGE;
}

function parseDriveFileId(input: string) {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return null;
  }

  const filePathMatch = trimmedInput.match(/\/file\/d\/([A-Za-z0-9_-]+)/);
  if (filePathMatch?.[1]) {
    return filePathMatch[1];
  }

  const openIdMatch = trimmedInput.match(/[?&]id=([A-Za-z0-9_-]+)/);
  if (openIdMatch?.[1]) {
    return openIdMatch[1];
  }

  return /^[A-Za-z0-9_-]+$/.test(trimmedInput) ? trimmedInput : null;
}

function formatGalleryFileDescription(sourceName: string, file: PublicGalleryFile) {
  const modifiedDescription = file.modifiedTime ? `Modified ${new Date(file.modifiedTime).toLocaleString()}` : "No modified date";

  return `${sourceName} - ${modifiedDescription}`;
}

export function useDriveOpenActions() {
  const dialog = useDialog();

  async function showOpenDriveError(title: string, error: unknown) {
    await dialog.alert({
      title,
      message: error instanceof Error ? error.message : "The Google Drive file could not be opened.",
    });
  }

  async function openDriveProjectById(fileId: string, sourceName?: string) {
    const { importProject, setCloudFile } = useProjectStore.getState();
    const result = await loadDriveProject(fileId, sourceName);

    if (
      await dialog.confirm({
        title: "Open from Google Drive",
        message: `Replace the current project with "${result.metadata.name}" from Google Drive?`,
        confirmLabel: "Open",
      })
    ) {
      importProject(result.project);
      setCloudFile(result.cloudFile);
      rememberDriveRecentFile(result.cloudFile);
      return true;
    }

    return false;
  }

  async function openFromDrive() {
    if (!isGoogleDriveConfigured()) {
      await dialog.alert({
        title: "Open from Google Drive",
        message: getGoogleDriveUnavailableMessage(),
      });
      return false;
    }

    try {
      const accessToken = await getGoogleDriveAccessToken();
      const pickedFile = await pickDriveFile(accessToken);

      if (!pickedFile) {
        return false;
      }

      return await openDriveProjectById(pickedFile.id, pickedFile.name);
    } catch (error) {
      await showOpenDriveError("Open from Google Drive failed", error);
      return false;
    }
  }

  async function openRecentDriveFile(fileId?: string) {
    const recents = loadDriveRecentFiles();

    if (recents.length === 0) {
      await dialog.alert({
        title: "Open recent Drive file",
        message: "No recent Google Drive files yet.",
      });
      return false;
    }

    const selectedFileId =
      fileId ??
      (await dialog.choose({
        title: "Open recent Drive file",
        message: "Choose a recent Google Drive file to reopen.",
        confirmLabel: "Open",
        choices: recents.map((recent) => ({
          value: recent.id,
          label: recent.name,
          description: recent.modifiedTime
            ? `Modified ${new Date(recent.modifiedTime).toLocaleString()}`
            : `Last opened ${new Date(recent.lastOpenedAt).toLocaleString()}`,
        })),
      }));

    if (!selectedFileId) {
      return false;
    }

    const selectedRecent = recents.find((recent) => recent.id === selectedFileId);

    try {
      return await openDriveProjectById(selectedFileId, selectedRecent?.name);
    } catch (error) {
      await showOpenDriveError("Open recent Drive file failed", error);

      if (
        await dialog.confirm({
          title: "Remove recent Drive file?",
          message: "Remove this file from the recent Drive file list?",
          confirmLabel: "Remove",
          danger: true,
        })
      ) {
        forgetDriveRecentFile(selectedFileId);
      }

      return false;
    }
  }

  async function openDriveFileByLink() {
    const driveInput = await dialog.prompt({
      title: "Open by Drive link",
      message: "Paste a Google Drive file URL or file ID.",
      confirmLabel: "Open",
    });

    if (driveInput === null) {
      return false;
    }

    const fileId = parseDriveFileId(driveInput);
    if (!fileId) {
      await dialog.alert({
        title: "Open by Drive link",
        message: "That does not look like a Google Drive file URL or file ID.",
      });
      return false;
    }

    try {
      return await openDriveProjectById(fileId);
    } catch (error) {
      await showOpenDriveError("Open by Drive link failed", error);
      return false;
    }
  }

  async function openPublicGallery() {
    try {
      const sources = await loadPublicGallerySources();
      const source = sources[0];

      if (!source) {
        await dialog.alert({
          title: "Open from Public Gallery",
          message: "No public gallery sources are configured.",
        });
        return false;
      }

      const files = await loadPublicGalleryFiles(source);

      if (files.length === 0) {
        await dialog.alert({
          title: "Open from Public Gallery",
          message:
            "Stickies Public Gallery is empty or unavailable. The Drive folder may be private, blocked by API key restrictions, or contain no published Stickies files.",
        });
        return false;
      }

      const selectedUrl = await dialog.choose({
        title: "Open from Public Gallery",
        message: "Choose a published Stickies file to open read-only.",
        confirmLabel: "Open",
        choices: files.map((file) => ({
          value: file.publicUrl,
          label: file.name,
          description: formatGalleryFileDescription(source.name, file),
        })),
      });

      if (!selectedUrl) {
        return false;
      }

      window.location.assign(selectedUrl);
      return true;
    } catch (error) {
      await dialog.alert({
        title: "Open from Public Gallery failed",
        message: error instanceof Error ? error.message : "The public gallery could not be loaded.",
      });
      return false;
    }
  }

  return {
    openDriveFileByLink,
    openDriveProjectById,
    openFromDrive,
    openPublicGallery,
    openRecentDriveFile,
  };
}
