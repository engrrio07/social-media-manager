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
  HelpCircle,
  Eye,
  Pencil,
  Upload,
  X,
} from "lucide-react"
import { isValidImageType, formatFileSize } from "@/lib/utils"
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { ImagePreview } from "./image-preview"
import { DateTimePicker } from "../ui/date-time-picker"
import { 
  postContentSchema, 
  type PostContent, 
  type GenerateState,
  type MediaItem,
} from "@/lib/schemas/post"

export function CreatePost({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")
  const [imageGenerateState, setImageGenerateState] = useState<GenerateState>({
    loading: false,
    error: null,
  })
  const [captionGenerateState, setCaptionGenerateState] = useState<GenerateState>({
    loading: false,
    error: null,
  })
  const [uploadedImages, setUploadedImages] = useState<MediaItem[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const form = useForm<PostContent>({
    resolver: zodResolver(postContentSchema),
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

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files?.length) return

    setUploadError(null)
    const newImages: MediaItem[] = []

    for (const file of Array.from(files)) {
      try {
        if (!isValidImageType(file)) {
          setUploadError('Please upload only JPEG, PNG, or WebP images')
          continue
        }

        if (file.size > 5 * 1024 * 1024) {
          setUploadError('Images must be less than 5MB')
          continue
        }

        const url = URL.createObjectURL(file)
        newImages.push({ url, file, isExisting: false })

        toast({
          title: "Success",
          description: `${file.name} uploaded successfully`,
        })
      } catch (error) {
        console.error('Error handling image upload:', error)
        setUploadError('Error uploading image. Please try again.')
        toast({
          title: "Error",
          description: "Failed to upload image",
          variant: "destructive",
        })
      }
    }

    setUploadedImages(prev => [...prev, ...newImages])
    event.target.value = ''
  }

  function removeUploadedImage(index: number) {
    setUploadedImages(prev => {
      const newImages = [...prev]
      URL.revokeObjectURL(newImages[index].url)
      newImages.splice(index, 1)
      return newImages
    })
  }

  async function onSubmit(values: PostContent) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      const imageUrls: string[] = []

      if (imageUrl) {
        imageUrls.push(imageUrl)
      }

      for (const image of uploadedImages) {
        if (!image.file) continue

        const fileName = `${Date.now()}-${image.file.name}`
        const { data, error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, image.file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(data.path)

        imageUrls.push(publicUrl)
      }

      const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: user?.id,
        content: values.content,
        scheduled_for: values.scheduledFor,
        status: values.scheduledFor ? 'scheduled' : 'draft',
        platform: 'facebook',
        media_urls: imageUrls
      })
      .select()
      .single()

      if (postError) throw postError

      toast({
        title: "Success",
        description: "Post created successfully",
      })

      setOpen(false)
      form.reset()
      setImageUrl(null)
      setUploadedImages([])
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "edit" | "preview")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit">
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
                        <div className="relative">
                          <Textarea
                            placeholder="What's on your mind?"
                            className="min-h-[100px] resize-none pr-12"
                            {...field}
                          />
                          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                            {field.value.length}/2200
                          </div>
                        </div>
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

<div className="space-y-4">
  <div className="flex items-center justify-between">
    <FormLabel>Upload Images</FormLabel>
    <Button 
      type="button" 
      variant="outline" 
      size="sm"
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/webp';
        input.multiple = true;
        input.onchange = (e) => handleImageUpload(e as any);
        input.click();
      }}
    >
      <Upload className="mr-2 h-4 w-4" />
      Upload Images
    </Button>
  </div>

  {uploadError && (
    <Alert variant="destructive">
      <AlertDescription>{uploadError}</AlertDescription>
    </Alert>
  )}

  {uploadedImages.length > 0 && (
    <div className="grid grid-cols-2 gap-4">
      {uploadedImages.map((image, index) => (
        <div key={index} className="relative">
          <img
            src={image.url}
            alt={`Uploaded ${index + 1}`}
            className="w-full h-32 object-cover rounded-lg"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background shadow-sm"
            onClick={() => removeUploadedImage(index)}
          >
            <X className="h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            {image.file ? `${(image.file.size / (1024 * 1024)).toFixed(2)} MB` : '0 B'}
          </p>
        </div>
      ))}
    </div>
  )}
</div>

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
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardContent className="space-y-4 pt-6">
                {(imageUrl || uploadedImages.length > 0) && (
                  <div className="aspect-square w-full relative rounded-lg overflow-hidden">
                    {(!imageUrl && uploadedImages.length === 1) || (imageUrl && uploadedImages.length === 0) ? (
                      <img
                        src={imageUrl || uploadedImages[0].url}
                        alt="Post preview"
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-1 h-full">
                        <img
                          src={imageUrl || uploadedImages[0].url}
                          alt="First image"
                          className="object-cover w-full h-full"
                        />
                        
                        {(uploadedImages.length > 0 && imageUrl) || uploadedImages.length > 1 ? (
                          <img
                            src={imageUrl ? uploadedImages[0].url : uploadedImages[1].url}
                            alt="Second image"
                            className="object-cover w-full h-full"
                          />
                        ) : null}
                        
                        {uploadedImages.length > (imageUrl ? 1 : 2) && (
                          <img
                            src={imageUrl ? uploadedImages[1].url : uploadedImages[2].url}
                            alt="Third image"
                            className="object-cover w-full h-full"
                          />
                        )}
                        
                        {uploadedImages.length > (imageUrl ? 2 : 3) && (
                          <div className="relative">
                            <img
                              src={imageUrl ? uploadedImages[2].url : uploadedImages[3].url}
                              alt="Fourth image"
                              className="object-cover w-full h-full"
                            />
                            {uploadedImages.length > (imageUrl ? 3 : 4) && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white text-lg font-medium">
                                  +{uploadedImages.length - (imageUrl ? 3 : 4)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm whitespace-pre-wrap">
                    {form.getValues("content")}
                  </p>
                  {form.getValues("scheduledFor") && (
                    <p className="text-xs text-muted-foreground">
                      Scheduled for: {form.getValues("scheduledFor")?.toLocaleString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}