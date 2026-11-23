import { useCallback, useEffect, useRef, useState } from 'react';
import { postJson } from '../api';
import type { UiTexts } from '../api';
import type { Translate } from './context';

interface Saved {
  dir: 'ltr' | 'rtl';
  texts: Record<string, string>;
}

const BATCH = 500; // the backend's limit per request
const key = (language: string) => `ui-texts:${language}`;

function load(language: string): Saved {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key(language)) ?? 'null');
    if (saved && typeof saved === 'object' && 'dir' in saved && 'texts' in saved) return saved as Saved;
  } catch {
    // unreadable: start empty
  }
  return { dir: 'ltr', texts: {} };
}

/** Translate function for `language`: texts a page shows are collected while it renders, sent to the backend in
 * one batch and remembered in this browser, so each text is asked for once. Until it arrives (or if the backend
 * cannot translate) the Turkish text is shown. Also sets the page's lang and direction (Arabic: right to left).
 * shortcut: a sentence split around a value ("{n} kayıt") is translated in pieces; give such
 * sentences one text with the value at the end if word order matters in a language. */
export function useUiTexts(language: string): { t: Translate; loading: boolean } {
  const [saved, setSaved] = useState(() => load(language));
  const [pending, setPending] = useState(0);
  const asked = useRef(new Set<string>());
  const queue = useRef<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    timer.current = null;
    while (queue.current.length) {
      setPending((n) => n + 1);
      postJson<UiTexts>('/ui-texts', { texts: queue.current.splice(0, BATCH) })
        .then((res) => {
          if (res.language !== language) return;
          setSaved((prev) => {
            const next = { dir: res.dir, texts: { ...prev.texts, ...res.texts } };
            localStorage.setItem(key(language), JSON.stringify(next));
            return next;
          });
        })
        .catch(() => undefined) // stays Turkish; asked again after a reload
        .finally(() => setPending((n) => n - 1));
    }
  }, [language]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.lang = language;
    html.dir = saved.dir;
    return () => {
      html.lang = 'tr';
      html.dir = 'ltr';
    };
  }, [language, saved.dir]);

  const t = useCallback(
    (text: string) => {
      if (language === 'tr') return text;
      const hit = saved.texts[text];
      if (hit !== undefined) return hit;
      if (text.trim() && !asked.current.has(text)) {
        asked.current.add(text);
        queue.current.push(text);
        timer.current ??= setTimeout(flush, 30);
      }
      return text;
    },
    [language, saved.texts, flush],
  );
  return { t, loading: pending > 0 };
}
