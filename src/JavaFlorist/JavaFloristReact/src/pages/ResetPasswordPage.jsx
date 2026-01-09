import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import '../css/AuthPages.css';

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

 
    const [form, setForm] = useState({
        Email: '',
        Token: '',
        NewPassword: '',
        ConfirmPassword: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

   
    useEffect(() => {
        const token = searchParams.get('token');
        const email = searchParams.get('email');

        if (token && email) {
            setForm(prev => ({ ...prev, Token: token, Email: email }));
        } else {
            setError("Invalid reset link. Token or email is missing.");
        }
    }, [searchParams]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (form.NewPassword !== form.ConfirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (!form.Token || !form.Email) {
            setError('Invalid request. Token or email is missing.');
            return;
        }

        setLoading(true);

        try {
            const res = await resetPassword(form);
            setSuccess(res.message);

            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            setError(err.message || 'Password reset failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-form-wrapper">
                <form className="auth-form-body" onSubmit={handleSubmit}>
                    <h1 className="auth-form-header">Reset Your Password</h1>

                    {success ? (
                        <div className="success-message">{success}</div>
                    ) : (
                        <>
                            {error && <div className="error-message">{error}</div>}

                            <div className="form-group">
                                <label htmlFor="NewPassword">New Password *</label>
                                <input
                                    id="NewPassword"
                                    className="form-input"
                                    name="NewPassword"
                                    type="password"
                                    value={form.NewPassword}
                                    onChange={handleChange}
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="ConfirmPassword">Confirm New Password *</label>
                                <input
                                    id="ConfirmPassword"
                                    className="form-input"
                                    name="ConfirmPassword"
                                    type="password"
                                    value={form.ConfirmPassword}
                                    onChange={handleChange}
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <button typeT="submit" disabled={loading || !form.Token} className="btn-primary">
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </>
                    )}

                    <p className="auth-link">
                        <Link to="/login">Back to Login</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}