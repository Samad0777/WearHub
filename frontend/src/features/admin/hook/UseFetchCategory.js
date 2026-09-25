import { fetchCategories } from "@/services/productService";
import { useQuery } from "@tanstack/react-query";

const UseFetchCategory = () => {
  return(
    useQuery({
        queryKey:["fetchCategories"],
        queryFn:fetchCategories,
    })
  )
};

export default UseFetchCategory;
