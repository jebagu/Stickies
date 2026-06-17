import {
  beginGoogleDriveRedirectAuthorization,
  forgetGoogleDriveAccessToken,
  getGoogleDriveAccessToken,
  hasUsableGoogleDriveAccessToken,
  isGoogleDriveRedirectFallbackError,
  type PendingGoogleDriveAction,
} from "../../lib/googleDrive/auth";
import {
  GOOGLE_DRIVE_PICKER_KEY_HELP_MESSAGE,
  getGoogleDriveConfigIssue,
  isGoogleDriveConfigured,
} from "../../lib/googleDrive/config";
import {
  createStickiesDriveFolder,
  createStickiesDriveFile,
  ensureStickiesFileName,
  isDriveAuthError,
  toDriveCloudFile,
  updateStickiesDriveFile,
  validateStickiesDriveFolder,
} from "../../lib/googleDrive/driveClient";
import { rememberDriveRecentFile } from "../../lib/googleDrive/recents";
import {
  clearStickiesDriveFolder,
  loadStickiesDriveFolder,
  saveStickiesDriveFolder,
  toStoredStickiesDriveFolder,
  type StoredStickiesDriveFolder,
} from "../../lib/googleDrive/stickiesFolder";
import { useProjectStore } from "../../state/projectStore";
import { useDialog } from "../ui/DialogProvider";

function getGoogleDriveUnavailableMessage() {
  const issue = getGoogleDriveConfigIssue();
  return issue ? `${issue}\n\n${GOOGLE_DRIVE_PICKER_KEY_HELP_MESSAGE}` : GOOGLE_DRIVE_PICKER_KEY_HELP_MESSAGE;
}

const BROWSER_COPY_SAFE_MESSAGE = "Your browser copy is still safe.";

function getDriveSaveErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return `${error.message}\n\n${BROWSER_COPY_SAFE_MESSAGE}`;
  }

  return `Stickies could not save the project file. ${BROWSER_COPY_SAFE_MESSAGE}`;
}

function getStickiesFolderUrl(folder: StoredStickiesDriveFolder) {
  return folder.webViewLink ?? `https://drive.google.com/drive/folders/${encodeURIComponent(folder.id)}`;
}

export function useDriveSaveActions() {
  const dialog = useDialog();

  async function getAccessTokenForDriveAction(action: PendingGoogleDriveAction, options: { forcePrompt?: boolean } = {}) {
    if (options.forcePrompt || !hasUsableGoogleDriveAccessToken()) {
      beginGoogleDriveRedirectAuthorization(action);
    }

    try {
      return await getGoogleDriveAccessToken(options);
    } catch (error) {
      if (isGoogleDriveRedirectFallbackError(error)) {
        beginGoogleDriveRedirectAuthorization(action);
      }

      throw error;
    }
  }

  async function runWithDriveToken<T>(
    action: PendingGoogleDriveAction,
    operation: (accessToken: string) => Promise<T>,
    initialAccessToken?: string,
  ) {
    const accessToken = initialAccessToken ?? (await getAccessTokenForDriveAction(action));

    try {
      return await operation(accessToken);
    } catch (error) {
      if (!isDriveAuthError(error)) {
        throw error;
      }

      forgetGoogleDriveAccessToken();
      const refreshedAccessToken = await getAccessTokenForDriveAction(action, { forcePrompt: true });
      return operation(refreshedAccessToken);
    }
  }

  async function validateRememberedStickiesFolder(
    action: PendingGoogleDriveAction,
    accessToken: string,
    options: { showProgress?: boolean } = {},
  ): Promise<StoredStickiesDriveFolder | undefined> {
    const rememberedFolder = loadStickiesDriveFolder();

    if (!rememberedFolder) {
      return undefined;
    }

    const progress = options.showProgress
      ? dialog.progress({
          title: "Checking Stickies folder",
          message: "Confirming that the saved Stickies folder is still available.",
        })
      : undefined;

    try {
      const metadata = await runWithDriveToken(
        action,
        (token) => validateStickiesDriveFolder(token, rememberedFolder.id),
        accessToken,
      );
      const folder = toStoredStickiesDriveFolder(metadata, rememberedFolder.savedAt);
      saveStickiesDriveFolder(folder);
      return folder;
    } catch {
      clearStickiesDriveFolder();
      await dialog.alert({
        title: "Stickies folder not found",
        message:
          "The saved Stickies folder could not be reached. It may have been deleted, moved, or your Google session may not have access to it.",
      });
      return undefined;
    } finally {
      progress?.close();
    }
  }

  async function confirmCreateStickiesFolder() {
    return dialog.confirm({
      title: "Create Stickies folder?",
      message:
        'Stickies will create a folder named "Stickies" at the top level of My Drive and save this project there. Future Stickies files will use that folder automatically.',
      confirmLabel: "Create Folder and Save",
    });
  }

  async function createStickiesFolderForSave(accessToken: string, progress?: ReturnType<typeof dialog.progress>) {
    if (!(await confirmCreateStickiesFolder())) {
      return undefined;
    }

    const activeProgress =
      progress ??
      dialog.progress({
        title: "Saving to Google Drive",
        message: "Saving to Google Drive...",
      });

    activeProgress.update({
      title: "Saving to Google Drive",
      message: "Creating the Stickies folder in My Drive.",
    });

    try {
      const folderMetadata = await runWithDriveToken("save-as", createStickiesDriveFolder, accessToken);
      const folder = toStoredStickiesDriveFolder(folderMetadata);
      saveStickiesDriveFolder(folder);
      return folder;
    } catch (error) {
      activeProgress.close();
      useProjectStore.getState().setCloudSaveStatus("error");
      useProjectStore.getState().setCloudError(error instanceof Error ? error.message : "Stickies could not create the Drive folder.");
      await dialog.alert({
        title: "Create Stickies folder failed",
        message: `Stickies could not create the Drive folder. ${BROWSER_COPY_SAFE_MESSAGE}`,
      });
      return undefined;
    } finally {
      if (!progress) {
        activeProgress.close();
      }
    }
  }

  async function getOrCreateStickiesFolderForSave(
    action: PendingGoogleDriveAction,
    accessToken: string,
    progress?: ReturnType<typeof dialog.progress>,
  ) {
    const folder = await validateRememberedStickiesFolder(action, accessToken, { showProgress: !progress });

    if (folder) {
      return folder;
    }

    return createStickiesFolderForSave(accessToken, progress);
  }

  async function saveAsToDrive(options: { accessToken?: string } = {}) {
    if (!isGoogleDriveConfigured()) {
      await dialog.alert({
        title: "Save to Google Drive",
        message: getGoogleDriveUnavailableMessage(),
      });
      return;
    }

    try {
      const accessToken = options.accessToken ?? (await getAccessTokenForDriveAction("save-as"));
      const { project, setCloudError, setCloudFile, setCloudSaveStatus } = useProjectStore.getState();
      const requestedName = await dialog.prompt({
        title: "Save to Google Drive",
        message: "Name this Stickies project file.",
        defaultValue: ensureStickiesFileName(project.projectName),
        confirmLabel: "Save to Google Drive",
      });

      if (requestedName === null) {
        return;
      }

      setCloudSaveStatus("saving");
      setCloudError(undefined);
      const folder = await getOrCreateStickiesFolderForSave("save-as", accessToken);

      if (!folder) {
        setCloudSaveStatus("local");
        return;
      }

      const progress = dialog.progress({
        title: "Saving to Google Drive",
        message: "Saving to Google Drive...",
      });

      progress.update({
        title: "Saving to Google Drive",
        message: "Saving the project file in your Stickies folder.",
      });

      let metadata;
      try {
        metadata = await runWithDriveToken(
          "save-as",
          (token) => createStickiesDriveFile(token, requestedName, project, folder.id),
          accessToken,
        );
      } catch (error) {
        progress.close();
        throw error;
      }

      progress.close();
      const cloudFile = toDriveCloudFile(metadata, { folderName: folder.name });
      setCloudFile(cloudFile);
      rememberDriveRecentFile(cloudFile);

      await dialog.alert({
        title: "Saved to Google Drive",
        message: `Saved "${cloudFile.name}" in your Stickies folder.`,
        copyLabel: cloudFile.webViewLink ? "Copy Link" : undefined,
        copyText: cloudFile.webViewLink,
        openLabel: "Open Folder in Drive",
        openUrl: getStickiesFolderUrl(folder),
      });
    } catch (error) {
      if (isGoogleDriveRedirectFallbackError(error)) {
        return;
      }

      useProjectStore.getState().setCloudSaveStatus("error");
      useProjectStore.getState().setCloudError(error instanceof Error ? error.message : "The project could not be saved to Google Drive.");
      await dialog.alert({
        title: "Save to Google Drive failed",
        message: getDriveSaveErrorMessage(error),
      });
    }
  }

  async function saveToDrive(options: { accessToken?: string } = {}) {
    const { cloudFile, project, setCloudError, setCloudFile, setCloudSaveStatus } = useProjectStore.getState();

    if (!cloudFile) {
      await saveAsToDrive(options);
      return;
    }

    if (!cloudFile.canEdit) {
      setCloudSaveStatus("read-only");
      await dialog.alert({
        title: "View-only Drive file",
        message: "This Drive file is view-only. Save a copy to your Stickies folder to edit it.",
      });
      await saveAsToDrive(options);
      return;
    }

    let progress: ReturnType<typeof dialog.progress> | undefined;

    try {
      setCloudSaveStatus("saving");
      setCloudError(undefined);
      progress = dialog.progress({
        title: "Saving to Google Drive",
        message: "Saving to Google Drive...",
      });
      const accessToken = options.accessToken ?? (await getAccessTokenForDriveAction("save-existing"));
      const folder = await getOrCreateStickiesFolderForSave("save-existing", accessToken, progress);

      if (!folder) {
        progress.close();
        setCloudSaveStatus("saved");
        return;
      }

      progress.update({
        title: "Saving to Google Drive",
        message: "Updating the project file in Google Drive.",
      });
      const metadata = await runWithDriveToken(
        "save-existing",
        (token) => updateStickiesDriveFile(token, cloudFile.id, project),
        accessToken,
      );
      progress.close();
      const updatedCloudFile = toDriveCloudFile(metadata, { folderName: cloudFile.folderName });
      setCloudFile(updatedCloudFile);
      rememberDriveRecentFile(updatedCloudFile);
      await dialog.alert({
        title: "Saved to Google Drive",
        message: `Saved "${updatedCloudFile.name}" to Google Drive.`,
        copyLabel: updatedCloudFile.webViewLink ? "Copy Link" : undefined,
        copyText: updatedCloudFile.webViewLink,
        openLabel: "Open Folder in Drive",
        openUrl: getStickiesFolderUrl(folder),
      });
    } catch (error) {
      progress?.close();

      if (isGoogleDriveRedirectFallbackError(error)) {
        return;
      }

      const message = error instanceof Error ? error.message : "The project could not be saved to Google Drive.";
      setCloudError(message);
      await dialog.alert({
        title: "Save to Google Drive failed",
        message: `${message}\n\n${BROWSER_COPY_SAFE_MESSAGE}`,
      });
    }
  }

  async function resumeDriveSaveFromRedirect(action: PendingGoogleDriveAction, accessToken: string) {
    if (action === "save-existing") {
      await saveToDrive({ accessToken });
      return;
    }

    await saveAsToDrive({ accessToken });
  }

  return {
    saveAsToDrive,
    saveToDrive,
    resumeDriveSaveFromRedirect,
  };
}
