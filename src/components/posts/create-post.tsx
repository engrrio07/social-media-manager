// src/components/posts/create-post.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Sparkles, Image as ImageIcon, X, Loader2 } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImagePreview } from "./image-preview"
import { PromptSuggestions } from "./prompt-suggestions"

const postSchema = z.object({
  content: z.string()
    .min(1, "Content is required")
    .max(2200, "Content must be less than 2200 characters"),
  scheduledFor: z.date().optional(),
})

type PostFormValues = z.infer<typeof postSchema>

type GenerateState = {
  loading: boolean
  error: string | null
}

export function CreatePost({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  
  const [generateState, setGenerateState] = useState<GenerateState>({
    loading: false,
    error: null,
  })

  const [imageGenerateState, setImageGenerateState] = useState<GenerateState>({
    loading: false,
    error: null,
  })

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: "",
    },
  })

  async function generateAICaption() {
    setGenerateState({ loading: true, error: null })
    
    try {
      const response = await fetch('/api/ai/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: form.getValues('content') || 'Generate a creative social media post'
        }),
      })
  
      if (!response.ok) throw new Error('Failed to generate caption')
  
      const data = await response.json()
      form.setValue('content', data.caption)
      
      toast({
        title: "Success",
        description: "AI caption generated successfully",
      })
    } catch (error) {
      console.error('Error generating caption:', error)
      setGenerateState({
        loading: false,
        error: 'Failed to generate caption. Please try again.',
      })
    } finally {
      setGenerateState(prev => ({ ...prev, loading: false }))
    }
  }

  async function generateAIImage() {
    setImageGenerateState({ loading: true, error: null })
    
    try {
      const content = form.getValues('content')
      if (!content) {
        throw new Error('Please enter some content first')
      }

      const prompt = `Create a high-quality social media image: ${content}`
      console.log('Sending prompt:', prompt)

      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate image')
      }

      const data = await response.json()
      if (!data.imageUrl) {
        throw new Error('No image URL in response')
      }

      setImageUrl(data.imageUrl)
      toast({
        title: "Success",
        description: "Image generated successfully",
      })
    } catch (error: any) {
      console.error('Error generating image:', error)
      setImageGenerateState({
        loading: false,
        error: error.message || 'Failed to generate image'
      })
      toast({
        title: "Error",
        description: error.message || 'Failed to generate image',
        variant: "destructive",
      })
    } finally {
      setImageGenerateState(prev => ({ ...prev, loading: false }))
    }
  }

  async function onSubmit(values: PostFormValues) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user?.id,
          content: values.content,
          scheduled_for: values.scheduledFor,
          status: values.scheduledFor ? 'scheduled' : 'draft',
          platform: 'facebook',
          media_urls: imageUrl ? [imageUrl] : []
        })

      if (postError) throw postError

      toast({
        title: "Success",
        description: "Post created successfully",
      })

      setOpen(false)
      form.reset()
      setImageUrl(null)
      router.refresh()
    } catch (error) {
      console.error('Error creating post:', error)
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      })
    }
  }

  function removeImage() {
    setImageUrl(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>
        <Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
    <FormField
      control={form.control}
      name="content"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center justify-between">
            Content
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateAICaption}
                disabled={generateState.loading}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {generateState.loading ? "Generating..." : "Generate with AI"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateAIImage}
                disabled={imageGenerateState.loading}
              >
                {imageGenerateState.loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Generate Image
                  </>
                )}
              </Button>
            </div>
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder="What's on your mind?"
              className="min-h-[100px] resize-none"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    {generateState.error && (
      <Alert variant="destructive">
        <AlertDescription>{generateState.error}</AlertDescription>
      </Alert>
    )}
{!imageUrl && (
              <PromptSuggestions
                onSelect={(prompt) => {
                  form.setValue('content', prompt)
                  generateAIImage()
                }}
              />
            )}

            {imageUrl && (
              <ImagePreview
                src={imageUrl}
                onRemove={() => setImageUrl(null)}
              />
            )}
            {/* Error alerts */}
            {generateState.error && (
              <Alert variant="destructive">
                <AlertDescription>{generateState.error}</AlertDescription>
              </Alert>
            )}
             {imageGenerateState.error && (
              <Alert variant="destructive">
                <AlertDescription>{imageGenerateState.error}</AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="scheduledFor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule For (Optional)</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "PPP 'at' p")
                          ) : (
                            <span>Pick a date and time</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating..." : "Create Post"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}