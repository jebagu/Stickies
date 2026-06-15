import type { CSSProperties } from "react";
import { Lock, Monitor, Presentation, Settings, Unlock } from "lucide-react";
import { isPublicViewMode } from "../../lib/appMode";
import { isGeneratedGraphTab } from "../../lib/generatedGraph";
import {
  EDGE_ROUTING_OPTIONS,
  NODE_HANDLE_OPTIONS,
  THEME_OPTIONS,
  formatEdgeRoutingLabel,
  formatNodeHandleModeLabel,
  formatThemeLabel,
} from "../../lib/options";
import { useProjectStore } from "../../state/projectStore";
import type { EdgeRoutingMode, NodeHandleMode } from "../../types/planning";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { Toggle } from "../ui/Toggle";

const logoMaskStyle = {
  "--top-bar-logo-url": `url("${import.meta.env.BASE_URL}favicon.svg")`,
} as CSSProperties;

export function TopBar() {
  const {
    project,
    viewMode,
    setEdgeRoutingMode,
    setNodeHandleMode,
    setTheme,
    toggleAdminMode,
    toggleGeneratedLayoutLock,
    toggleMiniMap,
    togglePresentationMode,
  } = useProjectStore();
  const presentationMode = project.settings.presentationMode;
  const readOnly = isPublicViewMode(viewMode);
  const activeTab = project.tabs.find((tab) => tab.id === project.activeTabId) ?? project.tabs[0];
  const generatedTab = isGeneratedGraphTab(activeTab);
  const generatedLayoutUnlocked = project.settings.readOnlyGeneratedTabs === false;

  return (
    <header className="top-bar">
      <div className="top-bar__title">
        <div className="top-bar__brand">
          <span className="top-bar__logo" style={logoMaskStyle} aria-hidden="true" />
          <h1>Stickies</h1>
        </div>
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
        {readOnly ? null : (
          <Select
            aria-label="Arrow paths"
            value={project.settings.edgeRoutingMode ?? "bezier"}
            onChange={(event) => setEdgeRoutingMode(event.target.value as EdgeRoutingMode)}
          >
            {EDGE_ROUTING_OPTIONS.map((routingMode) => (
              <option key={routingMode} value={routingMode}>
                {formatEdgeRoutingLabel(routingMode)}
              </option>
            ))}
          </Select>
        )}
        {readOnly ? null : (
          <Select
            aria-label="Handles"
            value={project.settings.nodeHandleMode ?? "side"}
            onChange={(event) => setNodeHandleMode(event.target.value as NodeHandleMode)}
          >
            {NODE_HANDLE_OPTIONS.map((handleMode) => (
              <option key={handleMode} value={handleMode}>
                {formatNodeHandleModeLabel(handleMode)}
              </option>
            ))}
          </Select>
        )}
        {generatedTab && !readOnly ? (
          <Button
            variant={generatedLayoutUnlocked ? "primary" : "secondary"}
            onClick={toggleGeneratedLayoutLock}
            title={generatedLayoutUnlocked ? "Lock generated node positions" : "Unlock generated node positions"}
          >
            {generatedLayoutUnlocked ? <Unlock size={16} aria-hidden="true" /> : <Lock size={16} aria-hidden="true" />}
            {generatedLayoutUnlocked ? "Layout Unlocked" : "Unlock Layout"}
          </Button>
        ) : null}
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
