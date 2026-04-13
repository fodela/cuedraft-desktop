import logoUrl from '../../../assets/logo.png'

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-1.5 h-1.5 rounded-full bg-t3 shrink-0" />
      <span className="text-[10px] font-bold tracking-widest uppercase text-t3">{label}</span>
    </div>
  )
}


export function AboutScreen() {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 min-h-0">

      {/* ── Identity ── */}
      <section>
        <SectionLabel label="Application" />
        <div className="bg-surface border border-low rounded-xl p-6 flex items-center gap-5">
          <img src={logoUrl} alt="CueDraft" className="w-14 h-14 rounded-2xl object-cover shrink-0" />
          <div>
            <h3 className="text-base font-black tracking-wider text-t1 leading-none">CUEDRAFT</h3>
            <p className="text-xs text-t3 mt-1">System-wide text template picker</p>
            <p className="text-xs text-t3 mt-0.5">
              Press your hotkey from anywhere, pick a template, and it types itself.
            </p>
          </div>
          <div className="ml-auto text-right shrink-0">
            <span className="px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase bg-accent-dim text-accent rounded-lg border border-accent/20">
              Public Alpha
            </span>
            <p className="text-xs text-t3 mt-2 font-mono">{__APP_VERSION__}</p>
            <p className="text-[10px] text-t3 mt-1 max-w-[160px]">
              Expect rough edges. <a
                href="https://github.com/fodela/cuedraft-desktop/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-t2"
              >Report bugs ↗</a>
            </p>
          </div>
        </div>
      </section>

      {/* ── Privacy ── */}
      <section>
        <SectionLabel label="Privacy & Data" />
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface border border-low rounded-xl p-5">
            <div className="w-9 h-9 rounded-lg bg-accent-dim border border-accent/20 flex items-center justify-center mb-4">
              <svg className="w-[18px] h-[18px] text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-t1 mb-1">Privacy-first</h4>
            <p className="text-xs text-t3 leading-relaxed">
              All data is stored locally on your machine. No account required, no cloud sync.
            </p>
          </div>
          <div className="bg-surface border border-low rounded-xl p-5">
            <div className="w-9 h-9 rounded-lg bg-accent-dim border border-accent/20 flex items-center justify-center mb-4">
              <svg className="w-[18px] h-[18px] text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M6.343 6.343a9 9 0 000 12.728m2.829-2.829a5 5 0 000-7.07" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-t1 mb-1">No telemetry</h4>
            <p className="text-xs text-t3 leading-relaxed">
              Zero network calls, zero analytics. The app never phones home.
            </p>
          </div>
        </div>
      </section>

    </div>
  )
}
