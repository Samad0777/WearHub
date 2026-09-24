import { useEffect, useRef, useState } from "react";
import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const AddProduct = () => {
  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);
  const imageUrlsRef = useRef([]);

  useEffect(() => {
    imageUrlsRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imageUrlsRef.current.forEach((image) => URL.revokeObjectURL(image.preview));
    };
  }, []);

  // const handleImageChange = (event) => {
  //   const selectedFiles = Array.from(event.target.files || []);
  //   const remainingSlots = 6 - images.length;

  //   const newImages = selectedFiles
  //     .slice(0, remainingSlots)
  //     .map((file) => ({
  //       file,
  //       preview: URL.createObjectURL(file),
  //     }));

  //   setImages((prev) => [...prev, ...newImages]);
  //   event.target.value = "";
  // };

  const removeImage = (preview) => {
    URL.revokeObjectURL(preview);
    setImages((prev) => prev.filter((image) => image.preview !== preview));
  };

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: Date.now(),
        sku: "",
        color: "",
        size: "",
        price: "",
        compareAtPrice: "",
        stock: "",
      },
    ]);
  };

  const removeVariant = (id) => {
    setVariants((prev) => prev.filter((variant) => variant.id !== id));
  };

  return (
    <main className="min-h-screen bg-auth-bg p-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs tracking-widest text-text-secondary">NEW</p>
          <h2 className="text-xl font-semibold">Add Products</h2>
        </div>

        <div className="flex gap-4">
          <Button
            variant="secondary"
            className="cursor-pointer rounded-none border border-border px-4 py-4"
          >
            Cancel
          </Button>

          <Button className="cursor-pointer rounded-none px-4 py-4">
            Save Product
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <section className="border border-border bg-white px-7 py-7">
          <p className="mb-6 text-xs tracking-widest text-text-secondary">
            PRODUCT INFORMATION
          </p>

          <div className="flex flex-col gap-5">
            <div>
              <label
                htmlFor="product-name"
                className="mb-2 block text-[14px] font-medium"
              >
                PRODUCT NAME <span aria-hidden="true">*</span>
              </label>

              <input
                id="product-name"
                name="productName"
                type="text"
                placeholder="Enter product name"
                className="h-13 w-full border border-border px-4 text-base outline-none placeholder:text-text-third focus:border-text-secondary"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-[14px] font-medium"
              >
                DESCRIPTION
              </label>

              <textarea
                id="description"
                name="description"
                placeholder="Product description..."
                className="h-30 w-full resize-none border border-border px-4 py-3 text-base outline-none placeholder:text-text-third focus:border-text-secondary"
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-[14px] font-medium"
              >
                CATEGORY
              </label>

              <select
                id="category"
                name="category"
                defaultValue=""
                className="h-13 w-full appearance-none border border-border bg-white px-4 text-base outline-none focus:border-text-secondary"
              >
                <option value="" disabled>
                  Select category
                </option>
                <option value="men" >
                  Men
                </option>
              </select>
            </div>
          </div>
        </section>

        <section className="border border-border bg-white px-7 py-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs tracking-widest text-text-secondary">
                PRODUCT IMAGES
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                Add up to 6 images. JPEG, PNG, or WEBP up to 5 MB each.
              </p>
            </div>
            <span className="text-sm text-text-secondary">{images.length}/6</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image, index) => (
              <div key={image.preview} className="group relative aspect-square border border-border">
                <img
                  src={image.preview}
                  alt={`Product preview ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(image.preview)}
                  aria-label={`Remove product image ${index + 1}`}
                  className="absolute right-2 top-2 flex size-8 cursor-pointer items-center justify-center bg-white/90 text-text-secondary opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus:opacity-100"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            ))}

            {images.length < 6 && (
              <label
                htmlFor="product-images"
                className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-3 border border-dashed border-border text-center transition-colors hover:border-text-secondary"
              >
                <ImagePlus size={28} strokeWidth={1.5} aria-hidden="true" />
                <span className="text-sm font-medium">Add images</span>
                <span className="text-xs text-text-secondary">Choose from device</span>
                <input
                  id="product-images"
                  name="images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  // onChange={handleImageChange}
                  className="sr-only"
                />
              </label>
            )}
          </div>
        </section>

        <Button
          type="button"
          onClick={addVariant}
          className="w-full cursor-pointer justify-center rounded-none border border-border py-5"
        >
          <Plus aria-hidden="true" />
          Add Variant
        </Button>

        {variants.map((variant, index) => (
          <section
            key={variant.id}
            className="border border-border bg-white px-7 py-7"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <p className="text-xs tracking-widest text-text-secondary">
                VARIANT {index + 1}
              </p>

              <Button
                type="button"
                variant="outline"
                onClick={() => removeVariant(variant.id)}
                className="cursor-pointer rounded-none border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 aria-hidden="true" />
                Remove Variant
              </Button>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="border border-border p-5">
                <p className="mb-5 text-xs tracking-widest text-text-secondary">
                  VARIANT DETAILS
                </p>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label
                      htmlFor={`variant-${variant.id}-sku`}
                      className="mb-2 block text-[14px] font-medium"
                    >
                      SKU <span aria-hidden="true">*</span>
                    </label>

                    <input
                      id={`variant-${variant.id}-sku`}
                      name={`variants[${index}].sku`}
                      type="text"
                      placeholder="WH-XXX-000"
                      className="h-13 w-full border border-border px-4 text-base outline-none placeholder:text-text-third focus:border-text-secondary"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`variant-${variant.id}-price`}
                      className="mb-2 block text-[14px] font-medium"
                    >
                      PRICE <span aria-hidden="true">*</span>
                    </label>

                    <input
                      id={`variant-${variant.id}-price`}
                      name={`variants[${index}].price`}
                      type="number"
                      placeholder="0.00"
                      className="h-13 w-full border border-border px-4 text-base outline-none placeholder:text-text-third focus:border-text-secondary"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`variant-${variant.id}-stock`}
                      className="mb-2 block text-[14px] font-medium"
                    >
                      STOCK <span aria-hidden="true">*</span>
                    </label>

                    <input
                      id={`variant-${variant.id}-stock`}
                      name={`variants[${index}].stock`}
                      type="number"
                      placeholder="0"
                      className="h-13 w-full border border-border px-4 text-base outline-none placeholder:text-text-third focus:border-text-secondary"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor={`variant-${variant.id}-compare-at-price`}
                      className="mb-2 block text-[14px] font-medium"
                    >
                      COMPARE-AT PRICE
                    </label>

                    <input
                      id={`variant-${variant.id}-compare-at-price`}
                      name={`variants[${index}].compareAtPrice`}
                      type="number"
                      placeholder="0.00"
                      className="h-13 w-full border border-border px-4 text-base outline-none placeholder:text-text-third focus:border-text-secondary"
                    />
                  </div>
                </div>
              </div>

              <div className="border border-border p-5">
                <p className="mb-5 text-xs tracking-widest text-text-secondary">
                  ATTRIBUTES
                </p>

                <div className="flex flex-col gap-5">
                  <div>
                    <label
                      htmlFor={`variant-${variant.id}-color`}
                      className="mb-2 block text-[14px] font-medium"
                    >
                      COLOR
                    </label>

                    <input
                      id={`variant-${variant.id}-color`}
                      name={`variants[${index}].color`}
                      type="text"
                      placeholder="Enter color"
                      className="h-13 w-full border border-border px-4 text-base outline-none placeholder:text-text-third focus:border-text-secondary"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`variant-${variant.id}-size`}
                      className="mb-2 block text-[14px] font-medium"
                    >
                      SIZE
                    </label>

                    <input
                      id={`variant-${variant.id}-size`}
                      name={`variants[${index}].size`}
                      type="text"
                      placeholder="Enter size"
                      className="h-13 w-full border border-border px-4 text-base outline-none placeholder:text-text-third focus:border-text-secondary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
};

export default AddProduct;