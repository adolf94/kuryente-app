import { Fingerprint, Google, Key } from "@mui/icons-material"
import { Box, Dialog,Button, DialogContent } from "@mui/material"
import { CredentialResponse, GoogleLogin } from "@react-oauth/google"
import { useCallback, useMemo, useState } from "react"
import api from "../utils/api"
// import api from "../components/fnApi"
// import * as Passwordless from '@passwordlessdev/passwordless-client';

export var showLogin = ()=>{
    return new Promise((resolve)=>resolve(""))
}

const isPasskeyAvailable = ()=>{

    if (window.PublicKeyCredential &&  
        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable &&  
        PublicKeyCredential.isConditionalMediationAvailable) {  
      // Check if user verifying platform authenticator is available.  
      return Promise.all([  
        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(),  
        PublicKeyCredential.isConditionalMediationAvailable(),  
      ]).then(results => {  
        if (results.every(r => r === true)) {  
            return true
        }else{
            return false
        }
      });  
    } else{
        return false
    }

}



const Login = ()=>{
    const [show,setShow] = useState(false)
    const [promise, setPromise] = useState<{ resolve: (token: string | null) => void } | null>(null);


    showLogin = ()=>{
        return new Promise((res)=>{
            setShow(true)
        })
    }
    const hasPasskey = useMemo(()=>isPasskeyAvailable(),[])


    const promptLogin = useCallback((): Promise<string | null> => {
        setShow(true);
        // Retain previous credentials for quick testing, but clear password
        // Create and return the Promise that will be awaited by the interceptor
        return new Promise((resolve) => {
            setPromise({ resolve });
        });
    }, []);
    showLogin = promptLogin

    const onGoogleSuccess = (data: CredentialResponse)=>{
        setShow(false)
        api.post("/auth/google_credential", data, { preventAuth: true })
            .then(e=>{
                window.localStorage.setItem("refresh_token", e.data.refresh_token);
                window.sessionStorage.setItem("access_token", e.data.access_token);
                promise.resolve(e.data.access_token)
            })
    }


    const loginPasskey = async (e)=>{
        e.preventDefault();
        const passwordless = new Passwordless.Client({
            apiUrl: window.webConfig.fido.apiUrl,
            apiKey: window.webConfig.fido.publicKey
          });

        
        const token = await passwordless.signinWithDiscoverable();
        if (!token) {
          return;
        }

        api.post("/auth/fido", token, {preventAuth:true})
        .then(e=>{
            window.localStorage.setItem("refresh_token", e.data.refresh_token);
            window.sessionStorage.setItem("access_token", e.data.access_token);
            promise.resolve(e.data.access_token)
            setShow(false)
        })

    }


    return <>
        <Dialog open={show}>
            <DialogContent>
                <Box sx={{p:1}}>
                    <GoogleLogin
                        onSuccess={onGoogleSuccess}
                        
                        />
                </Box>
                {/* {hasPasskey &&
                    <Box sx={{p:1}}>
                        
                        <Button fullWidth color="success" variant="outlined" onClick={loginPasskey} > <Fingerprint /> Login with Passkey</Button>
                    </Box>
                }
                 */}
            </DialogContent>
        </Dialog>

    </>
}


export default Login