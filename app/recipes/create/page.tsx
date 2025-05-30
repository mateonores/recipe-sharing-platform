"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type Category = Database["public"]["Tables"]["categories"]["Row"];

// Form validation schema
const recipeFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be less than 500 characters"),
  category_id: z.string().min(1, "Category is required"),
  time: z
    .number()
    .min(1, "Total time must be at least 1 minute")
    .max(1440, "Total time cannot exceed 24 hours"),
  ingredients: z
    .array(z.string().min(1, "Ingredient cannot be empty"))
    .min(1, "At least one ingredient is required"),
  instructions: z
    .array(z.string().min(1, "Instruction cannot be empty"))
    .min(1, "At least one instruction is required"),
  image: z.instanceof(File).optional(),
});

type RecipeFormValues = z.infer<typeof recipeFormSchema>;

export default function CreateRecipePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category_id: "",
      time: 30,
      ingredients: [""],
      instructions: [""],
      image: undefined,
    },
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
  }, [user, router]);

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("name");

        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  function addIngredient() {
    const currentIngredients = form.getValues("ingredients");
    form.setValue("ingredients", [...currentIngredients, ""]);
  }

  function removeIngredient(index: number) {
    const currentIngredients = form.getValues("ingredients");
    if (currentIngredients.length > 1) {
      form.setValue(
        "ingredients",
        currentIngredients.filter((_, i) => i !== index)
      );
    }
  }

  function addInstruction() {
    const currentInstructions = form.getValues("instructions");
    form.setValue("instructions", [...currentInstructions, ""]);
  }

  function removeInstruction(index: number) {
    const currentInstructions = form.getValues("instructions");
    if (currentInstructions.length > 1) {
      form.setValue(
        "instructions",
        currentInstructions.filter((_, i) => i !== index)
      );
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      form.setValue("image", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function uploadImage(file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user!.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from("recipe-images")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Error uploading image:", uploadError);

        // If bucket doesn't exist, provide helpful error message
        if (uploadError.message.includes("Bucket not found")) {
          toast.error(
            "Image storage not configured. Recipe will be created without image."
          );
          return null;
        }

        toast.error(
          "Failed to upload image. Recipe will be created without image."
        );
        return null;
      }

      const { data } = supabase.storage
        .from("recipe-images")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(
        "Failed to upload image. Recipe will be created without image."
      );
      return null;
    }
  }

  async function onSubmit(values: RecipeFormValues) {
    if (!user) {
      toast.error("You must be logged in to create a recipe");
      return;
    }

    setIsSubmitting(true);

    try {
      // Filter out empty ingredients and instructions
      const filteredIngredients = values.ingredients.filter(
        (ingredient) => ingredient.trim() !== ""
      );
      const filteredInstructions = values.instructions.filter(
        (instruction) => instruction.trim() !== ""
      );

      if (filteredIngredients.length === 0) {
        toast.error("Please add at least one ingredient");
        setIsSubmitting(false);
        return;
      }

      if (filteredInstructions.length === 0) {
        toast.error("Please add at least one instruction");
        setIsSubmitting(false);
        return;
      }

      // Upload image if provided
      let imageUrl: string | null = null;
      if (values.image) {
        toast.loading("Uploading image...");
        imageUrl = await uploadImage(values.image);
        if (!imageUrl) {
          toast.error(
            "Failed to upload image. Recipe will be created without image."
          );
        }
        toast.dismiss();
      }

      // Create recipe in database
      const { data, error } = await supabase
        .from("recipes")
        .insert({
          user_id: user.id,
          title: values.title,
          description: values.description,
          category_id: values.category_id,
          time: values.time,
          ingredients: filteredIngredients,
          instructions: filteredInstructions,
          image_url: imageUrl,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Recipe created successfully!");
      router.push(`/recipes/${data.id}`);
    } catch (error) {
      console.error("Error creating recipe:", error);
      toast.error("Failed to create recipe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show loading if user is not loaded yet
  if (!user) {
    return (
      <div className="container py-12 px-4 md:px-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12 px-4 md:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create a New Recipe</h1>
          <p className="text-gray-500">
            Share your culinary masterpiece with our community
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-4 p-6 bg-slate-50 rounded-lg">
              <h2 className="text-xl font-semibold">Basic Information</h2>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipe Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="E.g., Homemade Margherita Pizza"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Briefly describe your recipe"
                        className="min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoadingCategories}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isLoadingCategories
                                  ? "Loading categories..."
                                  : "Select a category"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.emoji && `${category.emoji} `}
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Time (minutes) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="E.g., 45"
                          min="1"
                          max="1440"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Include both prep and cook time
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-4 p-6 bg-slate-50 rounded-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Ingredients *</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addIngredient}
                  className="h-8"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Ingredient
                </Button>
              </div>

              {form.watch("ingredients").map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`ingredients.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder={`Ingredient ${
                              index + 1
                            } (e.g., 2 cups flour)`}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeIngredient(index)}
                    disabled={form.watch("ingredients").length <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Instructions */}
            <div className="space-y-4 p-6 bg-slate-50 rounded-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Instructions *</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addInstruction}
                  className="h-8"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </div>

              {form.watch("instructions").map((_, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-medium text-sm mt-2">
                    {index + 1}
                  </div>
                  <FormField
                    control={form.control}
                    name={`instructions.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Textarea
                            placeholder={`Step ${
                              index + 1
                            }: Describe what to do in detail`}
                            className="min-h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeInstruction(index)}
                    disabled={form.watch("instructions").length <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Image Upload */}
            <div className="space-y-4 p-6 bg-slate-50 rounded-lg">
              <h2 className="text-xl font-semibold">Recipe Image</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <FormLabel>Upload an Image</FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="mt-2"
                  />
                  <FormDescription>
                    Upload a high-quality image of your finished dish. Maximum
                    file size: 5MB. Recommended size: 1200×800 pixels.
                  </FormDescription>
                </div>
                {imagePreview && (
                  <div className="relative aspect-video rounded-md overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Recipe preview"
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating Recipe..." : "Create Recipe"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
