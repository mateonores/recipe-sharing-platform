import Link from "next/link";

export default function CategoriesPage() {
  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Browse by Category
          </h1>
          <p className="text-gray-500">
            Explore our recipes organized by category to find exactly what
            you&apos;re looking for
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="flex items-start gap-4 p-6 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-200 text-2xl">
                {category.emoji}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">{category.name}</h2>
                <p className="text-gray-500 text-sm line-clamp-2">
                  {category.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
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
