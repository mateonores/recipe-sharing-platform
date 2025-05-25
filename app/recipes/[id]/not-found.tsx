import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RecipeNotFound() {
  return (
    <div className="container py-12 px-4 md:px-6">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Recipe-themed 404 */}
        <div className="space-y-4">
          <div className="text-6xl">🍽️</div>
          <h1 className="text-4xl font-bold text-gray-900">Recipe Not Found</h1>
          <p className="text-gray-600 text-lg">
            Sorry, the recipe you&apos;re looking for doesn&apos;t exist. It
            might have been removed, or you may have followed an incorrect link.
          </p>
        </div>

        {/* Navigation options */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/recipes">Browse All Recipes</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/recipes/create">Create New Recipe</Link>
            </Button>
          </div>

          <div className="text-sm text-gray-500">
            Or explore recipes by category:
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/categories">All Categories</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/categories/appetizers">Appetizers</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/categories/main-courses">Main Courses</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/categories/desserts">Desserts</Link>
            </Button>
          </div>
        </div>

        {/* Back to home */}
        <div className="pt-8 border-t border-gray-200">
          <Button variant="link" asChild>
            <Link href="/">← Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
