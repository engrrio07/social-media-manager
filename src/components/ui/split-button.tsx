// src/components/ui/split-button.tsx
import * as React from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

interface SplitButtonProps {
  options: {
    value: string
    label: string
    description?: string
    icon?: React.ReactNode
  }[]
  selectedValue: string
  onValueChange: (value: string) => void
  onClick: () => void
  loading?: boolean
  children: React.ReactNode
}

export function SplitButton({
  options,
  selectedValue,
  onValueChange,
  onClick,
  loading,
  children
}: SplitButtonProps) {
  return (
    <div className="flex">
      <Button
        onClick={onClick}
        disabled={loading}
        className="rounded-r-none border-r border-r-border/50"
      >
        {children}
      </Button>
      <Select value={selectedValue} onValueChange={onValueChange}>
        <SelectTrigger className="w-[140px] rounded-l-none border-l-0 px-2 hover:bg-accent">
          <ChevronDown className="h-4 w-4" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="flex flex-col items-start py-2 px-3"
            >
              <div className="flex items-center gap-2">
                {option.icon}
                <div>
                  <p className="font-medium">{option.label}</p>
                  {option.description && (
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}