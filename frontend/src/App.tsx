import { createRouter, RouterProvider } from "@tanstack/react-router"

import { routeTree } from './routeTree.gen'
import { GoogleOAuthProvider } from '@react-oauth/google'
import useLogin, { AuthContextProvider } from "./components/GoogleLoginWrapper"

// Create a new router instance
const router = createRouter({ routeTree, 
    context: {
      // auth will be passed down from App component
      user: undefined!,
    }
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

 const App = ()=>{
    const {user, setUser} = useLogin()


    return <>
            <RouterProvider router={router} context={{user}}/>
    </>

}

export default App