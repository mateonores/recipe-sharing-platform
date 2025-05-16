import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

interface RecipePageProps {
  params: {
    id: string;
  };
}

export default function RecipePage({ params }: RecipePageProps) {
  // In a real app, we would fetch the recipe from the database
  // For now, we'll use mock data
  const recipe = recipes.find((r) => r.id === params.id) || recipes[0];

  return (
    <div className="container py-12 px-4 md:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="flex flex-col space-y-6">
          <Link
            href="/recipes"
            className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1 w-fit"
          >
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
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to recipes
          </Link>

          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
                {recipe.category}
              </span>
              <span className="text-sm text-gray-500">{recipe.time} mins</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {recipe.title}
            </h1>
            <p className="text-gray-500 text-lg">{recipe.description}</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200">
              <Image
                src="/placeholder-avatar.jpg"
                alt={recipe.author}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-medium">Recipe by {recipe.author}</p>
              <p className="text-sm text-gray-500">
                Published on April 12, 2023
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
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
              <span className="font-medium">{recipe.rating}</span>
              <span className="text-gray-500">({recipe.reviews} reviews)</span>
            </div>
            <Button variant="outline" size="sm">
              Save Recipe
            </Button>
            <Button variant="outline" size="sm">
              Print
            </Button>
          </div>

          <div className="relative aspect-video overflow-hidden rounded-lg lg:hidden">
            <Image
              src={recipe.image}
              alt={recipe.title}
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-3">Ingredients</h2>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, i) => (
                  <li
                    key={i}
                    className="flex items-center space-x-2 text-gray-700"
                  >
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
                      className="text-green-500"
                    >
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">Instructions</h2>
              <ol className="space-y-4">
                {recipe.instructions.map((instruction, i) => (
                  <li key={i} className="flex space-x-4">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-medium text-sm">
                      {i + 1}
                    </div>
                    <p className="text-gray-700">{instruction}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="relative aspect-square overflow-hidden rounded-lg hidden lg:block">
            <Image
              src={recipe.image}
              alt={recipe.title}
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="bg-slate-50 p-6 rounded-lg">
            <h3 className="text-lg font-bold mb-4">Nutrition Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {recipe.nutrition.map((item) => (
                <div key={item.name} className="flex flex-col">
                  <span className="text-sm text-gray-500">{item.name}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border p-6 rounded-lg">
            <h3 className="text-lg font-bold mb-4">Comments (3)</h3>
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                        <Image
                          src="/placeholder-avatar.jpg"
                          alt={comment.author}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="font-medium">{comment.author}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {comment.date}
                    </span>
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4">Add Comment</Button>
          </div>
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
    reviews: 124,
    image: "/recipes/pizza.jpg",
    ingredients: [
      "500g pizza dough",
      "1 cup tomato sauce",
      "200g fresh mozzarella cheese",
      "Fresh basil leaves",
      "2 tablespoons olive oil",
      "Salt and pepper to taste",
    ],
    instructions: [
      "Preheat your oven to 475°F (245°C) with a pizza stone inside if you have one.",
      "Roll out the pizza dough on a floured surface to your desired thickness.",
      "Spread tomato sauce evenly over the dough, leaving a small border for the crust.",
      "Tear the fresh mozzarella into pieces and distribute over the sauce.",
      "Drizzle with olive oil and season with salt and pepper.",
      "Bake for 10-12 minutes or until the crust is golden and the cheese is bubbly.",
      "Remove from the oven, top with fresh basil leaves, and let cool slightly before slicing.",
    ],
    nutrition: [
      { name: "Calories", value: "285 kcal" },
      { name: "Protein", value: "12g" },
      { name: "Carbs", value: "35g" },
      { name: "Fat", value: "10g" },
      { name: "Fiber", value: "2g" },
      { name: "Sugar", value: "4g" },
    ],
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
    reviews: 89,
    image: "/recipes/burger.jpg",
    ingredients: [
      "500g ground beef (80/20 lean-to-fat ratio)",
      "1 teaspoon salt",
      "1/2 teaspoon black pepper",
      "4 burger buns",
      "2 large onions, thinly sliced",
      "2 tablespoons butter",
      "1 tablespoon olive oil",
      "Lettuce, tomato, and condiments of choice",
    ],
    instructions: [
      "Heat butter and olive oil in a pan over medium-low heat. Add the sliced onions with a pinch of salt and cook slowly, stirring occasionally, for 20-25 minutes until golden and caramelized.",
      "Meanwhile, gently mix the ground beef with salt and pepper. Divide into 4 equal portions and shape into patties about 1/2 inch thick. Press a slight indent in the center of each patty to prevent bulging during cooking.",
      "Heat a skillet or grill to medium-high heat. Cook the burgers for 3-4 minutes per side for medium doneness.",
      "Toast the burger buns lightly.",
      "Assemble the burgers with the caramelized onions and your choice of toppings and condiments.",
    ],
    nutrition: [
      { name: "Calories", value: "420 kcal" },
      { name: "Protein", value: "25g" },
      { name: "Carbs", value: "30g" },
      { name: "Fat", value: "22g" },
      { name: "Fiber", value: "2g" },
      { name: "Sugar", value: "5g" },
    ],
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
    reviews: 156,
    image: "/recipes/chocolate-cake.jpg",
    ingredients: [
      "113g dark chocolate, chopped",
      "113g unsalted butter",
      "2 whole eggs",
      "2 egg yolks",
      "100g granulated sugar",
      "30g all-purpose flour",
      "1 teaspoon vanilla extract",
      "Pinch of salt",
      "Powdered sugar for dusting",
    ],
    instructions: [
      "Preheat oven to 425°F (220°C). Butter and lightly flour four 6-ounce ramekins.",
      "Melt the chocolate and butter together in a double boiler or microwave in short bursts, stirring frequently until smooth.",
      "In a separate bowl, whisk together the eggs, egg yolks, sugar, and vanilla until light and fluffy.",
      "Slowly fold the melted chocolate mixture into the egg mixture.",
      "Fold in the flour and salt until just combined.",
      "Divide the batter evenly among the prepared ramekins.",
      "Bake for 12-14 minutes until the edges are firm but the center is still soft.",
      "Let cool for 1 minute, then run a knife around the edges and invert onto serving plates.",
      "Dust with powdered sugar and serve immediately with ice cream if desired.",
    ],
    nutrition: [
      { name: "Calories", value: "380 kcal" },
      { name: "Protein", value: "6g" },
      { name: "Carbs", value: "35g" },
      { name: "Fat", value: "25g" },
      { name: "Fiber", value: "2g" },
      { name: "Sugar", value: "28g" },
    ],
  },
];

const comments = [
  {
    id: "1",
    author: "Jane Cooper",
    date: "2 days ago",
    content:
      "I made this recipe yesterday and it was absolutely delicious! The whole family loved it. Will definitely make it again.",
  },
  {
    id: "2",
    author: "Alex Morgan",
    date: "1 week ago",
    content:
      "Great recipe! I added some extra basil and it turned out perfect. Thanks for sharing!",
  },
  {
    id: "3",
    author: "Sam Taylor",
    date: "2 weeks ago",
    content:
      "The instructions were easy to follow and the result was amazing. Five stars from me!",
  },
];
