import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Layout/Sidebar';
import NavbarTop from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard';
import NotesheetBuilder from './components/Notesheet/NotesheetBuilder';
import NotesheetList from './components/Notesheet/NotesheetList';
import UserList from './components/Admin/UserList';
import WorkOptions from './components/Admin/WorkOptions';
import FormList from './components/FilledForm/FormList';
import FormFiller from './components/FilledForm/FormFiller';
import { Spinner } from 'react-bootstrap';
import './App.css';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <Spinner animation="border" variant="info" />
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;

    return children;
};

const AppLayout = ({ children }) => {
    return (
        <div className="d-flex">
            <Sidebar />
            <div className="flex-grow-1 d-flex flex-column" style={{ minHeight: '100vh' }}>
                <NavbarTop />
                <div className="main-content flex-grow-1">
                    {children}
                </div>
                <Footer />
            </div>
        </div>
    );
};

const AppRoutes = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ background: '#0b0f19' }}>
                <Spinner animation="border" variant="info" />
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

            <Route path="/" element={
                <ProtectedRoute>
                    <AppLayout><Dashboard /></AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/build" element={
                <ProtectedRoute>
                    <AppLayout><NotesheetBuilder /></AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/history" element={
                <ProtectedRoute>
                    <AppLayout><NotesheetList /></AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/forms" element={
                <ProtectedRoute>
                    <AppLayout><FormList /></AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/forms/fill" element={
                <ProtectedRoute>
                    <AppLayout><FormFiller /></AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/admin/users" element={
                <ProtectedRoute adminOnly>
                    <AppLayout><UserList /></AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/admin/work-options" element={
                <ProtectedRoute adminOnly>
                    <AppLayout><WorkOptions /></AppLayout>
                </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
