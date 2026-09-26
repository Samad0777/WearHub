import api from "../lib/axios"

export const addProduct = async(data)=>{
    const response = await api.post("/v1/products",data)
    return response.data;
}

export const fetchCategories = async ()=>{
    const response = await api.get("/v1/categories");
    return response.data.data;
}

export const fetchProducts = async ()=>{
    const response = await api.get("/v1/products");
    return response.data.data;
}