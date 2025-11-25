import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import moment from "moment";
// import { enqueueSnackbar } from "notistack";
import { showLogin } from "../components/Login";



let isRefreshing = false;
let failedQueue = [];

// Utility function to process the waiting queue
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token); // Resolve with the new token
    }
  });
  failedQueue = [];
};





const getTokenViaRefreshToken = ()=>{
  let token = window.localStorage.getItem("refresh_token");
  if(!token) return ""
  return axios.post(`${window.webConfig.api}/auth/refresh`,{
    refresh_token: token,
    app: 'finance'
  })
  .then((e) => {
    window.sessionStorage.setItem("access_token", e.data.access_token);
    window.localStorage.setItem("refresh_token", e.data.refresh_token);
    return e.data.access_token;
  })
  .catch(() => {
    return ""
  });

}

export const getToken = async (force? : boolean, config? : AxiosRequestConfig, axios? : AxiosInstance) => {
  let token = window.sessionStorage.getItem("access_token");
  let isExpired = false
  


  if (!token || force){
    isExpired = true
  }else{
    let tokenJson = JSON.parse(window.atob(token!.split(".")[1]));
  
    if (moment().add(1, "minute").isAfter(tokenJson.exp * 1000 ))
      // token = await getTokenFromApi();
    isExpired = true
  }


  if(!isExpired){
      config.headers.Authorization = `Bearer ${token}`;
      return config
  };
  if (isRefreshing) {
    console.warn('REQUEST INTERCEPTOR: Token expired, but refresh is already running. Queueing request...');
    // Wait for the ongoing refresh to complete
    return new Promise((resolve, reject) => {
        failedQueue.push({ resolve: (newToken) => {
            // When resolved, set the new token and allow the request to proceed
            config.headers.Authorization = `Bearer ${newToken}`;
            resolve(config);
        }, reject });
    });
  }

    isRefreshing = true;
    console.warn('REQUEST INTERCEPTOR: Token expired. Acquiring lock and initiating login dialog.');

    try {
        //try to get token via refresh first
        let dialogToken = await getTokenViaRefreshToken()

        if(!dialogToken) dialogToken = await showLogin(); 
                        
        if (!dialogToken) {
            // User cancelled
            processQueue(new Error('Login canceled by user.'));
            isRefreshing = false;
            return Promise.reject(new Error('Token refresh aborted (Login canceled).'));
        }

        // Token acquired. Update global state, release all waiting requests, and update current config.
        // axios.authHook.setGlobalToken(dialogToken);
        processQueue(null, dialogToken); 

        config.headers.Authorization = `Bearer ${dialogToken}`;
        return config;

    } catch (err) {
        processQueue(err); // Reject all waiting requests
        return Promise.reject(err);
    } finally {
        isRefreshing = false; // Release the lock
    }

};



const handle401 = async (error: AxiosError, instance: AxiosInstance, addLog: (message: string, status: 'info' | 'success' | 'error' | 'warning') => void): Promise<any> => {
  const originalRequest = error.config;

  // 1. Check if the error is due to a 401 and hasn't been retried
  if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Queue the request logic (Manual P-Queue Logic)
      return new Promise((resolve, reject) => {
          
          const retryRequest = async () => {
              let newAccessToken: string = '';

              if (!isRefreshing) {
                  isRefreshing = true;
                  addLog('401 hit. Initiating login (Fallback).', 'error');

                  const dialogToken = await showLogin(); 
                  
                  if (!dialogToken) {
                      const cancelError = new Error('Login canceled by user.');
                      processQueue(cancelError);
                      throw cancelError;
                  }

                  newAccessToken = dialogToken;
                  processQueue(null, newAccessToken);
              } else {
                  addLog('401 hit. Request queued (Refresh in progress).', 'warning');
                  // Wait for the ongoing refresh
                  return new Promise<string>((res, rej) => {
                      failedQueue.push({ resolve: res, reject: rej });
                  }).then(token => { newAccessToken = token; });
              }

              // Retry the original request with the new token
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
              addLog(`Retrying ${originalRequest.url} with new token.`, 'info');
              
              // The retry call returns a promise that resolves the result of the second request
              return instance.get(originalRequest.url || '', originalRequest);

          };
          
          retryRequest().then(resolve).catch(err => {
              isRefreshing = false; // Ensure lock is released if we failed the retry
              reject(err);
          });

      });
  }

  // Default error handling (non-401 or final retry failure)
  return Promise.reject(error);
};


const api = axios.create({
  //@ts-ignore
  baseURL: window.webConfig.api,
});

api.interceptors.request.use(async (config: AxiosRequestConfig) => {
  if (config.preventAuth) return config;
  return getToken(false, config, axios)
});






api.interceptors.response.use(
    async (data) => {
        //     const headerTransId = data.headers["x-last-trans"];
        // if (!data.config?.noLastTrans && !!headerTransId) {
        //     const lastTransId = localStorage.getItem("last_transaction");
        //     const stgTransId = localStorage.getItem("stg_transaction");
        //     if (!!lastTransId && headerTransId !== lastTransId && stgTransId !== headerTransId) {
        //         //Do fetch new data
        //             queryClient.prefetchQuery({ queryKey: [TRANSACTION, { after: lastTransId }], queryFn: () => getAfterTransaction(lastTransId) })
        //     }
        // }
        // if (!headerTransId) {
        //     console.debug("no last-trans found " + data.config.url);
        // }
            

        // //queryClient


        
        return data;
    },
    (err) => {
        if (!!err?.response) {
            if (err.response.status === 401 && !err.request.config?.ignore401) {

                handle401(err, axios, ()=>{})
            }
            if(err.response.status === 500){
                // enqueueSnackbar("Something went wrong!. Contact Developer", {variant:"error", autoHideDuration: 3000});
            }
        }
    return Promise.reject(err)
  },
);

export default api;
