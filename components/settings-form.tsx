"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { PERSONAS, SUMMARY_DEPTHS } from "@/lib/digest-persona";
import type {
  NotificationPreference,
  PersonaId,
  SourceSeed,
  SummaryDepthId,
} from "@/lib/types";

interface SettingsFormProps {
  availableSources: SourceSeed[];
  defaultSubreddits: string[];
  defaultNotifications: NotificationPreference[];
  rssUrl: string;
}

const preferencesStorageKey = "reddit-voice-digest.preferences";

interface LocalPreferences {
  subreddits: string[];
  notifications: NotificationPreference[];
  persona: PersonaId;
  summaryDepth: SummaryDepthId;
  deliveryLocalTime: string | null;
  deliveryWeekdaysOnly: boolean;
}

function depthIndex(id: SummaryDepthId) {
  const i = SUMMARY_DEPTHS.findIndex((row) => row.id === id);
  return i >= 0 ? i : 1;
}

export function SettingsForm({
  availableSources,
  defaultSubreddits,
  defaultNotifications,
  rssUrl,
}: SettingsFormProps) {
  const [subreddits, setSubreddits] = useState<string[]>(defaultSubreddits);
  const [notifications, setNotifications] = useState<NotificationPreference[]>(defaultNotifications);
  const [persona, setPersona] = useState<PersonaId>("news_anchor");
  const [summaryDepth, setSummaryDepth] = useState<SummaryDepthId>("standard");
  const [deliveryLocalTime, setDeliveryLocalTime] = useState("");
  const [deliveryWeekdaysOnly, setDeliveryWeekdaysOnly] = useState(false);
  const [displayRssUrl, setDisplayRssUrl] = useState(rssUrl);
  const [userApiRssUrl, setUserApiRssUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("Изменения сохраняются локально и в Supabase после входа.");
  const [isSaving, setIsSaving] = useState(false);
  const [onDemandBusy, setOnDemandBusy] = useState(false);
  const [onDemandMessage, setOnDemandMessage] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const persistLocalSnapshot = useCallback(() => {
    const snapshot: LocalPreferences = {
      subreddits,
      notifications,
      persona,
      summaryDepth,
      deliveryLocalTime: deliveryLocalTime || null,
      deliveryWeekdaysOnly,
    };
    window.localStorage.setItem(preferencesStorageKey, JSON.stringify(snapshot));
  }, [deliveryLocalTime, deliveryWeekdaysOnly, notifications, persona, subreddits, summaryDepth]);

  useEffect(() => {
    let ignore = false;

    async function loadPreferences() {
      try {
        const response = await fetch("/api/preferences", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("remote");
        }

        const payload = (await response.json()) as Partial<LocalPreferences> & {
          notifications?: NotificationPreference[];
          personalRssUrl?: string | null;
          userApiRssUrl?: string | null;
          source?: string;
        };

        if (!ignore) {
          if (payload.subreddits?.length) {
            setSubreddits(payload.subreddits);
          }

          if (payload.notifications?.length) {
            setNotifications(payload.notifications);
          }

          if (payload.persona) {
            setPersona(payload.persona);
          }

          if (payload.summaryDepth) {
            setSummaryDepth(payload.summaryDepth);
          }

          if (payload.deliveryLocalTime !== undefined) {
            setDeliveryLocalTime(payload.deliveryLocalTime ?? "");
          }

          setDeliveryWeekdaysOnly(Boolean(payload.deliveryWeekdaysOnly));

          if (typeof payload.userApiRssUrl === "string") {
            setUserApiRssUrl(payload.userApiRssUrl);
          }

          if (payload.source === "remote") {
            setStatus("Настройки загружены из Supabase.");
            setDisplayRssUrl(payload.personalRssUrl?.trim() || rssUrl);
          } else if (payload.personalRssUrl) {
            setDisplayRssUrl(payload.personalRssUrl);
          }
        }
      } catch {
        try {
          const raw = window.localStorage.getItem(preferencesStorageKey);
          if (!raw) return;
          const parsed = JSON.parse(raw) as Partial<LocalPreferences> & {
            notifications?: NotificationPreference[];
          };
          if (!ignore) {
            if (parsed.subreddits?.length) setSubreddits(parsed.subreddits);
            if (parsed.notifications?.length) setNotifications(parsed.notifications);
            if (parsed.persona) setPersona(parsed.persona);
            if (parsed.summaryDepth) setSummaryDepth(parsed.summaryDepth);
            if (parsed.deliveryLocalTime !== undefined) setDeliveryLocalTime(parsed.deliveryLocalTime ?? "");
            setDeliveryWeekdaysOnly(Boolean(parsed.deliveryWeekdaysOnly));
          }
        } catch {
          // ignore malformed local storage and use defaults
        }
      }
    }

    void loadPreferences();
    return () => {
      ignore = true;
    };
  }, [rssUrl]);

  const hasTelegramEnabled = useMemo(() => {
    return notifications.some((item) => item.channelType === "telegram" && item.isEnabled);
  }, [notifications]);

  const catalogSorted = useMemo(() => {
    return [...availableSources].sort((a, b) => a.subreddit_name.localeCompare(b.subreddit_name));
  }, [availableSources]);

  function addSubreddit(name: string) {
    setSubreddits((current) => (current.includes(name) ? current : [...current, name]));
  }

  function removeSubreddit(name: string) {
    setSubreddits((current) => current.filter((entry) => entry !== name));
  }

  function moveSubreddit(fromIndex: number, toIndex: number) {
    setSubreddits((current) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
        return current;
      }
      const clone = [...current];
      const [item] = clone.splice(fromIndex, 1);
      if (!item) {
        return current;
      }
      clone.splice(toIndex, 0, item);
      return clone;
    });
  }

  function toggleNotification(channelType: NotificationPreference["channelType"]) {
    setNotifications((current) =>
      current.map((item) =>
        item.channelType === channelType ? { ...item, isEnabled: !item.isEnabled } : item,
      ),
    );
  }

  function updateNotificationTarget(channelType: NotificationPreference["channelType"], targetValue: string) {
    setNotifications((current) =>
      current.map((item) => (item.channelType === channelType ? { ...item, targetValue } : item)),
    );
  }

  async function handleOnDemandDigest() {
    setOnDemandBusy(true);
    setOnDemandMessage(null);

    try {
      const response = await fetch("/api/user/digest/on-demand", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        result?: { title?: string; slug?: string };
      };

      if (!response.ok) {
        const text =
          data.error ??
          (response.status === 401
            ? "Войдите в аккаунт, затем попробуйте снова."
            : response.status === 503
              ? "Сервер без service role или пайплайн недоступен."
              : "Не удалось запустить генерацию.");
        setOnDemandMessage(text);
        return;
      }

      if (data.ok && data.result?.title) {
        setOnDemandMessage(
          `Готово: «${data.result.title}». Выпуск появится в персональном RSS и архиве (slug: ${data.result.slug}).`,
        );
      } else {
        setOnDemandMessage("Генерация завершилась успешно.");
      }
    } catch {
      setOnDemandMessage("Сеть недоступна или запрос отменён.");
    } finally {
      setOnDemandBusy(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);

    const payload = {
      subreddits,
      notifications,
      persona,
      summaryDepth,
      deliveryLocalTime: deliveryLocalTime || null,
      deliveryWeekdaysOnly,
    };

    persistLocalSnapshot();

    try {
      const response = await fetch("/api/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        if (typeof data.personalRssUrl === "string" && data.personalRssUrl) {
          setDisplayRssUrl(data.personalRssUrl);
        }
        if (typeof data.userApiRssUrl === "string" && data.userApiRssUrl) {
          setUserApiRssUrl(data.userApiRssUrl);
        }
        setStatus("Сохранено в Supabase и локально.");
      } else if (response.status === 401) {
        setStatus(
          "Сохранено локально. После входа через Supabase синхронизация отправит профиль на сервер и выдаст персональный RSS.",
        );
      } else {
        setStatus("Сохранено локально. Удалённые настройки ответили ошибкой.");
      }
    } catch {
      setStatus("Сохранено локально. Проверьте сеть и повторите попытку.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1.3fr_0.9fr]">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Personalization</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Подбор сообществ и приоритет</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
          Нажмите карточку сабреддита, чтобы отметить её как выбранную (Selected). Выбранные можно перетаскивать ниже — чем
          выше в списке, тем выше приоритет в подкасте. Ниже — «голос», глубина саммари и остальные настройки.
        </p>

        <div className="mt-6 border-b border-white/10 pb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Каталог</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {catalogSorted.map((source) => {
              const selected = subreddits.includes(source.subreddit_name);

              return (
                <button
                  key={source.subreddit_name}
                  aria-pressed={selected}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    selected
                      ? "border-cyan-400/55 bg-gradient-to-br from-cyan-500/15 to-slate-900/70 ring-1 ring-cyan-400/30"
                      : "border-white/10 bg-slate-950/50 hover:border-white/25 hover:bg-slate-900/70"
                  }`}
                  onClick={() => (selected ? removeSubreddit(source.subreddit_name) : addSubreddit(source.subreddit_name))}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">r/{source.subreddit_name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Базовый приоритет: {source.priority ?? "—"}
                      </p>
                    </div>
                    {selected ? (
                      <span className="shrink-0 rounded-full bg-cyan-400/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-950">
                        Selected
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] uppercase tracking-wider text-slate-500">
                        Tap
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Приоритет (drag & drop)</p>
          {subreddits.length === 0 ? (
            <p className="text-sm text-slate-400">Добавьте хотя бы один сабреддит сверху.</p>
          ) : (
            subreddits.map((name, index) => (
              <div
                key={name}
                className="flex cursor-grab items-center justify-between rounded-3xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 active:cursor-grabbing"
                draggable
                onDragEnd={() => setDragIndex(null)}
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDragStart={() => setDragIndex(index)}
                onDrop={() => {
                  if (dragIndex === null || dragIndex === index) return;
                  moveSubreddit(dragIndex, index);
                  setDragIndex(null);
                }}
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">
                    Приоритет {index + 1}
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">r/{name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Базовые очки источника:{" "}
                    {availableSources.find((s) => s.subreddit_name === name)?.priority ?? "—"}
                  </p>
                </div>
                <button
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200 hover:border-white/30 hover:text-white"
                  onClick={() => removeSubreddit(name)}
                  type="button"
                >
                  Убрать
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-slate-950/60 p-5">
          <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Голос и вайб</p>
          <div className="mt-4 space-y-3">
            {PERSONAS.map((row) => (
              <label
                key={row.id}
                className={`flex cursor-pointer flex-col rounded-2xl border px-4 py-3 text-left transition ${
                  persona === row.id ? "border-cyan-400/50 bg-white/10" : "border-white/10 hover:border-white/20"
                }`}
              >
                <span className="flex items-start gap-3">
                  <input
                    checked={persona === row.id}
                    className="mt-1"
                    name="persona"
                    onChange={() => setPersona(row.id)}
                    type="radio"
                  />
                  <span>
                    <span className="text-sm font-medium text-white">{row.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-400">{row.hint}</span>
                    <span className="mt-1 block text-[11px] text-slate-500">
                      Меняет инструкции OpenAI для саммари/скрипта и голос OpenAI TTS (Assembly заготовлен в провайдере).
                    </span>
                  </span>
                </span>
              </label>
            ))}
          </div>

          <p className="mt-8 text-xs uppercase tracking-[0.22em] text-slate-400">Глубина саммари</p>
          <div className="mt-4">
            <input
              className="w-full accent-cyan-400"
              max={SUMMARY_DEPTHS.length - 1}
              min={0}
              onChange={(e) => setSummaryDepth(SUMMARY_DEPTHS[Number(e.target.value)].id)}
              step={1}
              type="range"
              value={depthIndex(summaryDepth)}
            />
            <div className="mt-2 flex justify-between gap-3 text-[11px] text-slate-400">
              {SUMMARY_DEPTHS.map((row) => (
                <span
                  key={row.id}
                  className={summaryDepth === row.id ? "text-cyan-200" : undefined}
                  style={{ flex: "1 1 0" }}
                >
                  {row.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Delivery</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Уведомления и фиды</h2>

          <div className="mt-6 rounded-3xl border border-white/15 bg-slate-950/50 p-4">
            <p className="text-sm font-medium text-white">Рассылка во времени</p>
            <p className="mt-2 text-sm text-slate-400">
              Когда включите канал ниже и подключите воркер/cron к этим полям, дайджест можно прислать каждый день в нужный
              момент.
            </p>
            <label className="mt-4 block text-xs uppercase tracking-[0.2em] text-slate-500" htmlFor="delivery-time">
              Локальное время
            </label>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-white outline-none focus:border-cyan-300/40"
              id="delivery-time"
              onChange={(event) => setDeliveryLocalTime(event.target.value)}
              type="time"
              value={deliveryLocalTime}
            />
            <label className="mt-4 flex items-center gap-3 text-sm text-slate-200">
              <input
                checked={deliveryWeekdaysOnly}
                className="h-4 w-4 rounded accent-cyan-400"
                onChange={(event) => setDeliveryWeekdaysOnly(event.target.checked)}
                type="checkbox"
              />
              Только по будням (без напоминаний в выходные)
            </label>
          </div>

          <div className="mt-6 space-y-4">
            {notifications.map((item) => (
              <div key={item.channelType} className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{item.helperText}</p>
                  </div>

                  <button
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      item.isEnabled ? "bg-cyan-400 text-slate-950" : "bg-white/10 text-slate-300"
                    }`}
                    onClick={() => toggleNotification(item.channelType)}
                    type="button"
                  >
                    {item.isEnabled ? "Enabled" : "Disabled"}
                  </button>
                </div>

                {item.channelType === "telegram" ? (
                  <input
                    className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
                    onChange={(event) => updateNotificationTarget(item.channelType, event.target.value)}
                    placeholder="@your_telegram_handle or chat id"
                    type="text"
                    value={item.targetValue ?? ""}
                  />
                ) : (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Подкаст-RSS</p>
                    <p className="mt-2 text-xs text-slate-500">Приватная ссылка (токен, предпочтительно для плеера)</p>
                    <p className="mt-1 break-all text-cyan-100">{displayRssUrl}</p>
                    <p className="mt-3 text-xs text-slate-500">Фид по ID аккаунта (динамический API)</p>
                    <p className="mt-1 break-all font-mono text-[13px] text-cyan-200/90">
                      {userApiRssUrl ?? "Появится после входа и загрузки настроек с сервера."}
                    </p>
                    <p className="mt-3 text-xs text-slate-500">
                      Общая ссылка для гостей: <span className="break-all text-slate-400">{rssUrl}</span>. Персональные адреса
                      ниже включаются после входа и нажатия Save preferences.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Status</p>
          <p className="mt-3 text-sm leading-7 text-slate-300">{status}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="inline-flex rounded-full bg-cyan-400 px-5 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              onClick={() => {
                void handleSave();
              }}
              type="button"
            >
              {isSaving ? "Saving..." : "Save preferences"}
            </button>
            <button
              className="inline-flex rounded-full border border-amber-400/50 bg-amber-400/10 px-5 py-2 text-sm font-medium text-amber-100 transition hover:border-amber-300/80 hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={onDemandBusy || isSaving || subreddits.length === 0}
              onClick={() => {
                void handleOnDemandDigest();
              }}
              title={
                subreddits.length === 0
                  ? "Сначала выберите сабреддиты"
                  : "Соберёт свежий дайджест сейчас (может занять несколько минут)"
              }
              type="button"
            >
              {onDemandBusy ? "Генерация…" : "Сгенерировать вне очереди"}
            </button>
            {hasTelegramEnabled ? (
              <p className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
                Telegram включён — отправка сработает, когда добавите токен бота на сервере и cron-триггер.
              </p>
            ) : null}
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            «Вне очереди» использует сохранённые в Supabase сабреддиты, голос и глубину (если ещё не сохраняли — нажмите Save).
            На хостингах с коротким таймаутом запрос может оборваться: тогда см. серверные логи или запуск пайплайна из CLI.
          </p>
          {onDemandMessage ? (
            <p className="mt-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
              {onDemandMessage}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
