import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { changePassword } from '../api/auth';
import Page from "../components/Page";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function ChangePasswordPage() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        CurrentPassword: '',
        NewPassword: '',
        ConfirmNewPassword: ''
    });
    const [show, setShow] = useState({
        current: false,
        new: false,
        confirm: false
    });


    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (form.NewPassword !== form.ConfirmNewPassword) {
            setError('New passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            const res = await changePassword(form);
            setSuccess(res.message);

            setForm({
                CurrentPassword: '',
                NewPassword: '',
                ConfirmNewPassword: ''
            });

            setTimeout(() => {
                navigate('/profile');
            }, 2000);

        } catch (err) {
            setError(err.message || 'Failed to change password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Page>
            <div className="min-h-screen bg-pink-50 flex flex-col items-center px-4 py-10">

                {/* Header */}
                <h2 className="text-3xl font-bold text-pink-600 mb-8">
                    Change Password
                </h2>

                {/* Card */}
                <div className="w-full max-w-xl bg-white/70 backdrop-blur-xl shadow-lg rounded-2xl p-8 border border-pink-200">

                    {/* Messages */}
                    {success && (
                        <div className="mb-4 text-green-700 bg-green-100 px-4 py-3 rounded-lg border border-green-300">
                            {success}
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 text-red-700 bg-red-100 px-4 py-3 rounded-lg border border-red-300">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form className="space-y-5" onSubmit={handleSubmit}>

                        {/* Current PW */}
                        <div>
                            <label
                                htmlFor="CurrentPassword"
                                className="block text-gray-700 font-medium mb-1"
                            >
                                Current Password *
                            </label>
                            <input
                                id="CurrentPassword"
                                name="CurrentPassword"
                                type="password"
                                value={form.CurrentPassword}
                                onChange={handleChange}
                                disabled={loading}
                                required
                                className="w-full px-4 py-3 rounded-lg border border-pink-200 
                                bg-white/80 shadow-sm focus:ring-2 focus:ring-pink-300 outline-none"
                            />
                        </div>

                        {/* New PW */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">
                                New Password *
                            </label>

                            <div className="relative">
                                <input
                                    type={show.new ? "text" : "password"}
                                    name="NewPassword"
                                    value={form.NewPassword}
                                    onChange={handleChange}
                                    disabled={loading}
                                    required
                                    className="w-full px-4 py-3 pr-12 rounded-lg border border-pink-200 
                       bg-white/80 shadow-sm focus:ring-2 focus:ring-pink-300 outline-none"
                                />

                                <button
                                    type="button"
                                    onMouseDown={() => setShow({ ...show, new: true })}
                                    onMouseUp={() => setShow({ ...show, new: false })}
                                    onMouseLeave={() => setShow({ ...show, new: false })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-500 hover:text-pink-700"
                                >
                                    <EyeIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>



                        {/* Confirm PW */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">
                                Confirm New Password *
                            </label>

                            <div className="relative">
                                <input
                                    type={show.confirm ? "text" : "password"}
                                    name="ConfirmNewPassword"
                                    value={form.ConfirmNewPassword}
                                    onChange={handleChange}
                                    disabled={loading}
                                    required
                                    className="w-full px-4 py-3 pr-12 rounded-lg border border-pink-200 
                       bg-white/80 shadow-sm focus:ring-2 focus:ring-pink-300 outline-none"
                                />

                                <button
                                    type="button"
                                    onMouseDown={() => setShow({ ...show, confirm: true })}
                                    onMouseUp={() => setShow({ ...show, confirm: false })}
                                    onMouseLeave={() => setShow({ ...show, confirm: false })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-500 hover:text-pink-700"
                                >
                                    <EyeIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>



                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-pink-500 text-white font-semibold py-3 rounded-lg 
                            shadow-md hover:bg-pink-600 transition"
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>

                    {/* Back */}
                    <div className="mt-6 text-center">
                        <Link
                            to="/profile"
                            className="text-pink-600 font-medium hover:underline"
                        >
                            Cancel and go back
                        </Link>
                    </div>
                </div>
            </div>
        </Page>
    );
}
