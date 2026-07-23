import { useState } from "react";
import { useThemeStore, type ThemePreference, type ResolvedTheme } from "../../store/themeStore";
import { useSettingsStore } from "../../store/settingsStore";
import { Settings, Bot, Palette, Keyboard, X } from 'lucide-react';
import "./Preferences.css";

type PreferencesTab = "general" | "ai-config" | "appearance" | "hotkeys";

interface PreferencesProps {
  onClose: () => void;
}

export default function Preferences({ onClose }: PreferencesProps) {
  const [activeTab, setActiveTab] = useState<PreferencesTab>("general");
  
  // Settings store
  const currentVersion = useSettingsStore((state) => state.currentVersion);
  const autoSave = useSettingsStore((state) => state.autoSave);
  const enableTerminalGuardrails = useSettingsStore((state) => state.enableTerminalGuardrails);
  const setAutoSave = useSettingsStore((state) => state.setAutoSave);
  const setEnableTerminalGuardrails = useSettingsStore((state) => state.setEnableTerminalGuardrails);
  
  // Theme store
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

  const selectThemePref = (p: ThemePreference) => {
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

  const handleSave = () => {
    setPreference(localPref);
    // Settings are saved automatically via Zustand persist
    onClose();
  };

  const handleCheckForUpdates = () => {
    // Tauri auto-updater functionality
    console.log("Checking for updates...");
    // This would connect to Tauri's auto-updater in a real implementation
    alert("Update check would be implemented with Tauri auto-updater");
  };

  return (
    <div className="preferences-container">
      {/* Header Bar */}
      <div className="preferences-header">
        <div className="preferences-header-content">
          <Settings size={20} className="preferences-icon" />
          <h2 className="preferences-title">Preferences</h2>
        </div>
        <button className="preferences-close-button" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="preferences-content">
        {/* Left Navigation Sidebar */}
        <div className="preferences-navbar">
          <nav className="preferences-nav">
            <button 
              className={`preferences-nav-item${activeTab === "general" ? " active" : ""}`}
              onClick={() => setActiveTab("general")}
            >
              <Settings size={18} className="preferences-nav-icon" />
              <span className="preferences-nav-label">General</span>
            </button>
            
            <button 
              className={`preferences-nav-item${activeTab === "ai-config" ? " active" : ""}`}
              onClick={() => setActiveTab("ai-config")}
            >
              <Bot size={18} className="preferences-nav-icon" />
              <span className="preferences-nav-label">AI Config</span>
            </button>
            
            <button 
              className={`preferences-nav-item${activeTab === "appearance" ? " active" : ""}`}
              onClick={() => setActiveTab("appearance")}
            >
              <Palette size={18} className="preferences-nav-icon" />
              <span className="preferences-nav-label">Appearance</span>
            </button>
            
            <button 
              className={`preferences-nav-item${activeTab === "hotkeys" ? " active" : ""}`}
              onClick={() => setActiveTab("hotkeys")}
            >
              <Keyboard size={18} className="preferences-nav-icon" />
              <span className="preferences-nav-label">Hotkeys</span>
            </button>
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="preferences-main">
          {activeTab === "general" && (
            <div className="preferences-section">
              {/* Updates Section */}
              <div className="preferences-section-header">
                <h3>Updates</h3>
              </div>
              <div className="preferences-section-content">
                <div className="preferences-setting">
                  <div className="preferences-setting-info">
                    <span className="preferences-setting-label">Current Version</span>
                    <span className="preferences-setting-value">{currentVersion}</span>
                  </div>
                </div>
                <button 
                  className="preferences-button" 
                  onClick={handleCheckForUpdates}
                >
                  Check for Updates
                </button>
                <p className="preferences-setting-description">
                  Tauri Auto-Updater functionality
                </p>
              </div>

              {/* General Settings Section */}
              <div className="preferences-section-header">
                <h3>General</h3>
              </div>
              <div className="preferences-section-content">
                <div className="preferences-setting">
                  <label className="preferences-checkbox">
                    <input 
                      type="checkbox" 
                      checked={autoSave} 
                      onChange={(e) => setAutoSave(e.target.checked)}
                    />
                    <span className="preferences-checkbox-label">
                      Auto-save files on change
                    </span>
                  </label>
                </div>
                
                <div className="preferences-setting">
                  <label className="preferences-checkbox">
                    <input 
                      type="checkbox" 
                      checked={enableTerminalGuardrails} 
                      onChange={(e) => setEnableTerminalGuardrails(e.target.checked)}
                    />
                    <span className="preferences-checkbox-label">
                      Enable sandboxed terminal guardrails
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="preferences-section">
              <div className="preferences-section-header">
                <h3>Theme</h3>
                <p className="preferences-section-subtitle">
                  Choose your theme preference. System will follow your OS setting.
                </p>
              </div>
              <div className="preferences-section-content">
                <div className="theme-options-grid">
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`theme-option${localPref === option.value ? " active" : ""}`}
                      onClick={() => selectThemePref(option.value)}
                    >
                      <span className="theme-option-label">{option.label}</span>
                      <span className="theme-option-description">{option.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "ai-config" && (
            <div className="preferences-section">
              <div className="preferences-section-content">
                <p className="preferences-placeholder">
                  AI Configuration settings coming soon
                </p>
              </div>
            </div>
          )}

          {activeTab === "hotkeys" && (
            <div className="preferences-section">
              <div className="preferences-section-content">
                <p className="preferences-placeholder">
                  Keyboard shortcuts configuration coming soon
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer with Save button */}
      <div className="preferences-footer">
        <button className="preferences-save-button" onClick={handleSave}>
          Save & Close
        </button>
      </div>
    </div>
  );
}