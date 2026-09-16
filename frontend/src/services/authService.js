import api from "../lib/axios";

export const register = async (userData) => {
  const response = await api.post("/v1/auth/register", userData);
  return response.data;
};

export const verifyEmail = async (token) => {
  const response = await api.post("/v1/auth/verify-email", { token });
  return response.data;
};

export const login = async (userData) => {
  const response = await api.post("/v1/auth/login", userData);
  return response.data;
};

export const getMe = async ()=>{
  const response = await api.get("/v1/auth/me");
  return response.data;
}

export const refresh = async ()=>{
  const response = await api.post("/v1/auth/refresh");
  return response.data;
}