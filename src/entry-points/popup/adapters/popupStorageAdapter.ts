import {
  addOnStorageChangedListener,
  getSettings,
  setSettings,
  settingsChanges2NewValues,
  type Settings,
} from "@/settings";

export type PopupSettings = Settings;

export async function loadPopupSettings(): Promise<PopupSettings> {
  return getSettings();
}

export async function writePopupSettings(settings: Partial<PopupSettings>): Promise<void> {
  await setSettings(settings);
}

export function onPopupSettingsChanged(listener: (changes: Partial<PopupSettings>) => void): () => void {
  return addOnStorageChangedListener(changes => {
    listener(settingsChanges2NewValues(changes) as Partial<PopupSettings>);
  });
}
