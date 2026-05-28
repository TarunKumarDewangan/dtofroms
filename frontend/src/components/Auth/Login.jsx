import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            console.error("Login component error:", err);
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else if (err.response && err.response.data && err.response.data.errors) {
                const keys = Object.keys(err.response.data.errors);
                setError(err.response.data.errors[keys[0]][0]);
            } else {
                setError('Failed to login. Please check network or credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 px-3 login-page-bg">
            <div className="w-100" style={{ maxWidth: '440px' }}>
                <div className="text-center mb-4">
                    <h2 className="text-white fw-bold tracking-wide">🚗 DTO Dhamtari</h2>
                    <p className="text-info text-uppercase font-monospace fs-12 mb-0 tracking-widest">
                        Vehicle NoteSheet Generator
                    </p>
                </div>

                <Card className="glass-card p-4 border border-secondary border-opacity-25 shadow-lg">
                    <Card.Body>
                        <h4 className="text-center text-white mb-4 fw-semibold">Sign In</h4>
                        
                        {error && <Alert variant="danger" className="py-2.5 font-monospace" style={{ fontSize: '14px' }}>{error}</Alert>}

                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3" controlId="formEmail">
                                <Form.Label className="text-secondary fs-14 fw-medium">Email Address</Form.Label>
                                <Form.Control 
                                    type="email"
                                    placeholder="Enter your email"
                                    className="form-control-dark py-2.5"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </Form.Group>

                            <Form.Group className="mb-4" controlId="formPassword">
                                <Form.Label className="text-secondary fs-14 fw-medium">Password</Form.Label>
                                <Form.Control 
                                    type="password"
                                    placeholder="Enter your password"
                                    className="form-control-dark py-2.5"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </Form.Group>

                            <Button 
                                type="submit" 
                                className="w-100 py-2.5 btn-primary-gradient border-0 text-white rounded-3 shadow-md"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Authenticating...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>

                <div className="text-center mt-4">
                    <small className="text-muted">
                        Default credentials: admin@example.com / password123
                    </small>
                </div>
            </div>
        </div>
    );
};

export default Login;
