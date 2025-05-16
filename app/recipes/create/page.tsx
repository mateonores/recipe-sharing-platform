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
import { PlusCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface RecipeFormValues {
  title: string;
  description: string;
  category: string;
  cookTime: string;
  prepTime: string;
  servings: string;
  ingredients: string[];
  instructions: string[];
  image?: File | null;
}

export default function CreateRecipePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<RecipeFormValues>({
    defaultValues: {
      title: "",
      description: "",
      category: "",
      cookTime: "",
      prepTime: "",
      servings: "",
      ingredients: [""],
      instructions: [""],
      image: null,
    },
  });

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
      form.setValue("image", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function onSubmit(values: RecipeFormValues) {
    setIsSubmitting(true);

    // In a real app, you would upload the image and save the recipe to your database
    setTimeout(() => {
      console.log(values);
      toast.success("Recipe created successfully!");
      router.push("/recipes");
      setIsSubmitting(false);
    }, 1500);
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
                    <FormLabel>Recipe Title</FormLabel>
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
                    <FormLabel>Description</FormLabel>
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
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="breakfast">Breakfast</SelectItem>
                          <SelectItem value="lunch">Lunch</SelectItem>
                          <SelectItem value="dinner">Dinner</SelectItem>
                          <SelectItem value="dessert">Dessert</SelectItem>
                          <SelectItem value="snacks">Snacks</SelectItem>
                          <SelectItem value="drinks">Drinks</SelectItem>
                          <SelectItem value="vegan">Vegan</SelectItem>
                          <SelectItem value="vegetarian">Vegetarian</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="servings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Servings</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Number of servings"
                          min="1"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="prepTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prep Time (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="E.g., 15"
                          min="0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cookTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cook Time (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="E.g., 30"
                          min="0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-4 p-6 bg-slate-50 rounded-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Ingredients</h2>
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
                            placeholder={`Ingredient ${index + 1}`}
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
                <h2 className="text-xl font-semibold">Instructions</h2>
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
                            }: Describe what to do`}
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
                    Upload a high-quality image of your finished dish.
                    Recommended size: 1200×800 pixels.
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
