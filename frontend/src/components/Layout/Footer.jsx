import React from 'react';

const Footer = () => {
    return (
        <footer className="py-4 mt-auto border-top border-secondary border-opacity-10 text-center no-print" style={{ background: '#080c14' }}>
            <div className="container">
                <p className="text-secondary mb-0 fs-14">
                    &copy; {new Date().getFullYear()} DTO Dhamtari. All Rights Reserved. 
                </p>
                <small className="text-muted font-monospace" style={{ fontSize: '11px' }}>
                    Vehicle NoteSheet Auto-Generator v1.0.0 (Laravel 10 + React 18)
                </small>
            </div>
        </footer>
    );
};

export default Footer;
