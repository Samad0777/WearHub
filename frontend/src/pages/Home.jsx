import { Button } from "@/components/ui/button";
import BenefitsBar from "@/components/ui/BenefitsBar";
import CategoryCard from "@/components/ui/CategoryCard";
import FeaturedCollection from "@/components/ui/FeaturedCollection";
import ProductCard from "@/components/ui/ProductCard";
import UseFetchCategory from "@/features/admin/hook/UseFetchCategory";

const Home = () => {
  const { data: categoryData, isPending } = UseFetchCategory();

  if (isPending) {
    return <h2>LoadingCategoryCards....</h2>;
  }

  return (
    <main className="w-full h-auto">
      <section className="relative h-152">
        <div className="absolute inset-0 h-full bg-black/55"></div>
        <img
          className="w-full h-full object-top-bottom object-cover"
          src="https://images.unsplash.com/photo-1603189343302-e603f7add05a?w=1920&h=1200&fit=crop&auto=format"
          alt="img"
        />
        <div className="absolute inset-0 flex px-4 sm:px-12 md:px-26">
          <div className="flex flex-col w-full justify-center gap-4 md:gap-8">
            <p className="text-text-third md:text-lg tracking-widest">
              Autumn / Winter 2024
            </p>
            <div className="flex flex-col">
              <span className="text-5xl sm:text-7xl md:text-8xl text-white font-instrumentSerif italic">
                Dress with
              </span>
              <span className="text-5xl sm:text-7xl md:text-8xl text-white font-instrumentSerif">
                intention.
              </span>
            </div>
            <p className="text-text-third md:text-lg tracking-widest">
              Premium essentials for a wardrobe built to last. No trends, only
              quality.
            </p>
            <div className="flex gap-8 flex-wrap items-center justify-center md:justify-start">
              <Button className="py-6 px-6 rounded-none cursor-pointer">
                Shop Now
              </Button>
              <button className="underline text-text-third cursor-pointer">
                Explore Collection
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 py-8 px-10 sm:px-14">
        <div className="flex items-center justify-between w-11/12">
          <div className="flex flex-col gap-2">
            <p className="text-text-secondary text-xs tracking-widest">
              BROWSE BY CATEGORY
            </p>
            <h2 className="font-instrumentSerif text-xl sm:text-3xl tracking-widest font-bold">
              Shop Collections
            </h2>
          </div>
          <div>
            <p className="hidden sm:block border-b text-sm border-b-text-secondary text-text-secondary cursor-pointer tracking-wide hover:text-black transition-all duration-300 ease-in-out">
              VIEW ALL
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 justify-start w-11/12">
          {categoryData.map((item) => (
            <CategoryCard key={item._id} category={item.name} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4 py-8 px-10 sm:px-14">
        <div className="flex items-center justify-between w-11/12">
          <div className="flex flex-col gap-2">
            <p className="text-text-secondary text-xs tracking-widest">
              JUST DROPPED
            </p>
            <h2 className="font-instrumentSerif text-xl sm:text-3xl tracking-widest font-bold">
              New Arrivals
            </h2>
          </div>
          <div>
            <p className="hidden sm:block border-b text-sm border-b-text-secondary text-text-secondary cursor-pointer tracking-wide hover:text-black transition-all duration-300 ease-in-out">
              SEE ALL
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-11/12">
          <ProductCard
            product={{
              image:
                "https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf?w=600&h=800&fit=crop&auto=format",
              price: 200,
              category: "Men",
              name: "Mens Wears",
            }}
          />
          <ProductCard
            product={{
              image:
                "https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf?w=600&h=800&fit=crop&auto=format",
              price: 200,
              category: "Men",
              name: "Mens Wears",
            }}
          />
          <ProductCard
            product={{
              image:
                "https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf?w=600&h=800&fit=crop&auto=format",
              price: 200,
              category: "Men",
              name: "Mens Wears",
            }}
          />
          <ProductCard
            product={{
              image:
                "https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf?w=600&h=800&fit=crop&auto=format",
              price: 200,
              category: "Men",
              name: "Mens Wears",
            }}
          />
          <ProductCard
            product={{
              image:
                "https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf?w=600&h=800&fit=crop&auto=format",
              price: 200,
              category: "Men",
              name: "Mens Wears",
            }}
          />
          <ProductCard
            product={{
              image:
                "https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf?w=600&h=800&fit=crop&auto=format",
              price: 200,
              category: "Men",
              name: "Mens Wears",
            }}
          />
          <ProductCard
            product={{
              image:
                "https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf?w=600&h=800&fit=crop&auto=format",
              price: 200,
              category: "Men",
              name: "Mens Wears",
            }}
          />
          <ProductCard
            product={{
              image:
                "https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf?w=600&h=800&fit=crop&auto=format",
              price: 200,
              category: "Men",
              name: "Mens Wears",
            }}
          />
        </div>
      </section>

      <FeaturedCollection />
      <BenefitsBar />
    </main>
  );
};

export default Home;
