const CategoryCard = ({ category }) => {
  const categories = {
    Men: "https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf?w=600&h=800&fit=crop&auto=format",
    Women:
      "https://images.unsplash.com/photo-1664076458686-3449062080ac?w=600&h=800&fit=crop&auto=format",
    OutWear:
      "https://images.unsplash.com/photo-1603189343302-e603f7add05a?w=600&h=800&fit=crop&auto=format",
    Accessories:
      "https://images.unsplash.com/photo-1721957786618-5584515a50d3?w=600&h=800&fit=crop&auto=format",
    Dresses:
      "https://images.unsplash.com/photo-1751284520724-a71abbaa1255?w=600&h=800&fit=crop&auto=format",
    KnitWear:
      "https://images.unsplash.com/photo-1621198059871-0d5f9b449233?w=600&h=800&fit=crop&auto=format",
  };
  return (
    <div className="h-auto w-fit text-center">
      <img
        src={categories[category]}
        alt={categories[category]}
        className="h-60 hover:scale-105 transition-all duration-300 ease-in-out"
      />
      <div className="py-2">
        <p>{category}</p>
      </div>
    </div>
  );
};

export default CategoryCard;
