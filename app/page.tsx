import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-12 pb-8">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-slate-50">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl">
                  Share Your Culinary Masterpieces
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl">
                  Join our community of food enthusiasts. Discover new recipes
                  or share your own creations with the world.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg">
                  <Link href="/recipes/create">Share a Recipe</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/recipes">Browse Recipes</Link>
                </Button>
              </div>
            </div>
            <div className="mx-auto w-full max-w-[500px] relative aspect-video lg:aspect-square overflow-hidden rounded-xl">
              <Image
                src="/hero-image.jpg"
                alt="Delicious food spread on a table"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Recipes */}
      <section className="container px-4 md:px-6">
        <div className="flex flex-col gap-4">
          <h2 className="text-3xl font-bold tracking-tight">
            Featured Recipes
          </h2>
          <p className="text-gray-500">Our most popular recipes this week</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredRecipes.map((recipe) => (
              <div key={recipe.id}>
                <Link href={`/recipes/${recipe.id}`} className="block h-full">
                  <Card className="overflow-hidden h-full">
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={recipe.image}
                        alt={recipe.title}
                        fill
                        className="object-cover transition-transform hover:scale-105 duration-300"
                      />
                    </div>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
                          {recipe.category}
                        </span>
                        <span className="text-sm text-gray-500">
                          {recipe.time} mins
                        </span>
                      </div>
                      <CardTitle className="line-clamp-2">
                        {recipe.title}
                      </CardTitle>
                    </CardContent>
                    <CardFooter className="text-sm text-gray-500 flex justify-between">
                      <span>By {recipe.author}</span>
                      <div className="flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-yellow-400"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span>{recipe.rating}</span>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-6">
            <Button variant="outline" asChild>
              <Link href="/recipes">View All Recipes</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container px-4 md:px-6">
        <div className="flex flex-col gap-4">
          <h2 className="text-3xl font-bold tracking-tight">
            Browse by Category
          </h2>
          <p className="text-gray-500">
            Find recipes by your favorite cuisine or dish type
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/categories/${category.slug}`}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-slate-200">
                  <span className="text-2xl">{category.emoji}</span>
                </div>
                <span className="text-sm font-medium text-center">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const featuredRecipes = [
  {
    id: "1",
    title: "Homemade Margherita Pizza",
    author: "Chef Maria",
    category: "Italian",
    time: 45,
    rating: 4.8,
    image: "/recipes/pizza.jpg",
  },
  {
    id: "2",
    title: "Classic Beef Burger with Caramelized Onions",
    author: "Chef John",
    category: "American",
    time: 30,
    rating: 4.6,
    image: "/recipes/burger.jpg",
  },
  {
    id: "3",
    title: "Chocolate Lava Cake",
    author: "Chef Lily",
    category: "Dessert",
    time: 25,
    rating: 4.9,
    image: "/recipes/chocolate-cake.jpg",
  },
];

const categories = [
  { name: "Breakfast", emoji: "🍳", slug: "breakfast" },
  { name: "Lunch", emoji: "🥪", slug: "lunch" },
  { name: "Dinner", emoji: "🍝", slug: "dinner" },
  { name: "Desserts", emoji: "🍰", slug: "desserts" },
  { name: "Vegan", emoji: "🥗", slug: "vegan" },
  { name: "Quick Meals", emoji: "⏱️", slug: "quick-meals" },
];
