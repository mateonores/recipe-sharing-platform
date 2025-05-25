import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* 404 Illustration */}
        <div className="space-y-4">
          <div className="text-8xl font-bold text-gray-300">404</div>
          <h1 className="text-3xl font-bold text-gray-900">Page Not Found</h1>
          <p className="text-gray-600 text-lg">
            Oops! The page you&apos;re looking for doesn&apos;t exist. It might
            have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        {/* Recipe-themed illustration */}
        <div className="flex justify-center">
          <div className="text-6xl opacity-50">🍳</div>
        </div>

        {/* Navigation options */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/">Go Home</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/recipes">Browse Recipes</Link>
            </Button>
          </div>

          <div className="text-sm text-gray-500">
            Or try searching for what you need:
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/categories">Categories</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/recipes/create">Create Recipe</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>

        {/* Help text */}
        <div className="pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            If you think this is an error, please{" "}
            <a
              href="mailto:support@recipeplatform.com"
              className="text-blue-600 hover:underline"
            >
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
