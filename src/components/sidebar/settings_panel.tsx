import { useState } from "react";
import { useThemeStore, type ResolvedTheme, type ThemePreference } from "../../store/themeStore";
import "./settings_panel.css";

interface SettingsPanelProps {
  onDone: () => void;
}

export default function SettingsPanel({ onDone }: SettingsPanelProps) {
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  const setResolvedTheme = useThemeStore((state) => state.setResolvedTheme);
  const [localPref, setLocalPref] = useState<ThemePreference>(preference);

  const themeOptions: Array<{
    value: ThemePreference;
    label: string;
    description: string;
    preview: ResolvedTheme | null;
  }> = [
    { value: "system", label: "System", description: "Follow the operating system theme.", preview: null },
    { value: "light", label: "Light", description: "Bright, low-contrast workspace.", preview: "light" },
    { value: "dark", label: "Dark", description: "Classic dark editor styling.", preview: "dark" },
    { value: "ocean", label: "Ocean", description: "Deep blue palette with cool accents.", preview: "ocean" },
    { value: "dracula", label: "Dracula", description: "Purple-on-charcoal theme with high contrast.", preview: "dracula" },
    { value: "sage", label: "Sage", description: "Muted forest green palette with calm, natural tones.", preview: "sage" },
    { value: "caffeine", label: "Caffeine", description: "Warm coffee tones - cream, espresso, and mocha accents.", preview: "caffeine" }
  ];

  // Keep local copy so changes only persist on Done
  const selectPref = (p: ThemePreference) => {
    setLocalPref(p);
    // Preview immediately
    const option = themeOptions.find((entry) => entry.value === p);

    if (option?.preview) {
      setResolvedTheme(option.preview);
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
        {themeOptions.map((option) => (
          <button
            key={option.value}
            className={`settings-option${localPref === option.value ? " active" : ""}`}
            onClick={() => selectPref(option.value)}
          >
            <span className="settings-option-label">{option.label}</span>
            <span className="settings-option-description">{option.description}</span>
          </button>
        ))}
      </div>

      <div className="settings-panel-footer">
        <button className="settings-done-button" onClick={handleDone}>
          Done
        </button>
      </div>
    </div>
  );
}
