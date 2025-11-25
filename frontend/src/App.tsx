import { createRouter, RouterProvider } from "@tanstack/react-router"

import { routeTree } from './routeTree.gen'
import { GoogleOAuthProvider } from '@react-oauth/google'
import useLogin, { AuthContextProvider } from "./components/GoogleLoginWrapper"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import Login from "./components/Login"

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

export const queryClient = new QueryClient({
  defaultOptions:{
    queries:{
      staleTime: 1*60*60,
      gcTime:20*60,
    }
  }
})


 const App = ()=>{
    const {user, setUser} = useLogin()


    return <>
    <GoogleOAuthProvider clientId={window.webConfig.clientId}>
      <Login />
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} context={{user}}/>
      </QueryClientProvider>
    </GoogleOAuthProvider>
    </>

}

export default App