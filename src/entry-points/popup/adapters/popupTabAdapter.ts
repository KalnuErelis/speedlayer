import { browserOrChrome } from "@/webextensions-api-browser-or-chrome";

export type PopupTab = chrome.tabs.Tab | browser.tabs.Tab;
export type PopupRuntimeMessageSender = chrome.runtime.MessageSender | browser.runtime.MessageSender;
export type PopupRuntimeMessageListener = (
  message: unknown,
  sender: PopupRuntimeMessageSender,
) => void;

export async function getActivePopupTab(): Promise<PopupTab> {
  const tabs = await browserOrChrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

export async function waitForPopupTabLoad(tabPromise: Promise<PopupTab>): Promise<PopupTab> {
  let tab = await tabPromise;
  if (tab.status === "complete") return tab;

  return new Promise(resolve => {
    let pollTimeout: ReturnType<typeof setTimeout>;

    function finishIfComplete(updatedTab: PopupTab) {
      if (updatedTab.status !== "complete") return false;
      resolve(updatedTab);
      browserOrChrome.tabs.onUpdated.removeListener(onUpdatedListener);
      clearTimeout(pollTimeout);
      return true;
    }

    const onUpdatedListener = (tabId: number, _: unknown, updatedTab: PopupTab) => {
      if (tabId === tab.id) finishIfComplete(updatedTab);
    };

    browserOrChrome.tabs.onUpdated.addListener(onUpdatedListener);

    async function poll() {
      tab = await getActivePopupTab();
      if (!finishIfComplete(tab)) pollTimeout = setTimeout(poll, 2000);
    }

    pollTimeout = setTimeout(poll, 2000);
  });
}

export async function requestContentStatus(tab: PopupTab): Promise<void> {
  if (!tab.id) return;
  try {
    await browserOrChrome.tabs.sendMessage(tab.id, "checkContentStatus");
  } catch (error) {
    if (
      error instanceof Error
      && error.message.includes("Receiving end does not exist")
    ) {
      return;
    }
    throw error;
  }
}

export function onPopupRuntimeMessage(listener: PopupRuntimeMessageListener): () => void {
  browserOrChrome.runtime.onMessage.addListener(listener);
  return () => browserOrChrome.runtime.onMessage.removeListener(listener);
}

export function getPopupRuntimeUrl(path: string): string {
  return browserOrChrome.runtime.getURL(path);
}

export function openPopupOptionsPage(): void {
  browserOrChrome.runtime.openOptionsPage();
}

export async function openPopupTab(url: string): Promise<void> {
  await browserOrChrome.tabs.create({ url });
}

export async function reloadPopupTab(tab: PopupTab): Promise<void> {
  if (!tab.id) return;
  await browserOrChrome.tabs.reload(tab.id);
}

export function getPopupCommands(): undefined | ReturnType<typeof browserOrChrome.commands.getAll> {
  return browserOrChrome.commands?.getAll?.();
}
