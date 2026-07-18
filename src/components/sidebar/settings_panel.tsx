import { useState } from "react";
import { useThemeStore } from "../../store/themeStore";
import "./settings_panel.css";

interface SettingsPanelProps {
  onDone: () => void;
}

export default function SettingsPanel({ onDone }: SettingsPanelProps) {
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  const setResolvedTheme = useThemeStore((state) => state.setResolvedTheme);
  const [localPref, setLocalPref] = useState<typeof preference>(preference);

  // Keep local copy so changes only persist on Done
  const selectPref = (p: typeof preference) => {
    setLocalPref(p);
    // Preview immediately
    if (p === "light") {
      setResolvedTheme("light");
    } else if (p === "dark") {
      setResolvedTheme("dark");
    } else {
      // system
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      setResolvedTheme(mq.matches ? "dark" : "light");
    }
  };

  const handleDone = () => {
    setPreference(localPref);
    onDone();
  };

  return (
    <div className="settings-panel">
      <div className="settings-panel-header">
        <h2>Appearance</h2>
        <p>Choose your theme preference. System will follow your OS setting.</p>
      </div>

      <div className="settings-panel-content">
        <button
          className={`settings-option${localPref === "light" ? " active" : ""}`}
          onClick={() => selectPref("light")}
        >
          Light
        </button>
        <button
          className={`settings-option${localPref === "dark" ? " active" : ""}`}
          onClick={() => selectPref("dark")}
        >
          Dark
        </button>
        <button
          className={`settings-option${localPref === "system" ? " active" : ""}`}
          onClick={() => selectPref("system")}
        >
          System
        </button>
      </div>

      <div className="settings-panel-footer">
        <button className="settings-done-button" onClick={handleDone}>
          Done
        </button>
      </div>
    </div>
  );
}
