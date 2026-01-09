import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Page from "../components/Page";
import Sparkles from "../components/Sparkles";
import { decodeToken } from '../utils/tokenUtils';

export function LoginPage() {
  const [mode, setMode] = useState("login");
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [success, setSuccess] = useState("");
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");


  // LOGIN STATE
  const [loginForm, setLoginForm] = useState({
    Email: "",
    Password: "",
  });

  // REGISTER STATE
  const [regForm, setRegForm] = useState({
    FirstName: "",
    LastName: "",
    Email: "",
    PhoneNumber: "",
    Gender: "",
    Password: "",
    ConfirmPassword: "",
  });

  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setRegisterError(""); // clear other side too

    try {
      const ok = await login(loginForm.Email, loginForm.Password);
      if (ok) {
       
        const token = localStorage.getItem('token');
        const decoded = decodeToken(token);

        let userRoles = [];
    
        const roleClaimType = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
        if (decoded?.[roleClaimType]) {
          const val = decoded[roleClaimType];
          userRoles = Array.isArray(val) ? val : [val];
        } else if (decoded?.role) {
          const val = decoded.role;
          userRoles = Array.isArray(val) ? val : [val];
        }

        if (userRoles.includes('Admin')) {
          navigate('/dashboard');
        } else if (userRoles.includes('Partner')) {
          navigate('/dashboard');
        } else {
          navigate('/all-products');
        }
     
      }
    } catch (err) {
      setLoginError(err.message || "Login failed");
    }
  };


  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError("");
    setLoginError(""); // clear other side

    if (regForm.Password !== regForm.ConfirmPassword) {
      setRegisterError("Passwords do not match");
      return;
    }

    try {
      const ok = await register(regForm);
      if (ok) {
        setSuccess("Account created successfully!");
        setTimeout(() => {
          setSuccess("");
          setMode("login");
        }, 3000);
      }
    } catch (err) {
      setRegisterError(err.message || "Registration failed");
    }
  };


  return (
    <Page>
      <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
        <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center"></div>
        {/* 🔥 BACKGROUND SPLIT ANIMATION */}
        <div
          className={`
          absolute inset-0 transition-all duration-700 ease-in-out
          ${mode === "login"
              ? "bg-gradient-to-br from-pink-300 to-pink-100"
              : "bg-gradient-to-br from-pink-300 to-pink-100"
            }
        `}
        >
          <Sparkles />
        </div>

        {/* LEFT SIDE panel animation */}
        {/* IMAGE PANEL FOR LOGIN MODE (RIGHT SIDE) */}
        <div
          className={`
    absolute top-0 right-0 h-full w-1/2 transition-all duration-700 overflow-hidden
    ${mode === "login"
              ? "opacity-100 translate-x-0"
              : "opacity-0 translate-x-full"
            }
  `}
        >
          <img
            src="https://i.pinimg.com/1200x/70/d3/99/70d3990d27e4631790cdf4f522850c6a.jpg"
            alt="login visual"
            className="w-full h-full object-cover"
          />
        </div>
        <div
          className={`
          absolute top-0 left-0 h-full w-1/2 transition-all duration-700
          ${mode === "login"
              ? "translate-x-0 opacity-100"
              : "-translate-x-full opacity-0"
            }
        `}
        >
          <div className="h-full w-full flex flex-col items-center justify-center px-10">
            <h2 className="text-4xl font-bold text-pink-600 mb-6">Log In</h2>

            <form
              onSubmit={handleLogin}
              className="w-full max-w-sm bg-white/50 backdrop-blur-xl p-8 rounded-3xl shadow-xl space-y-4"
            >
              <input
                className="w-full px-4 py-3 rounded-xl border border-pink-300 focus:ring-2 focus:ring-pink-300 outline-none"
                placeholder="Email"
                value={loginForm.Email}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, Email: e.target.value })
                }
              />

              <input
                className="w-full px-4 py-3 rounded-xl border border-pink-300 focus:ring-2 focus:ring-pink-300 outline-none"
                placeholder="Password"
                type="password"
                value={loginForm.Password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, Password: e.target.value })
                }
              />

              <button className=" card-sweep group w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl transition shadow-lg">
                Login
              </button>

              {/* ForgotPassword */}
              <p className="mt-3 text-center text-sm">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-pink-600 font-semibold hover:underline"
                >
                  Forgot password?
                </button>
              </p>

              {loginError && (
                <p className="text-red-500 text-sm">{loginError}</p>
              )}

            </form>

            <p className="mt-4 text-gray-600">
              New here?
              <button
                className="text-pink-600 font-semibold ml-1"
                onClick={() => {
                  setMode("register");
                  setLoginError("");
                  setRegisterError("");
                  setSuccess("");
                }}
              >
                Create account →
              </button>
            </p>
          </div>
        </div>

        {/* RIGHT SIDE panel animation */}
        {/* IMAGE PANEL FOR REGISTER MODE (LEFT SIDE) */}
        <div
          className={`
    absolute top-0 left-0 h-full w-1/2 transition-all duration-700 overflow-hidden
    ${mode === "register"
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-full"
            }
  `}
        >
          <img
            src="https://i.pinimg.com/736x/55/d8/45/55d845859124095437b6adca54ca3adb.jpg"
            alt="register visual"
            className="w-full h-full object-cover"
          />
        </div>
        <div
          className={`
          absolute top-0 right-0 h-full w-1/2 transition-all duration-700
          ${mode === "register"
              ? "translate-x-0 opacity-100"
              : "translate-x-full opacity-0"
            }
        `}
        >
          <Sparkles />
          <div className="h-full w-full flex flex-col items-center justify-center px-10">
            <h2 className="text-4xl font-bold text-pink-600 mb-6">
              Join the Family 🌷
            </h2>

            <form
              onSubmit={handleRegister}
              className="w-full max-w-sm bg-white/50 backdrop-blur-xl p-8 rounded-3xl shadow-xl space-y-3"
            >
              {success && (
                <div className="mb-4 w-full max-w-sm px-4 py-3 rounded-xl bg-green-100 text-green-700 text-center font-medium shadow">
                  {success}
                </div>
              )}

              {/* First + Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="px-4 py-3 rounded-xl border border-pink-300 focus:ring-2 focus:ring-pink-300 outline-none"
                  placeholder="First name"
                  value={regForm.FirstName}
                  onChange={(e) =>
                    setRegForm({ ...regForm, FirstName: e.target.value })
                  }
                />

                <input
                  className="px-4 py-3 rounded-xl border border-pink-300 focus:ring-2 focus:ring-pink-300 outline-none"
                  placeholder="Last name"
                  value={regForm.LastName}
                  onChange={(e) =>
                    setRegForm({ ...regForm, LastName: e.target.value })
                  }
                />
              </div>
              {/* Gender + Phone Number */}
              <div className="grid grid-cols-2 gap-3">
                <select
                  className="px-4 py-3 rounded-xl border border-pink-300 focus:ring-2 focus:ring-pink-300 outline-none"
                  value={regForm.Gender}
                  onChange={(e) =>
                    setRegForm({ ...regForm, Gender: e.target.value })
                  }
                >
                  <option value="">Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>

                <input
                  className="px-4 py-3 rounded-xl border border-pink-300 focus:ring-2 focus:ring-pink-300 outline-none"
                  placeholder="Phone Number"
                  value={regForm.PhoneNumber}
                  onChange={(e) =>
                    setRegForm({ ...regForm, PhoneNumber: e.target.value })
                  }
                />
              </div>

              {/* Email */}
              <input
                className="w-full px-4 py-3 rounded-xl border border-pink-300 focus:ring-2 focus:ring-pink-300 outline-none"
                placeholder="Email"
                value={regForm.Email}
                onChange={(e) =>
                  setRegForm({ ...regForm, Email: e.target.value })
                }
              />

              {/* Password */}
              <input
                className="w-full px-4 py-3 rounded-xl border border-pink-300 focus:ring-2 focus:ring-pink-300 outline-none"
                placeholder="Password"
                type="password"
                value={regForm.Password}
                onChange={(e) =>
                  setRegForm({ ...regForm, Password: e.target.value })
                }
              />

              {/* Confirm Password */}
              <input
                className="w-full px-4 py-3 rounded-xl border border-pink-300 focus:ring-2 focus:ring-pink-300 outline-none"
                placeholder="Confirm Password"
                type="password"
                value={regForm.ConfirmPassword}
                onChange={(e) =>
                  setRegForm({ ...regForm, ConfirmPassword: e.target.value })
                }
              />

              {/* Button */}
              <button className=" card-sweep group w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl transition shadow-lg">
                Register
              </button>

              {registerError && (
                <p className="text-red-500 text-sm">{registerError}</p>
              )}

            </form>

            <p className="mt-4 text-gray-600">
              Already have an account?
              <button
                className="text-pink-600 font-semibold ml-1"
                onClick={() => {
                  setMode("login");
                  setLoginError("");
                  setRegisterError("");
                  setSuccess("");
                }}
              >

                Back to login →
              </button>
            </p>
          </div>
        </div>
      </div>
    </Page>
  );
}
