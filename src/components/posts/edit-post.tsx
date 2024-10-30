// src/components/posts/edit-post.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  ImageIcon, 
  Loader2, 
  CalendarIcon,
  Wand2
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
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

interface EditPostProps {
  post: {
    id: string;
    content: string;
    media_urls?: string[];
    scheduled_for?: string;
  };
  children: React.ReactNode;
  onUpdate: () => void;
}

const postSchema = z.object({
  content: z.string()
    .min(1, "Content is required")
    .max(2200, "Content must be less than 2200 characters"),
  scheduledFor: z.date().optional(),
})

type PostFormValues = z.infer<typeof postSchema>

export function EditPost({ post, children, onUpdate }: EditPostProps) {
  const [open, setOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(post.media_urls?.[0] || null)
  const [imageGenerateState, setImageGenerateState] = useState({ loading: false, error: null })
  const [captionGenerateState, setCaptionGenerateState] = useState({ loading: false, error: null })

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: post.content,
      scheduledFor: post.scheduled_for ? new Date(post.scheduled_for) : undefined,
    },
  })

  async function generateAICaption() {
    setCaptionGenerateState({ loading: true, error: null })
    
    try {
      const content = form.getValues('content')
      if (!content) {
        throw new Error('Please enter some initial content or topic')
      }

      const response = await fetch('/api/ai/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate caption')
      }

      const data = await response.json()
      form.setValue('content', data.caption)
      
      toast({
        title: "Success",
        description: "Caption generated successfully",
      })
    } catch (error: any) {
      console.error('Error generating caption:', error)
      setCaptionGenerateState({
        loading: false,
        error: error.message || 'Failed to generate caption'
      })
      toast({
        title: "Error",
        description: error.message || 'Failed to generate caption',
        variant: "destructive",
      })
    } finally {
      setCaptionGenerateState(prev => ({ ...prev, loading: false }))
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
      const { error: postError } = await supabase
        .from('posts')
        .update({
          content: values.content,
          scheduled_for: values.scheduledFor,
          status: values.scheduledFor ? 'scheduled' : 'draft',
          media_urls: imageUrl ? [imageUrl] : [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id)

      if (postError) throw postError

      toast({
        title: "Success",
        description: "Post updated successfully",
      })

      setOpen(false)
      onUpdate()
      router.refresh()
    } catch (error: any) {
      console.error('Error updating post:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update post",
        variant: "destructive",
      })
    }
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
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateAICaption}
                      disabled={captionGenerateState.loading}
                    >
                      {captionGenerateState.loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Writing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          Generate Caption
                        </>
                      )}
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
                    Generating Image...
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

            {imageUrl && (
              <ImagePreview
                src={imageUrl}
                onRemove={() => setImageUrl(null)}
              />
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

            {(imageGenerateState.error || captionGenerateState.error) && (
              <Alert variant="destructive">
                <AlertDescription>
                  {imageGenerateState.error || captionGenerateState.error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={
                  form.formState.isSubmitting || 
                  imageGenerateState.loading || 
                  captionGenerateState.loading
                }
              >
                {form.formState.isSubmitting ? "Creating..." : "Create Post"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}