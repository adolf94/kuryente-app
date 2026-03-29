import { useAuth } from "@adolf94/ar-auth-client";
import { useMemo } from "react";

export interface UserInfo {
    isAuthenticated: boolean;
    isLoading: boolean;
    name: string;
    email: string;
    picture: string;
    sub: string;
    isLoggedIn: () => boolean;
    hasScope: (scope: string) => boolean;
    role: string | string[];
}

/**
 * Bridge hook for Atlas-Auth integration.
 * Maintains compatibility with legacy components while using @adolf94/ar-auth-client internally.
 */
const useLogin = () => {
    const { user, isAuthenticated, isLoading, login, logout, hasScope } = useAuth();

    const userInfo: UserInfo = useMemo(() => {
        return {
            isAuthenticated,
            isLoading,
            name: user?.name || "",
            email: user?.email || "",
            picture: user?.picture || "",
            sub: user?.userId || "", // Mapping userId to sub for compatibility
            isLoggedIn: () => isAuthenticated,
            hasScope,
            role: hasScope(`api://${(window as any).webConfig.audience}/admin`) ? ["admin"] : [],
        };
    }, [user, isAuthenticated, isLoading, hasScope]);

    return {
        user: userInfo,
        setUser: () => { console.warn("setUser is deprecated; use Atlas-Auth login flow.") },
        setRefreshing: () => { },
        isTokenRefreshing: isLoading,
        login,
        logout
    };
}

// Keep export for compatibility with main.tsx and App.tsx if needed
export const AuthContextProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export default useLogin;
