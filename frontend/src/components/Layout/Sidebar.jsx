import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from 'react-bootstrap';

const Sidebar = () => {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <div className="sidebar no-print d-flex flex-column justify-content-between">
            <div>
                {/* Logo & Branding */}
                <div className="p-4 text-center border-bottom border-secondary border-opacity-25">
                    <h5 className="text-white mb-0 fw-bold tracking-wide">
                        🚗 DTO Dhamtari
                    </h5>
                    <small className="text-info text-uppercase font-monospace fs-10 tracking-widest">
                        Notesheet Gen
                    </small>
                </div>

                {/* User Info Quick View */}
                <div className="px-4 py-3 border-bottom border-secondary border-opacity-25 bg-black bg-opacity-20">
                    <div className="d-flex align-items-center">
                        <div className="flex-grow-1 overflow-hidden">
                            <h6 className="text-white mb-0 text-truncate font-weight-bold">{user.name}</h6>
                            <span className={`badge ${user.role === 'admin' ? 'bg-danger' : 'bg-success'} text-capitalize mt-1`} style={{ fontSize: '10px' }}>
                                {user.role}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Nav Links */}
                <div className="mt-3">
                    <NavLink to="/" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`} end>
                        <i className="bi bi-speedometer2 me-2"></i> Dashboard
                    </NavLink>
                    
                    <NavLink to="/build" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                        <i className="bi bi-file-earmark-plus me-2"></i> Build Notesheet
                    </NavLink>

                    <NavLink to="/history" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                        <i className="bi bi-clock-history me-2"></i> Notesheet History
                    </NavLink>

                    <NavLink to="/forms" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                        <i className="bi bi-file-earmark-pdf me-2"></i> Fill PDF Forms
                    </NavLink>

                    {user.role === 'admin' && (
                        <>
                            <div className="px-4 py-2 mt-4 text-secondary text-uppercase font-monospace fs-10 tracking-widest border-top border-secondary border-opacity-10">
                                Admin Control
                            </div>
                            <NavLink to="/admin/users" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                                <i className="bi bi-people me-2"></i> Manage Users
                            </NavLink>
                            <NavLink to="/admin/work-options" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                                <i className="bi bi-gear-wide-connected me-2"></i> Work Options
                            </NavLink>
                        </>
                    )}
                </div>
            </div>

            {/* Logout Action */}
            <div className="p-3 border-top border-secondary border-opacity-25">
                <Button 
                    variant="outline-danger" 
                    className="w-100 d-flex align-items-center justify-content-center"
                    onClick={logout}
                >
                    <i className="bi bi-box-arrow-right me-2"></i> Logout
                </Button>
            </div>
        </div>
    );
};

export default Sidebar;
