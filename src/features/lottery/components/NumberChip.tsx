import { Check } from 'lucide-react'

export const NumberChip = ({ number, hit = false, selectable = false, onToggle }: { number: string; hit?: boolean; selectable?: boolean; onToggle?: () => void }) => {
  const className = `flex size-10 items-center justify-center gap-0.5 rounded-full border text-xs font-black transition ${hit ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm' : 'border-slate-200 bg-slate-900 text-white'} ${selectable ? 'cursor-pointer active:scale-95' : ''}`
  return selectable ? <button type="button" onClick={onToggle} className={className} aria-pressed={hit}>{hit && <Check className="size-3" />}{number}</button> : <span className={className}>{hit && <Check className="size-3" />}{number}</span>
}
