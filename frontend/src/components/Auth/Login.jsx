import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';

const Login = () => {
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const [isSignUp, setIsSignUp] = useState(false);
    const [name, setName] = useState('');
    const [mobileNo, setMobileNo] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isSignUp) {
                await register(name, mobileNo, code, password);
            } else {
                await login(mobileNo, password);
            }
            navigate('/');
        } catch (err) {
            console.error("Auth component error:", err);
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else if (err.response && err.response.data && err.response.data.errors) {
                const keys = Object.keys(err.response.data.errors);
                setError(err.response.data.errors[keys[0]][0]);
            } else {
                setError('Failed to authenticate. Please check connection or details.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 px-3 login-page-bg">
            <div className="w-100" style={{ maxWidth: '460px' }}>
                <div className="text-center mb-4">
                    <h2 className="text-white fw-bold tracking-wide">🚗 DTO Dhamtari</h2>
                    <p className="text-info text-uppercase font-monospace fs-12 mb-0 tracking-widest">
                        Vehicle NoteSheet Generator
                    </p>
                </div>

                <Card className="glass-card p-4 border border-secondary border-opacity-25 shadow-lg">
                    <Card.Body>
                        <h4 className="text-center text-white mb-4 fw-semibold">
                            {isSignUp ? 'Create Account' : 'Sign In'}
                        </h4>
                        
                        {error && <Alert variant="danger" className="py-2.5 font-monospace" style={{ fontSize: '14px' }}>{error}</Alert>}

                        <Form onSubmit={handleSubmit}>
                            {isSignUp && (
                                <Form.Group className="mb-3" controlId="formName">
                                    <Form.Label className="text-secondary fs-14 fw-medium">Full Name</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        placeholder="Enter your full name"
                                        className="form-control-dark py-2.5"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </Form.Group>
                            )}

                            <Form.Group className="mb-3" controlId="formMobile">
                                <Form.Label className="text-secondary fs-14 fw-medium">Mobile Number (Login ID)</Form.Label>
                                <Form.Control 
                                    type="text"
                                    placeholder="Enter your 10-digit mobile number"
                                    className="form-control-dark py-2.5"
                                    value={mobileNo}
                                    onChange={(e) => setMobileNo(e.target.value)}
                                    required
                                    pattern="[0-9]{10}"
                                    title="Please enter a valid 10-digit mobile number"
                                    disabled={loading}
                                />
                            </Form.Group>

                            {isSignUp && (
                                <Form.Group className="mb-3" controlId="formCode">
                                    <Form.Label className="text-secondary fs-14 fw-medium">Requested RTO Code (e.g. CG05)</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        placeholder="Enter RTO code you want"
                                        className="form-control-dark py-2.5"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                    <Form.Text className="text-muted" style={{ fontSize: '11px' }}>
                                        Note: This code can only be updated by the Administrator.
                                    </Form.Text>
                                </Form.Group>
                            )}

                            <Form.Group className="mb-4" controlId="formPassword">
                                <Form.Label className="text-secondary fs-14 fw-medium">Password</Form.Label>
                                <Form.Control 
                                    type="password"
                                    placeholder="Enter password"
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
                                        {isSignUp ? 'Registering...' : 'Authenticating...'}
                                    </>
                                ) : (
                                    isSignUp ? 'Sign Up' : 'Sign In'
                                )}
                            </Button>
                        </Form>

                        <div className="text-center mt-3">
                            <Button 
                                variant="link" 
                                className="text-info fs-14 text-decoration-none p-0"
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setError('');
                                }}
                                disabled={loading}
                            >
                                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
};

export default Login;
