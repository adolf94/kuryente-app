import axios from "axios";
import { loginPromise, navigate } from "../components/GoogleLoginWrapper";
import moment from "moment";
import { jwtDecode, type JwtPayload } from "jwt-decode";
import { redirect } from "@tanstack/react-router";



export const getToken = async (force: boolean) => {
    let token = window.localStorage.getItem("access_token");

    if (!token || force) return redirect({to:"/"});


    const tokenJson = jwtDecode<JwtPayload>(token!)
    console.debug("tokenJson", moment(tokenJson.exp! * 1000).fromNow());
    if (moment().add(1, "minute").isAfter(tokenJson.exp! * 1000))
        throw redirect({to:"/"});;

    return token;
};


export const anonApi = axios.create({
    baseURL: window.webConfig.api,    
})



const api = axios.create({
    //@ts-ignore
    baseURL: window.webConfig.api,
});

api.interceptors.request.use(async (config: AxiosRequestConfig) => {
    const token = await getToken(config.retryGetToken);
    config.headers!.Authorization = "Bearer " + token;
    return config;
});

export default api