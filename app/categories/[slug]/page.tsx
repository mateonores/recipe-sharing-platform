import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  // Find the category from the slug
  const category = categories.find((cat) => cat.slug === params.slug);

  // Filter recipes by category
  const categoryRecipes = allRecipes.filter(
    (recipe) => recipe.category.toLowerCase() === params.slug
  );

  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <div className="flex flex-col gap-8">
        {category ? (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-200 text-2xl">
                  {category.emoji}
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {category.name} Recipes
                </h1>
              </div>
              <p className="text-gray-500 max-w-3xl">{category.description}</p>
            </div>

            {categoryRecipes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categoryRecipes.map((recipe) => (
                  <div key={recipe.id}>
                    <Link
                      href={`/recipes/${recipe.id}`}
                      className="block h-full"
                    >
                      <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                        <div className="relative aspect-video overflow-hidden">
                          <Image
                            src={recipe.image}
                            alt={recipe.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <CardHeader className="p-4">
                          <div className="flex gap-2 flex-wrap mb-2">
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              {recipe.category}
                            </span>
                            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-800 rounded">
                              {recipe.time} mins
                            </span>
                          </div>
                          <CardTitle className="line-clamp-2 text-lg">
                            {recipe.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {recipe.description}
                          </p>
                        </CardContent>
                        <CardFooter className="p-4 border-t text-sm flex justify-between text-gray-500">
                          <span>{recipe.author}</span>
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
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">No recipes found</h2>
                <p className="text-gray-500 mb-6">
                  There are no recipes in this category yet.
                </p>
                <Button asChild>
                  <Link href="/recipes/create">Create the First Recipe</Link>
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold mb-4">Category Not Found</h1>
            <p className="text-gray-500 mb-6">
              We couldn&apos;t find the category you&apos;re looking for.
            </p>
            <Button asChild>
              <Link href="/recipes">Browse All Recipes</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

const categories = [
  {
    name: "Breakfast",
    emoji: "🍳",
    slug: "breakfast",
    description:
      "Start your day right with these delicious breakfast recipes, from quick and easy options to weekend brunch favorites.",
  },
  {
    name: "Lunch",
    emoji: "🥪",
    slug: "lunch",
    description:
      "Perfect midday meal ideas that are satisfying and quick to prepare, whether you&apos;re at home or packing lunch for work or school.",
  },
  {
    name: "Dinner",
    emoji: "🍝",
    slug: "dinner",
    description:
      "Hearty and delicious dinner recipes for the whole family, including quick weeknight meals and special occasion dishes.",
  },
  {
    name: "Desserts",
    emoji: "🍰",
    slug: "desserts",
    description:
      "Indulge your sweet tooth with these mouthwatering desserts, from simple cookies to impressive cakes and everything in between.",
  },
  {
    name: "Vegan",
    emoji: "🥗",
    slug: "vegan",
    description:
      "Plant-based recipes that are both delicious and satisfying, perfect for vegans or anyone looking to incorporate more plant foods.",
  },
  {
    name: "Quick Meals",
    emoji: "⏱️",
    slug: "quick-meals",
    description:
      "Delicious recipes ready in 30 minutes or less, perfect for busy weeknights when you need dinner on the table fast.",
  },
];

const allRecipes = [
  {
    id: "1",
    title: "Homemade Margherita Pizza",
    description:
      "A classic Italian pizza with fresh mozzarella, tomatoes, and basil on a crispy crust.",
    author: "Chef Maria",
    category: "Dinner",
    time: 45,
    rating: 4.8,
    image: "/recipes/pizza.jpg",
  },
  {
    id: "2",
    title: "Classic Beef Burger with Caramelized Onions",
    description:
      "Juicy beef burgers topped with sweet caramelized onions and all the fixings.",
    author: "Chef John",
    category: "Lunch",
    time: 30,
    rating: 4.6,
    image: "/recipes/burger.jpg",
  },
  {
    id: "3",
    title: "Chocolate Lava Cake",
    description:
      "Decadent chocolate cake with a molten chocolate center, perfect for chocolate lovers.",
    author: "Chef Lily",
    category: "Desserts",
    time: 25,
    rating: 4.9,
    image: "/recipes/chocolate-cake.jpg",
  },
  {
    id: "4",
    title: "Avocado Toast with Poached Eggs",
    description:
      "Creamy avocado spread on toasted sourdough, topped with perfectly poached eggs and a sprinkle of red pepper flakes.",
    author: "Chef Emma",
    category: "Breakfast",
    time: 15,
    rating: 4.3,
    image: "/recipes/avocado-toast.jpg",
  },
  {
    id: "5",
    title: "Vegetable Stir Fry with Tofu",
    description:
      "Quick and healthy stir-fried vegetables with crispy tofu in a savory sauce.",
    author: "Chef Mei",
    category: "Vegan",
    time: 25,
    rating: 4.2,
    image: "/recipes/stir-fry.jpg",
  },
  {
    id: "6",
    title: "15-Minute Pasta Aglio e Olio",
    description:
      "A simple Italian pasta dish with garlic, olive oil, chili flakes, and parsley. Quick, delicious, and satisfying.",
    author: "Chef Antonio",
    category: "Quick-meals",
    time: 15,
    rating: 4.5,
    image: "/recipes/pasta.jpg",
  },
];
