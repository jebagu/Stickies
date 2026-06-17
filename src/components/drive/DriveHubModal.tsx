import { useEffect, useState } from "react";
import { ExternalLink, Link2, RefreshCw, Trash2 } from "lucide-react";
import { loadLatestPublishedDriveSnapshot, type PublishedDriveSnapshot } from "../../lib/googleDrive/published";
import { forgetDriveRecentFile, loadDriveRecentFiles, type DriveRecentFile } from "../../lib/googleDrive/recents";
import {
  clearStickiesDriveFolder,
  loadStickiesDriveFolder,
  type StoredStickiesDriveFolder,
} from "../../lib/googleDrive/stickiesFolder";
import { useProjectStore } from "../../state/projectStore";
import { Button } from "../ui/Button";
import { useDialog } from "../ui/DialogProvider";
import { useDriveOpenActions } from "./useDriveOpenActions";
import { useDriveSaveActions } from "./useDriveSaveActions";

type DriveHubModalProps = {
  onClose: () => void;
  open: boolean;
};

function formatCloudStatus(status: ReturnType<typeof useProjectStore.getState>["cloudSaveStatus"]) {
  if (status === "saving") {
    return "Saving";
  }

  if (status === "saved") {
    return "Saved to Drive";
  }

  if (status === "error") {
    return "Drive save failed";
  }

  if (status === "read-only") {
    return "View-only Drive file";
  }

  return "Local only";
}

function formatDateTime(value: string | undefined) {
  return value ? new Date(value).toLocaleString() : "Not saved to Drive yet";
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export function DriveHubModal({ onClose, open }: DriveHubModalProps) {
  const dialog = useDialog();
  const { cloudError, cloudFile, cloudSaveStatus, lastCloudSavedAt, project } = useProjectStore();
  const { openDriveFileByLink, openRecentDriveFile } = useDriveOpenActions();
  const { saveAsToDrive, saveToDrive } = useDriveSaveActions();
  const [recents, setRecents] = useState<DriveRecentFile[]>([]);
  const [publishedSnapshot, setPublishedSnapshot] = useState<PublishedDriveSnapshot | undefined>();
  const [stickiesFolder, setStickiesFolder] = useState<StoredStickiesDriveFolder | undefined>();

  function refreshDriveLists() {
    setRecents(loadDriveRecentFiles());
    setPublishedSnapshot(loadLatestPublishedDriveSnapshot(project));
    setStickiesFolder(loadStickiesDriveFolder());
  }

  useEffect(() => {
    if (open) {
      refreshDriveLists();
    }
  }, [open, project]);

  if (!open) {
    return null;
  }

  async function runDriveAction(action: () => Promise<unknown>) {
    await action();
    refreshDriveLists();
  }

  async function copyPublishedLink() {
    if (!publishedSnapshot) {
      return;
    }

    try {
      await copyText(publishedSnapshot.publicUrl);
      await dialog.alert({
        title: "Copied public link",
        message: "The published link was copied.",
        copyText: publishedSnapshot.publicUrl,
      });
    } catch {
      await dialog.alert({
        title: "Copy failed",
        message: "Copy was blocked by the browser. Select the link below and copy it manually.",
        copyText: publishedSnapshot.publicUrl,
      });
    }
  }

  async function removeRecentFile(fileId: string) {
    forgetDriveRecentFile(fileId);
    refreshDriveLists();
  }

  function getStickiesFolderUrl() {
    return stickiesFolder?.webViewLink ?? (stickiesFolder ? `https://drive.google.com/drive/folders/${stickiesFolder.id}` : undefined);
  }

  async function forgetStickiesFolder() {
    if (
      await dialog.confirm({
        title: "Forget Stickies folder?",
        message: "Stickies will forget this saved folder on this browser. Existing Drive files will not be deleted.",
        confirmLabel: "Forget Folder",
        danger: true,
      })
    ) {
      clearStickiesDriveFolder();
      refreshDriveLists();
    }
  }

  return (
    <div className="dialog-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="drive-hub" role="dialog" aria-modal="true" aria-labelledby="drive-hub-title">
        <header className="drive-hub__header">
          <div>
            <h2 id="drive-hub-title">Google Drive</h2>
            <p>Save this Stickies project and reopen recent Drive files.</p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </header>

        <div className="drive-hub__grid">
          <section className="drive-hub__card">
            <div className="drive-hub__section-heading">
              <span>Current file</span>
              <strong>{formatCloudStatus(cloudSaveStatus)}</strong>
            </div>
            <p className="drive-hub__file-name">{cloudFile?.name ?? "Local project only"}</p>
            <p className="meta-copy">{formatDateTime(lastCloudSavedAt)}</p>
            {cloudError ? <p className="drive-hub__error">{cloudError}</p> : null}
            <div className="drive-hub__link-actions">
              <Button variant="primary" onClick={() => runDriveAction(saveToDrive)}>
                Save
              </Button>
              {cloudFile?.webViewLink ? (
                <Button onClick={() => window.open(cloudFile.webViewLink, "_blank", "noopener,noreferrer")}>
                  <ExternalLink size={14} aria-hidden="true" />
                  Open in Drive
                </Button>
              ) : null}
            </div>
          </section>

          <section className="drive-hub__card">
            <div className="drive-hub__section-heading">
              <span>Stickies folder</span>
            </div>
            {stickiesFolder ? (
              <>
                <p className="drive-hub__file-name">Using: {stickiesFolder.name} in My Drive</p>
                <p className="meta-copy">Saved on {new Date(stickiesFolder.savedAt).toLocaleString()}</p>
                <div className="drive-hub__link-actions">
                  {getStickiesFolderUrl() ? (
                    <Button onClick={() => window.open(getStickiesFolderUrl(), "_blank", "noopener,noreferrer")}>
                      <ExternalLink size={14} aria-hidden="true" />
                      Open Folder
                    </Button>
                  ) : null}
                  <Button onClick={forgetStickiesFolder}>Forget Folder</Button>
                </div>
              </>
            ) : (
              <p className="meta-copy">First Save to Drive will ask to create a Stickies folder in My Drive.</p>
            )}
          </section>

          <section className="drive-hub__card">
            <div className="drive-hub__section-heading">
              <span>Recent files</span>
              <button className="drive-hub__icon-button" type="button" onClick={refreshDriveLists} aria-label="Refresh recent files">
                <RefreshCw size={14} aria-hidden="true" />
              </button>
            </div>
            {recents.length ? (
              <div className="drive-hub__recent-list">
                {recents.map((recent) => (
                  <div key={recent.id} className="drive-hub__recent-row">
                    <button type="button" onClick={() => runDriveAction(() => openRecentDriveFile(recent.id))}>
                      <strong>{recent.name}</strong>
                      <small>{recent.modifiedTime ? `Modified ${new Date(recent.modifiedTime).toLocaleString()}` : `Last opened ${new Date(recent.lastOpenedAt).toLocaleString()}`}</small>
                    </button>
                    <button className="drive-hub__icon-button" type="button" onClick={() => removeRecentFile(recent.id)} aria-label={`Remove ${recent.name}`}>
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="meta-copy">No recent Drive files yet.</p>
            )}
          </section>

          <section className="drive-hub__card">
            <div className="drive-hub__section-heading">
              <span>Advanced</span>
            </div>
            <div className="drive-hub__actions">
              <Button onClick={() => runDriveAction(saveAsToDrive)}>Save Copy</Button>
              <Button onClick={() => runDriveAction(openDriveFileByLink)}>Open by Link/ID</Button>
            </div>
          </section>

          <section className="drive-hub__card">
            <div className="drive-hub__section-heading">
              <span>Published link</span>
            </div>
            {publishedSnapshot ? (
              <div className="drive-hub__published">
                <p className="drive-hub__file-name">{publishedSnapshot.name}</p>
                <textarea readOnly value={publishedSnapshot.publicUrl} onFocus={(event) => event.currentTarget.select()} />
                <div className="drive-hub__link-actions">
                  <Button onClick={() => window.open(publishedSnapshot.publicUrl, "_blank", "noopener,noreferrer")}>
                    <ExternalLink size={14} aria-hidden="true" />
                    Open Link
                  </Button>
                  <Button onClick={copyPublishedLink}>
                    <Link2 size={14} aria-hidden="true" />
                    Copy Link
                  </Button>
                </div>
                <p className="meta-copy">Hosted viewer links work after the current Stickies app is deployed to GitHub Pages.</p>
              </div>
            ) : (
              <p className="meta-copy">No public Drive snapshot has been published from this browser project yet.</p>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
