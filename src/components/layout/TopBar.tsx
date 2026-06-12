import type { CSSProperties } from "react";
import { Monitor, Presentation, Settings } from "lucide-react";
import { isPublicViewMode } from "../../lib/appMode";
import { THEME_OPTIONS, formatThemeLabel } from "../../lib/options";
import { useProjectStore } from "../../state/projectStore";
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
    setTheme,
    toggleAdminMode,
    toggleMiniMap,
    togglePresentationMode,
  } = useProjectStore();
  const presentationMode = project.settings.presentationMode;
  const readOnly = isPublicViewMode(viewMode);

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
