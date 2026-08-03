"use client";

import { useEffect, useState } from "react";
import styles from "../apnoe.module.css";

const DISMISS_KEY = "baus-pwa-install-dismissed";
const DISMISS_FOR_MS = 14 * 24 * 60 * 60 * 1000;

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

export default function PwaInstallCard() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0);
    if (Date.now() - dismissedAt < DISMISS_FOR_MS) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    let iosHelpTimer: number | undefined;
    if (isIos) {
      iosHelpTimer = window.setTimeout(() => {
        setShowIosHelp(true);
        setVisible(true);
      }, 0);
    }

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
      setVisible(true);
    };
    const handleInstalled = () => setVisible(false);

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      if (iosHelpTimer !== undefined) window.clearTimeout(iosHelpTimer);
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (!visible) return null;

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);
    if (choice.outcome === "accepted") {
      setVisible(false);
    } else {
      dismiss();
    }
  }

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  return (
    <aside className={styles.installCard} aria-label="Установка BAUS Training">
      <div className={styles.installIcon} aria-hidden="true">BAUS</div>
      <div className={styles.installCopy}>
        <strong>Установить BAUS как приложение</strong>
        {showIosHelp ? (
          <p>Нажми «Поделиться» в Safari, затем «На экран Домой».</p>
        ) : (
          <p>Открывай тренировки с домашнего экрана без панели браузера.</p>
        )}
      </div>
      <div className={styles.installActions}>
        {promptEvent && <button className={styles.btn} onClick={() => void install()}>Установить</button>}
        <button className={styles.secondary} onClick={dismiss}>Позже</button>
      </div>
    </aside>
  );
}
