const FeaturedCollection = () => {
  return (
    <section className="bg-primary-bg px-6 py-8 text-white sm:px-10 lg:px-16 mt-10 mb-10">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div className="flex flex-col items-start py-8 lg:py-16">
          <p className="text-[10px] uppercase tracking-[0.35em] text-text-third">
            Featured Collection
          </p>
          <h2 className="mt-5 font-instrumentSerif text-4xl leading-[0.95] sm:text-5xl lg:text-6xl">
            The Essentials
            <span className="block italic">Edit</span>
          </h2>
          <p className="mt-8 max-w-md text-sm leading-relaxed text-text-third">
            Carefully selected pieces that form the foundation of a thoughtful
            wardrobe. Quality without compromise.
          </p>
          <button
            type="button"
            className="mt-10 border-b border-white pb-1 text-xs font-medium uppercase tracking-[0.16em] transition-colors hover:border-text-third hover:text-text-third focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Explore Now
          </button>
        </div>

        <div className="aspect-4/5 overflow-hidden bg-muted lg:aspect-[1.02/1]">
          <img
            src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1200&h=1400&fit=crop&auto=format"
            alt="Model wearing an essential neutral outfit"
            className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
          />
        </div>
      </div>
    </section>
  );
};

export default FeaturedCollection;