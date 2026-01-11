import { useGoogleLogin } from "@react-oauth/google";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Token } from "@mui/icons-material";
import { jwtDecode, type JwtPayload } from "jwt-decode";
import moment from "moment";
import { getTokenViaRefreshToken } from "../utils/api";


interface AuthContextModel {
    user:UserInfo, 
    setUserInfo:React.Dispatch<React.SetStateAction<UserInfo>>,
    isRefreshing:boolean
}

export let setRefreshing = ()=>{}


export const AuthContext = createContext<AuthContextModel>({
    user:{
    isAuthenticated: false,
    name: "",
    email: "",
    picture: "",
    sub: "",
    role: ""
}, 
setUserInfo:()=>{}, 
setRefreshing:()=>{},
isTokenRefreshing: false})

export interface UserInfo {
    isAuthenticated: boolean;
    name: string;
    email: string;
    picture: string;
    sub: string;
    isLoggedIn: ()=>boolean;
    role: string | string[];
}
export var navigate = ()=>{}



export const AuthContextProvider = ({children})=>{
    const [user, setUser] = useState<UserInfo>({
        isAuthenticated: false,
        name: "",
        email: "",
        picture: "",
        sub: "",
        isLoggedIn:()=>false,
        role: ""
    })
    const [isRefreshing, setRefreshingInternal] = useState(false)
    const [initialized, setInitialized] = useState(false)
    const isLoggedIn = ()=>{
        let token = window.sessionStorage.getItem("access_token")
        let id_token = window.localStorage.getItem("id_token")
        if(!token || !id_token) return false
        let tokenJson = JSON.parse(window.atob(token!.split(".")[1]));
        if (moment().add(1, "minute").isAfter(tokenJson.exp * 1000 )){
            return false;
        }
        return true
    }
    useEffect(()=>{
        (async()=>{
            let token = await getTokenViaRefreshToken()
            let id_token = window.localStorage.getItem("id_token")
            if(!token || !id_token){
                setInitialized(true)
                
                setUser({...user, isLoggedIn})
                return
            }
            const tokenJson = jwtDecode<JwtPayload & UserInfo>(id_token!)
            console.debug("tokenJson", moment(tokenJson.exp! * 1000).fromNow());
            if (moment().add(1, "minute").isAfter(tokenJson.exp! * 1000)){
                console.log("token expired")
                window.localStorage.removeItem("access_token")
                setInitialized(true)
                return
            }

            setUser({...tokenJson, isAuthenticated: true, isLoggedIn})
            setInitialized(true)
        })()
       

    },[])
    setRefreshing = setRefreshingInternal;
    return !initialized ? <>Authenticating</> 
    :<AuthContext.Provider value={{user, setUser, setRefreshing:setRefreshingInternal, isTokenRefreshing:isRefreshing}}>
        {children}
    </AuthContext.Provider>
}

const useLogin = ()=>{
    const {user, setUser, setRefreshing, isTokenRefreshing} = useContext(AuthContext)

    return {user, setUser,setRefreshing, isTokenRefreshing }
}

export default useLogin 

