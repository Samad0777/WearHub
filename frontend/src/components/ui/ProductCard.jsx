import { Heart, ShoppingBag } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const getProductPrice = (product) => {
  if (product.price != null) return product.price;

  const activeVariants = product.variants?.filter((variant) => variant.isActive !== false) ?? [];
  return activeVariants.reduce(
    (lowestPrice, variant) => Math.min(lowestPrice, variant.price),
    Infinity,
  );
};

const ProductCard = ({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
}) => {
  const image = product.images?.[0]?.url ?? product.image;
  const category = typeof product.category === "object" ? product.category?.name : product.category;
  const price = getProductPrice(product);

  return (
    <article className="group flex w-full min-w-0 flex-col">
      <div className="relative aspect-4/5 overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
            No image
          </div>
        )}
        <button
          type="button"
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={isWishlisted}
          onClick={() => onToggleWishlist?.(product)}
          className="absolute right-3 top-3 flex size-9 items-center justify-center bg-background text-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Heart size={17} strokeWidth={1.5} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="flex flex-col gap-1 pt-3">
        {category && (
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {category}
          </p>
        )}
        <h3 className="text-sm font-medium text-foreground truncate">{product.name}</h3>
        {Number.isFinite(price) && (
          <p className="text-sm text-foreground">{currencyFormatter.format(price)}</p>
        )}
        <button
          type="button"
          onClick={() => onAddToCart?.(product)}
          className="mt-3 cursor-pointer flex h-10 w-full items-center justify-center gap-2 bg-primary px-4 text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ShoppingBag size={15} strokeWidth={1.5} />
          Add to cart
        </button>
      </div>
    </article>
  );
};

export default ProductCard;