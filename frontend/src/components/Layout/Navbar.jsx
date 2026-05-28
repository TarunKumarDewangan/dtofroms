import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <nav className="navbar navbar-expand-lg no-print border-bottom border-secondary border-opacity-10 py-3 navbar-custom">
            <div className="container-fluid px-4">
                <div className="d-flex align-items-center">
                    <span className="navbar-brand text-white fw-bold d-flex align-items-center mb-0">
                        <i className="bi bi-shield-check text-info me-2 fs-4"></i>
                        District Transport Office (DTO) Dhamtari
                    </span>
                    <span className="badge bg-secondary bg-opacity-25 text-info border border-info border-opacity-25 ms-3 py-1.5 px-3 rounded-pill font-monospace" style={{ fontSize: '12px' }}>
                        CG-05 Chhattisgarh
                    </span>
                </div>
                <div className="d-flex align-items-center">
                    <span className="text-secondary me-3 d-none d-md-inline" style={{ fontSize: '14px' }}>
                        Connected as: <strong className="text-white">{user.name}</strong>
                    </span>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
