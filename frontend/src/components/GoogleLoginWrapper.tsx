import { useGoogleLogin } from "@react-oauth/google";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Token } from "@mui/icons-material";
import { jwtDecode, type JwtPayload } from "jwt-decode";
import moment from "moment";


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
        role: ""
    })
    const [initialized, setInitialized] = useState(false)
    useEffect(()=>{
        let token = window.localStorage.getItem("access_token")
        if (!token) {
            console.log("no token")
            setInitialized(true)
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
        setUser({...tokenJson, isAuthenticated: true})
        setInitialized(true)

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
