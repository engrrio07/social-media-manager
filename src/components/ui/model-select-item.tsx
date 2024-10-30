// src/components/ui/model-select-item.tsx
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { SelectItem } from "@/components/ui/select"

interface ModelSelectItemProps {
  value: string
  label: string
  description: string
  icon?: React.ReactNode
}

export function ModelSelectItem({ value, label, description, icon }: ModelSelectItemProps) {
  return (
    <SelectItem
      value={value}
      className="flex flex-col items-start py-2 px-3 focus:bg-accent"
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <p className="font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <Check className="h-4 w-4 opacity-0 select-item-indicator:opacity-100" />
      </div>
    </SelectItem>
  )
}