import { addProduct } from '@/services/productService'
import { useMutation } from '@tanstack/react-query'

const UseAddProduct = () => {
  return (
    useMutation({
        mutationFn:addProduct,
        onSuccess:(data)=>{
          console.log(data)
        }
    })
  )
}

export default UseAddProduct