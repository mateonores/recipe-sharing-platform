import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";

export default function RecipesPage() {
  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Browse Recipes</h1>
          <p className="text-gray-500">
            Discover delicious recipes from our community
          </p>
        </div>

        {/* Search and filter */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:max-w-sm">
            <Input placeholder="Search recipes..." />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="h-8">
              All
            </Button>
            <Button variant="outline" size="sm" className="h-8">
              Breakfast
            </Button>
            <Button variant="outline" size="sm" className="h-8">
              Lunch
            </Button>
            <Button variant="outline" size="sm" className="h-8">
              Dinner
            </Button>
            <Button variant="outline" size="sm" className="h-8">
              Desserts
            </Button>
            <Button variant="outline" size="sm" className="h-8">
              Vegan
            </Button>
          </div>
        </div>

        {/* Recipe grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recipes.map((recipe) => (
            <div key={recipe.id}>
              <Link href={`/recipes/${recipe.id}`} className="block h-full">
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

        {/* Pagination */}
        <div className="flex justify-center mt-8 gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" className="px-3">
            1
          </Button>
          <Button variant="outline" size="sm" className="px-3">
            2
          </Button>
          <Button variant="outline" size="sm" className="px-3">
            3
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

const recipes = [
  {
    id: "1",
    title: "Homemade Margherita Pizza",
    description:
      "A classic Italian pizza with fresh mozzarella, tomatoes, and basil on a crispy crust.",
    author: "Chef Maria",
    category: "Italian",
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
    category: "American",
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
    category: "Dessert",
    time: 25,
    rating: 4.9,
    image: "/recipes/chocolate-cake.jpg",
  },
  {
    id: "4",
    title: "Thai Green Curry with Vegetables",
    description:
      "A fragrant and spicy Thai curry packed with fresh vegetables and herbs.",
    author: "Chef Sam",
    category: "Thai",
    time: 35,
    rating: 4.7,
    image: "/recipes/thai-curry.jpg",
  },
  {
    id: "5",
    title: "Homemade Pasta Carbonara",
    description:
      "Creamy pasta carbonara with pancetta, eggs, and parmesan cheese.",
    author: "Chef Antonio",
    category: "Italian",
    time: 20,
    rating: 4.5,
    image: "/recipes/carbonara.jpg",
  },
  {
    id: "6",
    title: "Avocado Toast with Poached Eggs",
    description:
      "Creamy avocado spread on toasted sourdough, topped with perfectly poached eggs.",
    author: "Chef Emma",
    category: "Breakfast",
    time: 15,
    rating: 4.3,
    image: "/recipes/avocado-toast.jpg",
  },
  {
    id: "7",
    title: "Blueberry Pancakes with Maple Syrup",
    description:
      "Fluffy pancakes loaded with fresh blueberries and drizzled with pure maple syrup.",
    author: "Chef David",
    category: "Breakfast",
    time: 20,
    rating: 4.4,
    image: "/recipes/pancakes.jpg",
  },
  {
    id: "8",
    title: "Vegetable Stir Fry with Tofu",
    description:
      "Quick and healthy stir-fried vegetables with crispy tofu in a savory sauce.",
    author: "Chef Mei",
    category: "Vegan",
    time: 25,
    rating: 4.2,
    image: "/recipes/stir-fry.jpg",
  },
];
