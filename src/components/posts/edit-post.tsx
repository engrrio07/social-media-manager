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
  Wand2,
  HelpCircle,
  Eye,
  Pencil,
  Upload,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImagePreview } from "./image-preview"
import { DateTimePicker } from "../ui/date-time-picker"
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
import { isValidImageType, formatFileSize } from "@/lib/utils"

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

type ExistingImage = {
  url: string;
  isExisting: true;
}

type UploadedImage = {
  url: string;
  file: File;
  isExisting?: false;
}

type ImageItem = ExistingImage | UploadedImage;

export function EditPost({ post, children, onUpdate }: EditPostProps) {
  const [open, setOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(post.media_urls?.[0] || null)
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")
  const [imageGenerateState, setImageGenerateState] = useState({ loading: false, error: null })
  const [captionGenerateState, setCaptionGenerateState] = useState({ loading: false, error: null })
  const [uploadedImages, setUploadedImages] = useState<ImageItem[]>(() => 
    post.media_urls?.filter(url => url !== imageUrl).map(url => ({
      url,
      isExisting: true as const
    })) || []
  )
  const [uploadError, setUploadError] = useState<string | null>(null)

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

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files?.length) return

    setUploadError(null)
    const newImages: UploadedImage[] = []

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
        newImages.push({ url, file })

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
      const removed = newImages[index]
      if (!removed.isExisting) {
        URL.revokeObjectURL(removed.url) // Clean up URL only for new uploads
      }
      newImages.splice(index, 1)
      return newImages
    })
  }

  async function onSubmit(values: PostFormValues) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      // Initialize imageUrls array
      const imageUrls: string[] = []

      // Add AI generated/first image if it exists and wasn't removed
      if (imageUrl) {
        // Check if this is an existing image from the original post
        const isExistingImage = post.media_urls?.includes(imageUrl)
        if (isExistingImage) {
          // Only add if it's an existing image that we want to keep
          imageUrls.push(imageUrl)
        } else if (!post.media_urls?.includes(imageUrl)) {
          // This is a newly generated AI image
          imageUrls.push(imageUrl)
        }
      }

      // Add remaining existing images that weren't removed
      const remainingExistingImages = uploadedImages
        .filter(img => img.isExisting)
        .map(img => img.url)
      imageUrls.push(...remainingExistingImages)

      // Upload new images
      for (const image of uploadedImages.filter(img => !img.isExisting)) {
        const fileName = `${Date.now()}-${(image as UploadedImage).file.name}`
        const { data, error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, (image as UploadedImage).file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(data.path)

        imageUrls.push(publicUrl)
      }

      // Update the post
      const { error: postError } = await supabase
        .from('posts')
        .update({
          content: values.content,
          scheduled_for: values.scheduledFor,
          status: values.scheduledFor ? 'scheduled' : 'draft',
          media_urls: imageUrls
        })
        .eq('id', post.id)

      if (postError) throw postError

      toast({
        title: "Success",
        description: "Post updated successfully",
      })

      setOpen(false)
      onUpdate()
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
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
                        // Programmatically click the hidden input
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
                            {image.isExisting ? 'Existing image' : formatFileSize((image as UploadedImage).file.size)}
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
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault()
                      setOpen(false)
                    }}
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
                    {form.formState.isSubmitting ? "Updating..." : "Update Post"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardContent className="space-y-4 pt-6">
                {/* Image Grid Display */}
                {(imageUrl || uploadedImages.length > 0) && (
                  <div className="aspect-square w-full relative rounded-lg overflow-hidden">
                    {/* If we have 1 image */}
                    {(!imageUrl && uploadedImages.length === 1) || (imageUrl && uploadedImages.length === 0) ? (
                      <img
                        src={imageUrl || uploadedImages[0].url}
                        alt="Post preview"
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      // Grid layout for multiple images
                      <div className="grid grid-cols-2 gap-1 h-full">
                        {/* First image (always shown) */}
                        <img
                          src={imageUrl || uploadedImages[0].url}
                          alt="First image"
                          className="object-cover w-full h-full"
                        />
                        
                        {/* Second image slot */}
                        {(uploadedImages.length > 0 && imageUrl) || uploadedImages.length > 1 ? (
                          <img
                            src={imageUrl ? uploadedImages[0].url : uploadedImages[1].url}
                            alt="Second image"
                            className="object-cover w-full h-full"
                          />
                        ) : null}
                        
                        {/* Third image slot */}
                        {uploadedImages.length > (imageUrl ? 1 : 2) && (
                          <img
                            src={imageUrl ? uploadedImages[1].url : uploadedImages[2].url}
                            alt="Third image"
                            className="object-cover w-full h-full"
                          />
                        )}
                        
                        {/* Fourth image slot or +N overlay */}
                        {uploadedImages.length > (imageUrl ? 2 : 3) && (
                          <div className="relative">
                            <img
                              src={imageUrl ? uploadedImages[2].url : uploadedImages[3].url}
                              alt="Fourth image"
                              className="object-cover w-full h-full"
                            />
                            {/* Overlay for additional images */}
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