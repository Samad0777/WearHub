import { Button } from "@/components/ui/button";

const Home = () => {
  return (
    <main className="w-full h-screen">
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
    </main>
  );
};

export default Home;
