import { useEffect, useRef } from 'react'

interface SearchBarProps {
  value: string
  onChange: (query: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Re-focus when picker is shown
  useEffect(() => {
    window.cuedraft.picker.onShow(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }, [])

  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
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
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search templates…"
        className="w-full bg-zinc-800 text-zinc-100 text-sm rounded-lg pl-10 pr-12 py-2.5 border border-zinc-700 focus:border-blue-500 focus:outline-none placeholder:text-zinc-500"
      />
      <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 bg-zinc-700 px-1.5 py-0.5 rounded">
        Esc
      </kbd>
    </div>
  )
}
