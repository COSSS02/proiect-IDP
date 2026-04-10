import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import keycloak from '../config/keycloak';
import LoadingSpinner from '../components/loadingspinner/LoadingSpinner';
import { getUserToken } from '../api/auth'

const AuthContext = createContext(null);

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const isRun = useRef(false);

    useEffect(() => {
        if (isRun.current) return;
        isRun.current = true;

        keycloak.init({ onLoad: 'check-sso' })
            .then(authenticated => {
                if (authenticated) {
                    setToken(keycloak.token);

                    getUserToken(keycloak.token)
                        .then(userToken => {
                            setUser(userToken);
                        })
                        .catch(error => {
                            console.error("Failed to fetch user profile from backend:", error);
                        });
                }
                setIsInitialized(true);
            })
            .catch(error => {
                console.error("Keycloak initialization failed", error);
                setIsInitialized(true);
            });

        // Set up token refresh
        keycloak.onTokenExpired = () => {
            keycloak.updateToken(30).then(refreshed => {
                if (refreshed) {
                    setToken(keycloak.token);
                }
            }).catch(() => {
                console.error('Failed to refresh token');
            });
        };
    }, []);

    const login = useCallback(() => {
        keycloak.login();
    }, []);

    const register = useCallback(() => {
        keycloak.register();
    }, []);

    const logout = useCallback(() => {
        keycloak.logout({ redirectUri: window.location.origin });
    }, []);

    const value = {
        user,
        token,
        isInitialized,
        isAuthenticated: !!token,
        login,
        register,
        logout,
    };

    // Render children only after Keycloak is initialized
    return (
        <AuthContext.Provider value={value}>
            {isInitialized ? children : <LoadingSpinner />}
        </AuthContext.Provider>
    );
};