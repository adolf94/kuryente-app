import { useGoogleLogin } from "@react-oauth/google";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Token } from "@mui/icons-material";
import { jwtDecode, type JwtPayload } from "jwt-decode";
import moment from "moment";
import { getTokenViaRefreshToken } from "../utils/api";


export const AuthContext = createContext<{user:UserInfo, setUserInfo:React.Dispatch<React.SetStateAction<UserInfo>>}>({
    user:{
    isAuthenticated: false,
    name: "",
    email: "",
    picture: "",
    sub: "",
    role: ""
}, setUserInfo:()=>{}})

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
    const [initialized, setInitialized] = useState(false)
    const isLoggedIn = ()=>{
        let token = window.sessionStorage.getItem("access_token")
        if( !token) return false;
        let tokenJson = JSON.parse(window.atob(token!.split(".")[1]));
        if (moment().add(1, "minute").isAfter(tokenJson.exp * 1000 )){
            return false;
        }
        return true
    }
    useEffect(()=>{
        (async()=>{
            let token = await getTokenViaRefreshToken()
            if(!token){
                setInitialized(true)
                
                setUser({...user, isLoggedIn})
                return
            }
            const tokenJson = jwtDecode<JwtPayload & UserInfo>(token!)
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

    return !initialized ? <>Authenticating</> 
    :<AuthContext.Provider value={{user, setUser}}>
        {children}
    </AuthContext.Provider>
}

const useLogin = ()=>{
    const {user, setUser} = useContext(AuthContext)

    return {user, setUser}
}

export default useLogin 

