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

  useEffect(() => {
    window.cuedraft.picker.onShow(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }, [])

  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-t3"
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
        className="w-full bg-raised text-t1 text-sm rounded-lg pl-10 pr-12 py-2.5 border border-mid focus:border-accent focus:outline-none placeholder:text-t3"
      />
      <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-t3 bg-raised px-1.5 py-0.5 rounded border border-low">
        Esc
      </kbd>
    </div>
  )
}
