"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "../apnoe.module.css";
import timerStyles from "./TimerV2.module.css";
import type { PlanRound, TrainingType } from "../types";

export type TimerLaunch = { mode: TrainingType; rounds: PlanRound[] };
export type TimerResult = TimerLaunch & { actual: number[]; completed: boolean };

type Phase = "preparation" | "hold" | "rest" | "complete";
type Session = TimerLaunch & {
  version: 2; phase: Phase; index: number; phaseDurationMs: number;
  remainingMs: number; endsAt: number | null; running: boolean; started: boolean;
  actual: number[]; preparationSeconds: number; voice: boolean; sound: boolean; vibration: boolean;
};

const fmt = (seconds: number) => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.max(0, seconds) % 60).padStart(2, "0")}`;
const storageKey = (userId: string) => `baus-apnoe-timer-v2:${userId}`;

function readSession(userId: string): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem(storageKey(userId)) ?? "null") as Session | null;
    return value?.version === 2 && value.phase !== "complete" ? value : null;
  } catch { return null; }
}

function writeSession(userId: string, session: Session) {
  try { localStorage.setItem(storageKey(userId), JSON.stringify(session)); } catch { /* Storage can be disabled. */ }
}

function clearSession(userId: string) {
  try { localStorage.removeItem(storageKey(userId)); } catch { /* Storage can be disabled. */ }
}

export function loadTimerLaunch(userId: string): TimerLaunch | null {
  const saved = readSession(userId);
  return saved ? { mode: saved.mode, rounds: saved.rounds } : null;
}

function createSession(launch: TimerLaunch, restored: Session | null): Session {
  if (restored && restored.mode === launch.mode) {
    const remainingMs = restored.endsAt ? Math.max(0, restored.endsAt - Date.now()) : restored.remainingMs;
    return { ...restored, remainingMs, endsAt: null, running: false };
  }
  return { version: 2, ...launch, phase: "preparation", index: 0, phaseDurationMs: 120_000,
    remainingMs: 120_000, endsAt: null, running: false, started: false, actual: [],
    preparationSeconds: 120, voice: true, sound: true, vibration: true };
}

function nextPhase(current: Session, actualHold?: number): Session {
  const actual = current.phase === "hold"
    ? [...current.actual, actualHold ?? Math.round(current.phaseDurationMs / 1000)] : current.actual;
  let phase: Phase = "complete", index = current.index, duration = 0;
  if (current.phase === "preparation") { phase = "hold"; duration = current.rounds[0]?.hold ?? 0; }
  else if (current.phase === "hold" && (current.rounds[current.index]?.rest ?? 0) > 0) {
    phase = "rest"; duration = current.rounds[current.index].rest;
  } else {
    index = current.index + 1;
    if (index < current.rounds.length) { phase = "hold"; duration = current.rounds[index].hold; }
  }
  const running = phase !== "complete" && current.running;
  const remainingMs = Math.max(0, duration * 1000);
  return { ...current, phase, index, actual, phaseDurationMs: remainingMs, remainingMs,
    running, endsAt: running ? Date.now() + remainingMs : null };
}

type WakeLockLike = { release: () => Promise<void> };

export default function TimerV2({ userId, launch, onClose, onComplete }: {
  userId: string; launch: TimerLaunch; onClose: () => void;
  onComplete: (result: TimerResult) => Promise<void>;
}) {
  const [session, setSession] = useState(() => createSession(launch, readSession(userId)));
  const [now, setNow] = useState(Date.now());
  const [finishing, setFinishing] = useState(false);
  const wakeLock = useRef<WakeLockLike | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const completed = useRef(false);
  const lastSignal = useRef("");
  const remainingMs = session.running && session.endsAt ? Math.max(0, session.endsAt - now) : session.remainingMs;
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const elapsedSeconds = Math.max(0, Math.floor((session.phaseDurationMs - remainingMs) / 1000));
  const openEnded = (session.mode === "max" || session.mode === "free") && session.phase === "hold";
  const displayedSeconds = openEnded ? elapsedSeconds : remainingSeconds;
  const phaseLabel = { preparation: "Подготовка", hold: "Задержка дыхания", rest: "Отдых", complete: "Готово" }[session.phase];

  const beep = useCallback((frequency = 740, duration = .12) => {
    if (!session.sound) return;
    try {
      audio.current ??= new AudioContext();
      const oscillator = audio.current.createOscillator(), gain = audio.current.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.08, audio.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audio.current.currentTime + duration);
      oscillator.connect(gain).connect(audio.current.destination);
      oscillator.start(); oscillator.stop(audio.current.currentTime + duration);
    } catch { /* Audio is optional. */ }
  }, [session.sound]);

  const speak = useCallback((text: string) => {
    if (!session.voice || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ru-RU"; utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }, [session.voice]);

  const requestWakeLock = useCallback(async () => {
    const nav = navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<WakeLockLike> } };
    if (!nav.wakeLock || wakeLock.current) return;
    try { wakeLock.current = await nav.wakeLock.request("screen"); } catch { /* Best effort. */ }
  }, []);

  useEffect(() => { writeSession(userId, { ...session, remainingMs }); }, [remainingMs, session, userId]);
  useEffect(() => {
    if (!session.running) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    void requestWakeLock();
    return () => window.clearInterval(id);
  }, [requestWakeLock, session.running]);
  useEffect(() => {
    if (session.running || !wakeLock.current) return;
    void wakeLock.current.release(); wakeLock.current = null;
  }, [session.running]);
  useEffect(() => () => {
    void wakeLock.current?.release(); window.speechSynthesis?.cancel(); void audio.current?.close();
  }, []);
  useEffect(() => {
    if (!session.running || !session.endsAt || session.endsAt > now) return;
    setSession(current => !current.running || !current.endsAt || current.endsAt > Date.now() ? current : nextPhase(current));
  }, [now, session.endsAt, session.running]);
  useEffect(() => {
    if (!session.started) return;
    const key = `${session.phase}:${session.index}`;
    if (lastSignal.current === key) return;
    lastSignal.current = key; beep(session.phase === "hold" ? 880 : 620, .18); speak(phaseLabel);
    if (session.vibration && "vibrate" in navigator) navigator.vibrate([120, 60, 120]);
  }, [beep, phaseLabel, session.index, session.phase, session.started, session.vibration, speak]);
  useEffect(() => {
    if (!session.running || remainingSeconds < 1 || remainingSeconds > 3) return;
    const key = `${session.phase}:${session.index}:${remainingSeconds}`;
    if (lastSignal.current === key) return;
    lastSignal.current = key; beep(940, .08); speak(String(remainingSeconds));
  }, [beep, remainingSeconds, session.index, session.phase, session.running, speak]);
  useEffect(() => {
    if (session.phase !== "complete" || completed.current) return;
    completed.current = true; clearSession(userId); setFinishing(true);
    void onComplete({ mode: session.mode, rounds: session.rounds, actual: session.actual, completed: true }).finally(() => setFinishing(false));
  }, [onComplete, session, userId]);

  const progress = useMemo(() => !session.phaseDurationMs ? 100 : Math.min(100, Math.max(0,
    ((session.phaseDurationMs - remainingMs) / session.phaseDurationMs) * 100)), [remainingMs, session.phaseDurationMs]);

  function startOrPause() {
    beep(520, .05); setNow(Date.now());
    setSession(current => {
      if (current.running) {
        const paused = Math.max(0, (current.endsAt ?? Date.now()) - Date.now());
        return { ...current, running: false, endsAt: null, remainingMs: paused };
      }
      const remaining = current.started ? current.remainingMs : current.preparationSeconds * 1000;
      return { ...current, started: true, phaseDurationMs: current.started ? current.phaseDurationMs : remaining,
        remainingMs: remaining, running: true, endsAt: Date.now() + remaining };
    });
  }

  function finishStage() {
    setSession(current => {
      if (current.phase === "complete") return current;
      if (current.phase === "preparation" || current.phase === "rest") return nextPhase(current);
      const left = current.running && current.endsAt ? Math.max(0, current.endsAt - Date.now()) : current.remainingMs;
      return nextPhase(current, Math.max(1, Math.round((current.phaseDurationMs - left) / 1000)));
    });
  }

  async function finishWorkout() {
    if (!session.actual.length && session.phase !== "hold") { discard(); return; }
    const currentActual = session.phase === "hold" ? Math.max(1, Math.round((session.phaseDurationMs - remainingMs) / 1000)) : null;
    const actual = currentActual ? [...session.actual, currentActual] : session.actual;
    setFinishing(true); clearSession(userId);
    await onComplete({ mode: session.mode, rounds: session.rounds, actual, completed: false });
    setFinishing(false);
  }
  function discard() {
    if (session.started && !window.confirm("Закрыть таймер без сохранения этой тренировки?")) return;
    clearSession(userId); onClose();
  }
  async function toggleFullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { /* Not available in every browser. */ }
  }

  return <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Timer V2"><div className={timerStyles.timerBoxV2}>
    <div className={timerStyles.timerTopline}><span className={timerStyles.versionBadge}>Timer V2</span>
      <span className={timerStyles.timerMode}>{session.mode.toUpperCase()} · раунд {Math.min(session.index + 1, session.rounds.length)}/{session.rounds.length}</span>
      <button className={timerStyles.iconButton} onClick={() => void toggleFullscreen()} aria-label="Полноэкранный режим">⛶</button></div>
    {!session.started && <div className={timerStyles.timerSettings}><h2>Подготовка к тренировке</h2>
      <p className={styles.muted}>Спокойное дыхание без гипервентиляции. Выбери длительность подготовки.</p>
      <div className={timerStyles.presetRow}>{[0,30,60,120,180].map(seconds => <button key={seconds}
        className={session.preparationSeconds === seconds ? styles.btn : styles.secondary}
        onClick={() => setSession(current => ({ ...current, preparationSeconds: seconds, phaseDurationMs: seconds * 1000, remainingMs: seconds * 1000 }))}>
        {seconds ? fmt(seconds) : "Без подготовки"}</button>)}</div>
      <div className={timerStyles.toggleRow}><label><input type="checkbox" checked={session.voice} onChange={e => setSession(c => ({...c,voice:e.target.checked}))}/> Голос</label>
        <label><input type="checkbox" checked={session.sound} onChange={e => setSession(c => ({...c,sound:e.target.checked}))}/> Звук</label>
        <label><input type="checkbox" checked={session.vibration} onChange={e => setSession(c => ({...c,vibration:e.target.checked}))}/> Вибрация</label></div></div>}
    <span className={timerStyles.phaseLabel}>{phaseLabel}</span><div className={timerStyles.timerV2} aria-live="polite">{fmt(displayedSeconds)}</div>
    <div className={styles.progress}><span style={{width:`${progress}%`}}/></div>
    <p className={timerStyles.nextPhase}>{session.phase === "preparation" && `Далее: задержка ${fmt(session.rounds[0]?.hold ?? 0)}`}
      {session.phase === "hold" && (session.rounds[session.index]?.rest ? `Далее: отдых ${fmt(session.rounds[session.index].rest)}` : "Далее: следующий раунд")}
      {session.phase === "rest" && `Далее: задержка ${fmt(session.rounds[session.index + 1]?.hold ?? 0)}`}</p>
    <div className={styles.controls}>{session.phase !== "complete" && <button className={styles.btn} disabled={finishing} onClick={startOrPause}>{session.running?"Пауза":session.started?"Продолжить":"Начать"}</button>}
      {session.started && session.phase !== "complete" && <button className={styles.secondary} disabled={finishing} onClick={finishStage}>{session.phase === "hold"?"Завершить задержку":"Пропустить этап"}</button>}
      {session.started && <button className={styles.secondary} disabled={finishing} onClick={() => void finishWorkout()}>Завершить тренировку</button>}
      <button className={styles.secondary} disabled={finishing} onClick={discard}>Закрыть</button></div>
    <p className={timerStyles.safetyNote}>Тренировки в воде — только с подготовленным напарником. Прекрати попытку при головокружении или нарушении зрения.</p>
  </div></div>;
}
