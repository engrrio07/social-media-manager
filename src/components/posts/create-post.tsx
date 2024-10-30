// src/components/posts/create-post.tsx
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
  Wand2,
  HelpCircle
} from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ImagePreview } from "./image-preview"
import { DateTimePicker } from "../ui/date-time-picker"

const postSchema = z.object({
  content: z.string()
    .min(1, "Content is required")
    .max(2200, "Content must be less than 2200 characters"),
  scheduledFor: z.date().optional(),
})

type PostFormValues = z.infer<typeof postSchema>

type GenerateState = {
  loading: boolean;
  error: string | null;
}

export function CreatePost({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageGenerateState, setImageGenerateState] = useState<GenerateState>({
    loading: false,
    error: null,
  })
  const [captionGenerateState, setCaptionGenerateState] = useState<GenerateState>({
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
    } catch (error: any) {
      console.error('Error creating post:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
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
                  <div className="flex items-center gap-2">
    Content
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent className="max-w-[300px] space-y-2">
          <p>Tips for better results:</p>
          <ul className="list-disc pl-4 text-sm">
            <li>Start with a clear topic or theme</li>
            <li>Include specific details for image generation</li>
            <li>Use the AI caption generator for engaging text</li>
            <li>Keep your content focused and concise</li>
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
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
                    <DateTimePicker
                      date={field.value}
                      onSelect={field.onChange}
        />
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