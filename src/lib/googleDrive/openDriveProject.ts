import type { ProjectFile } from "../../types/planning";
import { parseProjectJsonText } from "../exportImport";
import { forgetGoogleDriveAccessToken, getGoogleDriveAccessToken } from "./auth";
import {
  downloadFileText,
  getFileMetadata,
  isDriveAuthError,
  toDriveCloudFile,
  type DriveCloudFile,
  type DriveFileMetadata,
} from "./driveClient";

export type DriveProjectLoadResult = {
  project: ProjectFile;
  metadata: DriveFileMetadata;
  cloudFile: DriveCloudFile;
};

async function runWithDriveToken<T>(operation: (accessToken: string) => Promise<T>) {
  const accessToken = await getGoogleDriveAccessToken();

  try {
    return await operation(accessToken);
  } catch (error) {
    if (!isDriveAuthError(error)) {
      throw error;
    }

    forgetGoogleDriveAccessToken();
    const refreshedAccessToken = await getGoogleDriveAccessToken({ forcePrompt: true });
    return operation(refreshedAccessToken);
  }
}

export async function loadDriveProject(fileId: string, sourceName?: string): Promise<DriveProjectLoadResult> {
  const { metadata, text } = await runWithDriveToken(async (accessToken) => {
    const fileMetadata = await getFileMetadata(fileId, accessToken);

    if (fileMetadata.capabilities?.canDownload === false) {
      throw new Error("This Google Drive file cannot be downloaded by your account.");
    }

    return {
      metadata: fileMetadata,
      text: await downloadFileText(fileId, accessToken),
    };
  });
  const result = parseProjectJsonText(text, sourceName ?? metadata.name);

  if (!result.ok) {
    throw new Error(`This is not a Stickies project file.\n\n${result.error}`);
  }

  return {
    project: result.project,
    metadata,
    cloudFile: toDriveCloudFile(metadata),
  };
}
