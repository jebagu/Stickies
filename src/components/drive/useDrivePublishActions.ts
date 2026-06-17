import {
  beginGoogleDriveRedirectAuthorization,
  forgetGoogleDriveAccessToken,
  getGoogleDriveAccessToken,
  hasUsableGoogleDriveAccessToken,
  isGoogleDriveRedirectFallbackError,
} from "../../lib/googleDrive/auth";
import {
  GOOGLE_DRIVE_PICKER_KEY_HELP_MESSAGE,
  getGoogleDriveConfigIssue,
  isGoogleDriveConfigured,
} from "../../lib/googleDrive/config";
import {
  createStickiesDriveFolder,
  ensureStickiesFileName,
  findExistingStickiesDriveFolder,
  isDriveAuthError,
  validateStickiesDriveFolder,
} from "../../lib/googleDrive/driveClient";
import { rememberPublishedDriveSnapshot } from "../../lib/googleDrive/published";
import {
  clearStickiesDriveFolder,
  loadStickiesDriveFolder,
  saveStickiesDriveFolder,
  toStoredStickiesDriveFolder,
  type StoredStickiesDriveFolder,
} from "../../lib/googleDrive/stickiesFolder";
import { publishProjectSnapshotToDrive } from "../../lib/publish";
import { useProjectStore } from "../../state/projectStore";
import { useDialog } from "../ui/DialogProvider";

function getGoogleDriveUnavailableMessage() {
  const issue = getGoogleDriveConfigIssue();
  return issue ? `${issue}\n\n${GOOGLE_DRIVE_PICKER_KEY_HELP_MESSAGE}` : GOOGLE_DRIVE_PICKER_KEY_HELP_MESSAGE;
}

function getDefaultPublishFileName(projectName: string) {
  const date = new Date().toISOString().slice(0, 10);
  return ensureStickiesFileName(`${projectName || "Stickies project"} published ${date}`);
}

export function useDrivePublishActions() {
  const dialog = useDialog();

  async function getAccessTokenForPublish(options: { forcePrompt?: boolean } = {}) {
    if (options.forcePrompt || !hasUsableGoogleDriveAccessToken()) {
      beginGoogleDriveRedirectAuthorization("publish");
    }

    try {
      return await getGoogleDriveAccessToken(options);
    } catch (error) {
      if (isGoogleDriveRedirectFallbackError(error)) {
        beginGoogleDriveRedirectAuthorization("publish");
      }

      throw error;
    }
  }

  async function runWithDriveToken<T>(operation: (accessToken: string) => Promise<T>, initialAccessToken?: string) {
    const accessToken = initialAccessToken ?? (await getAccessTokenForPublish());

    try {
      return await operation(accessToken);
    } catch (error) {
      if (!isDriveAuthError(error)) {
        throw error;
      }

      forgetGoogleDriveAccessToken();
      const refreshedAccessToken = await getAccessTokenForPublish({ forcePrompt: true });
      return operation(refreshedAccessToken);
    }
  }

  async function validateRememberedStickiesFolder(accessToken: string): Promise<StoredStickiesDriveFolder | undefined> {
    const rememberedFolder = loadStickiesDriveFolder();

    if (!rememberedFolder) {
      return undefined;
    }

    const progress = dialog.progress({
      title: "Checking Stickies folder",
      message: "Confirming that the saved Stickies folder is still available.",
    });

    try {
      const metadata = await runWithDriveToken(
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
      progress.close();
    }
  }

  async function getStickiesFolderForPublish(accessToken: string) {
    const rememberedFolder = await validateRememberedStickiesFolder(accessToken);

    if (rememberedFolder) {
      return rememberedFolder;
    }

    const lookupProgress = dialog.progress({
      title: "Checking Stickies folder",
      message: "Looking for an existing Stickies folder in My Drive.",
    });
    let lookupProgressClosed = false;

    try {
      const existingFolder = await runWithDriveToken(findExistingStickiesDriveFolder, accessToken);

      if (existingFolder) {
        const folder = toStoredStickiesDriveFolder(existingFolder.folder);
        saveStickiesDriveFolder(folder);
        lookupProgress.close();
        lookupProgressClosed = true;
        await dialog.alert({
          title: "Existing Stickies folder found",
          message:
            existingFolder.matchCount > 1
              ? `Found ${existingFolder.matchCount} existing Stickies folders in My Drive. Stickies will use "${folder.name}" and will not create another folder.`
              : `Found your existing "${folder.name}" folder in My Drive. Stickies will publish there and will not create another folder.`,
        });
        return folder;
      }
    } finally {
      if (!lookupProgressClosed) {
        lookupProgress.close();
      }
    }

    if (
      !(await dialog.confirm({
        title: "Create Stickies folder?",
        message:
          'Stickies did not find an existing top-level "Stickies" folder it can use. It can create one in My Drive and save this published snapshot there. Future Stickies files will use that folder automatically.',
        confirmLabel: "Create Folder and Publish",
      }))
    ) {
      return undefined;
    }

    const progress = dialog.progress({
      title: "Publishing to Google Drive",
      message: "Creating the Stickies folder in My Drive.",
    });

    try {
      const folderMetadata = await runWithDriveToken(createStickiesDriveFolder, accessToken);
      const folder = toStoredStickiesDriveFolder(folderMetadata);
      saveStickiesDriveFolder(folder);
      return folder;
    } finally {
      progress.close();
    }
  }

  async function publishToDrive(options: { accessToken?: string } = {}) {
    if (!isGoogleDriveConfigured()) {
      await dialog.alert({
        title: "Publish to Drive",
        message: getGoogleDriveUnavailableMessage(),
      });
      return;
    }

    try {
      const accessToken = options.accessToken ?? (await getAccessTokenForPublish());
      const { project } = useProjectStore.getState();
      const requestedName = await dialog.prompt({
        title: "Publish to Drive",
        message:
          "Name this separate frozen read-only snapshot. Stickies will save it in your Stickies folder and create a public viewer link. Later edits will not update this published version.",
        defaultValue: getDefaultPublishFileName(project.projectName),
        confirmLabel: "Publish Snapshot",
      });

      if (requestedName === null) {
        return;
      }

      const folder = await getStickiesFolderForPublish(accessToken);

      if (!folder) {
        return;
      }

      const progress = dialog.progress({
        title: "Publishing to Google Drive",
        message: "Saving the public snapshot in your Stickies folder.",
      });

      let result;
      try {
        result = await runWithDriveToken(
          (token) =>
            publishProjectSnapshotToDrive({
              accessToken: token,
              name: requestedName,
              folderId: folder.id,
              project,
            }),
          accessToken,
        );
      } catch (error) {
        progress.close();
        throw error;
      }

      progress.close();

      rememberPublishedDriveSnapshot(project, result.file, result.publicUrl);

      await dialog.alert({
        title: "Published read-only snapshot",
        message: `Published "${result.file.name}". Share this public Stickies viewer link.`,
        copyLabel: "Copy Link",
        copyText: result.publicUrl,
        openLabel: "Open Link",
        openUrl: result.publicUrl,
      });
      return result;
    } catch (error) {
      if (isGoogleDriveRedirectFallbackError(error)) {
        return undefined;
      }

      await dialog.alert({
        title: "Publish failed",
        message: error instanceof Error ? error.message : "The snapshot could not be published to Google Drive.",
      });
      return undefined;
    }
  }

  async function resumeDrivePublishFromRedirect(accessToken: string) {
    await publishToDrive({ accessToken });
  }

  return {
    publishToDrive,
    resumeDrivePublishFromRedirect,
  };
}
