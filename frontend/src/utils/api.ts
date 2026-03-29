import axios, { AxiosError } from "axios";
import type { AxiosInstance } from "axios";
// import { enqueueSnackbar } from "notistack";
import { showLogin } from "../components/Login";
import { refreshAccessToken, getUserManager } from "@adolf94/ar-auth-client";



let isRefreshing = false;
let failedQueue: any[] = [];

// Utility function to process the waiting queue
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token); // Resolve with the new token
    }
  });
  failedQueue = [];
};





export const getTokenViaRefreshToken = async () => {
  try {
    const user = await refreshAccessToken();
    return user?.access_token || "";
  } catch (error) {
    console.error("Token refresh failed", error);
    return "";
  }
}

export const getToken = async (force?: boolean, config?: any) => {
  const userManager = getUserManager();
  const user = await userManager.getUser();

  let token = user?.access_token;
  let isExpired = !token || user?.expired;

  if (!isExpired && !force) {
    if (config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }

  if (isRefreshing) {
    console.warn('REQUEST INTERCEPTOR: Token expired, but refresh is already running. Queueing request...');
    return new Promise((resolve, reject) => {
      failedQueue.push({
        resolve: (newToken: string) => {
          if (config.headers) {
            config.headers.Authorization = `Bearer ${newToken}`;
          }
          resolve(config);
        }, reject
      });
    });
  }

  isRefreshing = true;
  console.warn('REQUEST INTERCEPTOR: Token expired. Acquiring lock and initiating login flow.');

  try {
    let dialogToken = await getTokenViaRefreshToken();

    if (!dialogToken) {
      // Fallback to library login if refresh fails
      console.log("Refresh failed, triggering signinRedirect...");
      await userManager.signinRedirect();
      // signinRedirect will reload the page, so this promise never resolves
      return new Promise(() => { });
    }

    processQueue(null, dialogToken);
    if (config.headers) {
      config.headers.Authorization = `Bearer ${dialogToken}`;
    }
    return config;
  } catch (err) {
    processQueue(err);
    return Promise.reject(err);
  } finally {
    isRefreshing = false;
  }
};



const handle401 = async (error: AxiosError, instance: AxiosInstance): Promise<any> => {
  const originalRequest: any = error.config;

  if (originalRequest && error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;

    if (isRefreshing) {
      console.warn('401 hit. Refresh already in progress. Queueing request...');
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(instance(originalRequest));
          },
          reject
        });
      });
    }

    isRefreshing = true;
    console.warn('401 hit. Initiating token refresh flow.');

    try {
      // 1. Attempt silent refresh
      let newToken = await getTokenViaRefreshToken();

      // 2. Fallback to interactive login if refresh fails
      if (!newToken) {
        console.warn('Silent refresh failed. Prompting for interactive login.');
        const dialogToken = await showLogin();
        if (!dialogToken) {
          const cancelError = new Error('Login canceled by user.');
          processQueue(cancelError);
          throw cancelError;
        }
        newToken = dialogToken as string;
      }

      // 3. Process the waiting queue and retry the original request
      processQueue(null, newToken);
      originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      console.log(`Retrying ${originalRequest.url} with new token.`);
      return instance(originalRequest);
    } catch (err) {
      processQueue(err);
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }

  return Promise.reject(error);
};


const api = axios.create({
  //@ts-ignore
  baseURL: window.webConfig.api,
});

api.interceptors.request.use(async (config: any) => {
  if (config.preventAuth) return config;
  return getToken(false, config)
});






api.interceptors.response.use(
  (data) => data,
  async (err) => {
    if (!!err?.response) {
      if (err.response.status === 401 && !err.config?.ignore401) {
        return handle401(err, api);
      }
      if (err.response.status === 500) {
        // Handle 500 if needed
      }
    }
    return Promise.reject(err);
  },
);

export default api;
