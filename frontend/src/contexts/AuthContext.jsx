import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('token');
            const cachedUser = localStorage.getItem('user');
            
            if (token && cachedUser) {
                try {
                    setUser(JSON.parse(cachedUser));
                    // Refresh user status from backend
                    const response = await api.get('/user');
                    setUser(response.data);
                    localStorage.setItem('user', JSON.stringify(response.data));
                } catch (error) {
                    console.error("Auth initialization failed:", error);
                    logoutLocal();
                }
            }
            setLoading(false);
        };
        initializeAuth();
    }, []);

    const login = async (mobile_no, password) => {
        const response = await api.post('/login', { mobile_no, password });
        const { user: loggedUser, token } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(loggedUser));
        setUser(loggedUser);
        return loggedUser;
    };

    const register = async (name, mobile_no, code, password) => {
        const response = await api.post('/register', { name, mobile_no, code, password });
        const { user: registeredUser, token } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(registeredUser));
        setUser(registeredUser);
        return registeredUser;
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } catch (error) {
            console.error("Logout request failed:", error);
        } finally {
            logoutLocal();
        }
    };

    const logoutLocal = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, register, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
