import { fetchProducts } from "@/services/productService"
import { useQuery } from "@tanstack/react-query"

const UseFetchProduct = () => {
  return useQuery({
    queryKey:["fetchProduct"],
    queryFn:fetchProducts,
  })
}

export default UseFetchProduct