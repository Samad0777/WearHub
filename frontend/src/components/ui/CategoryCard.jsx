const CategoryCard = () => {
  return (
    <div className="h-auto w-fit text-center">
      <img
        src="https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf?w=600&h=800&fit=crop&auto=format"
        alt="categoryImg"
        className="h-60 hover:scale-105 transition-all duration-300 ease-in-out"
      />
      <div className="py-2">
      <p>MEN</p>
      <p className="text-text-secondary text-xs">48 Items</p>
      </div>
    </div>
  );
};

export default CategoryCard;
