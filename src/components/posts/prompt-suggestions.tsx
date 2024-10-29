// src/components/posts/prompt-suggestions.tsx
"use client"

interface PromptSuggestionsProps {
  onSelect: (prompt: string) => void
}

const suggestions = [
  "Create a professional and modern business image",
  "Design a vibrant and eye-catching social media banner",
  "Generate a minimalist and clean promotional image",
  "Create an inspiring motivational quote background",
  "Design a creative product showcase image"
]

export function PromptSuggestions({ onSelect }: PromptSuggestionsProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Suggested prompts:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSelect(suggestion)}
            className="text-xs bg-secondary px-2 py-1 rounded-md hover:bg-secondary/80 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}