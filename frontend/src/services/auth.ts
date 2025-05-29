import axios from "axios";
import { TokenResponse } from "../types";

export const login = async (email: string, password: string): Promise<TokenResponse | null> => {
  try {
    const formData = new FormData();
    formData.append("username", email); // O FastAPI espera "username"
    formData.append("password", password);

    const response = await axios.post<TokenResponse>(
      "http://localhost:8000/login",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const data = response.data;
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    return data;
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("userEmail");
};
