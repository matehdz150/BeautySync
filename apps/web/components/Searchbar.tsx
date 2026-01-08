"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
const MOCK_RESULTS = [
  { type: "Customer", name: "Ana López", id: "c1" },
  { type: "Customer", name: "Carlos Martínez", id: "c2" },
  { type: "Appointment", name: "Haircut – 3pm", id: "a1" },
  { type: "Appointment", name: "Blow Dry – 5pm", id: "a2" },
  { type: "Product", name: "Shampoo Kerastase", id: "p1" },
  { type: "Product", name: "Hair Oil Treatment", id: "p2" },
]

export function Searchbar() {
  const [query, setQuery] = useState("")
  const [focused, setFocused] = useState(false)

  const results = useMemo(() => {
    if (!query.trim()) return []
    return MOCK_RESULTS.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase())
    )
  }, [query])

  return (
    <div className="relative w-85">
      {/* INPUT */}
      <div className="
        flex items-center gap-2
        rounded-2xl bg-white px-3 py-2
        focus-within:ring-2 focus-within:ring-black
        transition border
      ">
        <Search className="w-4 h-4 text-muted-foreground" />

        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search anything…"
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      {/* RESULTS */}
      {focused && results.length > 0 && (
        <div className="
          absolute mt-2 w-full z-20
          bg-white border border-black rounded-none
          shadow-[10px_10px_0px_#000]
        ">
          {results.map((r) => (
            <button
              key={r.id}
              className="
                w-full text-left px-4 py-3
                hover:bg-accent transition
              "
              onClick={() => alert(`Navigate to ${r.name}`)}
            >
              <p className="font-medium leading-tight">{r.name}</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {r.type}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {focused && query && results.length === 0 && (
        <div className="
          absolute mt-2 w-full z-20
          bg-white border border-black rounded-none
          shadow-[10px_10px_0px_#000]
          p-4 text-sm text-neutral-500
        ">
          No results found
        </div>
      )}
    </div>
  )
}