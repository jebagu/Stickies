import type { ReactNode } from "react";
import { PanelRightOpen } from "lucide-react";
import { DriveAuthRedirectHandler } from "../drive/DriveAuthRedirectHandler";
import { DriveFileLinkPrompt } from "../drive/DriveFileLinkPrompt";
import { isPublicViewMode } from "../../lib/appMode";
import { useProjectStore } from "../../state/projectStore";
import { Button } from "../ui/Button";
import { DialogProvider } from "../ui/DialogProvider";
import { LeftSidebar } from "./LeftSidebar";
import { RightInspector } from "./RightInspector";
import { TabBar } from "./TabBar";
import { TopBar } from "./TopBar";
import { SettingsPage } from "../settings/SettingsPage";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const viewMode = useProjectStore((state) => state.viewMode);
  const inspectorHidden = useProjectStore((state) => state.inspectorHidden);
  const setInspectorHidden = useProjectStore((state) => state.setInspectorHidden);
  const { adminMode, presentationMode, themeId } = useProjectStore((state) => state.project.settings);
  const settingsActive = adminMode;
  const readOnly = isPublicViewMode(viewMode);
  const contentClassName = [
    "app-shell__content",
    presentationMode ? "app-shell__content--single-panel" : "",
    readOnly ? "app-shell__content--viewer" : "",
    inspectorHidden && !presentationMode ? "app-shell__content--inspector-hidden" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="app-shell" data-theme={themeId} data-view-mode={viewMode}>
      <DialogProvider>
        <DriveAuthRedirectHandler />
        <DriveFileLinkPrompt />
        <TopBar />
        <section className={presentationMode || readOnly ? "app-shell__workspace app-shell__workspace--single-panel" : "app-shell__workspace"}>
          {presentationMode || readOnly ? null : settingsActive ? (
            <aside className="left-sidebar" aria-hidden="true" />
          ) : (
            <LeftSidebar />
          )}
          <section className="app-shell__main-panel">
            <TabBar />
            <section className={contentClassName}>
              <div className="app-shell__canvas">{settingsActive ? <SettingsPage /> : children}</div>
              {presentationMode ? null : inspectorHidden ? (
                <Button
                  className="inspector-restore-button"
                  variant="secondary"
                  aria-label="Show inspector"
                  title="Show inspector"
                  onClick={() => setInspectorHidden(false)}
                >
                  <PanelRightOpen size={16} aria-hidden="true" />
                </Button>
              ) : settingsActive ? (
                <aside className="right-inspector" aria-hidden="true" />
              ) : (
                <RightInspector />
              )}
            </section>
          </section>
        </section>
      </DialogProvider>
    </main>
  );
}
