import axios, { AxiosInstance } from "axios";
import env from "@/config";

const httpClient: AxiosInstance = axios.create({
  baseURL: env.strapiUrl,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export default httpClient;


