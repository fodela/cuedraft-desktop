import { useState, useEffect, useRef } from "react";
import logoUrl from "../../../assets/logo.png";
import { HomeScreen } from "./HomeScreen";
import { EditTemplateScreen } from "./EditTemplateScreen";
import { NotesScreen } from "./NotesScreen";
import { EditNoteScreen } from "./EditNoteScreen";
import { SettingsScreen } from "./SettingsScreen";
import { AppearanceScreen } from "./AppearanceScreen";
import { KeybindingsScreen } from "./KeybindingsScreen";
import { AboutScreen } from "./AboutScreen";

type Screen =
  | { name: "home" }
  | { name: "edit"; templateId: number | null }
  | { name: "notes" }
  | { name: "editNote"; noteId: number }
  | { name: "settings" }
  | { name: "keybindings" }
  | { name: "appearance" }
  | { name: "about" };

type NavItem = { id: Screen["name"]; label: string; icon: React.ReactNode };

const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "Templates",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    id: "notes",
    label: "Notes",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    ),
  },
  {
    id: "keybindings",
    label: "Keybindings",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 4c-4.418 0-8 1.79-8 4v8c0 2.21 3.582 4 8 4s8-1.79 8-4V8c0-2.21-3.582-4-8-4z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 10h.01M12 10h.01M16 10h.01M8 14h8"
        />
      </svg>
    ),
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
        />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
];

const SCREEN_LABELS: Record<string, string> = {
  settings: "Settings",
  home: "Templates",
  edit: "Edit Template",
  notes: "Notes",
  editNote: "Edit Note",
  keybindings: "Keybindings",
  appearance: "Appearance",
  about: "About",
};

export function SettingsApp() {
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const activeNav =
    screen.name === "edit"
      ? "home"
      : screen.name === "editNote"
        ? "notes"
        : screen.name;
  const screenLabel = SCREEN_LABELS[screen.name] ?? "";

  const navigate = (id: Screen["name"]) => {
    if (id === "home") setScreen({ name: "home" });
    else if (id === "notes") setScreen({ name: "notes" });
    else if (id === "settings") setScreen({ name: "settings" });
    else if (id === "keybindings") setScreen({ name: "keybindings" });
    else if (id === "appearance") setScreen({ name: "appearance" });
  };

  return (
    <div className="h-screen flex bg-base text-t1 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-56 flex flex-col bg-surface border-r border-low shrink-0">
        {/* Logo */}
        <div className="px-5 pt-5 pb-4 border-b border-low">
          <div className="flex items-center gap-3">
            <img
              src={logoUrl}
              alt="CueDraft"
              className="w-10 h-10 rounded-xl object-cover shrink-0"
            />
            <div>
              <div className="text-base font-black tracking-wider text-t1 leading-none">
                CUEDRAFT
              </div>
              <div className="text-[10px] tracking-widest text-t3 mt-0.5 uppercase">
                Alpha · {__APP_VERSION__}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-accent-dim text-accent border-r-2 border-accent"
                    : "text-t2 hover:text-t1 hover:bg-raised"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-low">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-xs font-bold text-amber-900 shrink-0">
              A
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-t1 truncate">
                admin_root
              </div>
              <div className="text-[10px] text-t3 truncate">
                Standard License
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-4 px-6 py-3 border-b border-low shrink-0 bg-surface">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] tracking-widest uppercase font-semibold">
            <span className="text-t3">Settings</span>
            <span className="text-t4">/</span>
            <span className="text-t1">{screenLabel}</span>
          </div>

          {/* Search bar */}
          <div className="ml-auto flex items-center gap-2 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-t3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search settings..."
              className="bg-raised border border-mid text-t2 text-xs rounded-lg pl-8 pr-16 py-2 w-56 focus:outline-none focus:border-accent placeholder:text-t4"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] bg-raised text-accent rounded border border-low font-mono">
              ⌘K
            </kbd>
          </div>

          {/* Icons */}
          <button
            onClick={() => setScreen({ name: "about" })}
            className="w-7 h-7 flex items-center justify-center rounded-full text-t3 hover:text-t1 hover:bg-raised transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
          <button
            onClick={() => window.close()}
            className="w-7 h-7 flex items-center justify-center rounded-full text-t3 hover:text-t1 hover:bg-raised transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {screen.name === "home" && (
            <HomeScreen
              onEdit={(id) => setScreen({ name: "edit", templateId: id })}
              onCreate={() => setScreen({ name: "edit", templateId: null })}
            />
          )}
          {screen.name === "edit" && (
            <EditTemplateScreen
              templateId={screen.templateId}
              onSave={() => setScreen({ name: "home" })}
              onCancel={() => setScreen({ name: "home" })}
            />
          )}
          {screen.name === "notes" && (
            <NotesScreen
              onEdit={(id) => setScreen({ name: "editNote", noteId: id })}
            />
          )}
          {screen.name === "editNote" && (
            <EditNoteScreen
              noteId={screen.noteId}
              onSave={() => setScreen({ name: "notes" })}
              onCancel={() => setScreen({ name: "notes" })}
            />
          )}
          {screen.name === "settings" && <SettingsScreen />}
          {screen.name === "keybindings" && <KeybindingsScreen />}
          {screen.name === "appearance" && <AppearanceScreen />}
          {screen.name === "about" && <AboutScreen />}
        </main>
      </div>
    </div>
  );
}
