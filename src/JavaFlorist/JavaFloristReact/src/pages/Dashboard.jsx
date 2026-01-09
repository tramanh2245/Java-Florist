import { Link, Navigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";

import { useAuth } from "../context/AuthContext";
import Page from "../components/Page";
import Sparkles from "../components/Sparkles";
import { getPartnerSummary } from "../api/orders";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://localhost:7107";

const HUB_URL = `${API_BASE_URL.replace(/\/+$/, "")}/hubs/partnerNotifications`;

export default function Dashboard() {
  // ================== AUTH & STATE ==================
  const { roles, logout, isAuthenticated, user, token } = useAuth();

  const [newOrders, setNewOrders] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(true);

  // audio cho tiếng thông báo
  const notifAudioRef = useRef(null);

  // giữ 1 connection duy nhất
  const connectionRef = useRef(null);

  // flag & state cho audio
  const audioEnabledRef = useRef(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Hàng đợi âm thanh cho nhiều đơn tới liên tục
  const [soundQueue, setSoundQueue] = useState(0);
  const soundQueueRef = useRef(0);

  // Popup cho đơn mới realtime
  const [showPopup, setShowPopup] = useState(false);
  const [lastRealtimeOrder, setLastRealtimeOrder] = useState(null);
  const popupTimeoutRef = useRef(null);

  const isAdmin = Array.isArray(roles) && roles.includes("Admin");
  const isPartner = Array.isArray(roles) && roles.includes("Partner");

  // Keep soundQueueRef in sync
  useEffect(() => {
    soundQueueRef.current = soundQueue;
  }, [soundQueue]);

  // ================== 1. LOAD PARTNER SUMMARY ON MOUNT ==================
  useEffect(() => {
    if (!isPartner || !isAuthenticated) return;

    const loadSummary = async () => {
      try {
        const data = await getPartnerSummary(); // GET /api/Orders/partner/summary
        const count = data?.newOrders ?? 0;
        setNewOrders(count);
      } catch (err) {
        console.error("Failed to load partner summary", err);
      }
    };

    loadSummary();
  }, [isPartner, isAuthenticated]);

  // ================== 2. ENABLE AUDIO ON FIRST USER INTERACTION ==================
  useEffect(() => {
    if (!isPartner) return;

    const handleFirstClick = async () => {
      if (audioEnabledRef.current) return;

      const audio = notifAudioRef.current;
      if (!audio) {
        console.warn("[Audio] element not ready");
        return;
      }

      try {
        await audio.play();
        audio.pause();
        audio.currentTime = 0;

        audioEnabledRef.current = true;
        setSoundEnabled(true);
        console.log("[Audio] Enabled by global click (no test sound)");
        window.removeEventListener("click", handleFirstClick);
      } catch (err) {
        console.warn("[Audio] Enable failed on global click:", err);
      }
    };

    window.addEventListener("click", handleFirstClick);

    return () => {
      window.removeEventListener("click", handleFirstClick);
    };
  }, [isPartner]);

 //=================== 2.1. ENABLE SOUND ==================
  const handleEnableSoundButton = async () => {
    const audio = notifAudioRef.current;
    if (!audio) {
      console.warn("[Audio] element not ready (button)");
      return;
    }

    try {
      audio.muted = true;
      await audio.play();
      audio.pause();
      audio.currentTime = 0;

      audioEnabledRef.current = true;
      setSoundEnabled(true);
      console.log("[Audio] Enabled by explicit button click (muted, no sound)");
    } catch (err) {
      console.warn("[Audio] Enable failed (button):", err);
    }
  };

  // ================== 2.2. SIGNALR HUB CONNECTION & EVENTS ==================
  useEffect(() => {
    if (!isPartner || !isAuthenticated || !token) {
      if (connectionRef.current) {
        const conn = connectionRef.current;
        if (conn.state === signalR.HubConnectionState.Connected) {
          conn.stop();
        }
        connectionRef.current = null;
      }
      return;
    }

    if (!connectionRef.current) {
      connectionRef.current = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, {
          accessTokenFactory: () => token || localStorage.getItem("token"),
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

      console.log("[SignalR] Hub created:", HUB_URL);
    }

    const connection = connectionRef.current;

    const handleNewOrder = (order) => {
      setNewOrders((prev) => {
        const next = prev + 1;
        console.log("📦 New order assigned (Dashboard):", order);
        return next;
      });

      setIsNotifOpen(true);


      setSoundQueue((prev) => prev + 1);


      setLastRealtimeOrder(order || null);
      setShowPopup(true);

      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
      }
      popupTimeoutRef.current = setTimeout(() => {
        setShowPopup(false);
      }, 4000);
    };


    connection.off("NewOrderAssigned", handleNewOrder);
    connection.on("NewOrderAssigned", handleNewOrder);

    let isCancelled = false;

    const start = async () => {
      if (
        connection.state === signalR.HubConnectionState.Connected ||
        connection.state === signalR.HubConnectionState.Connecting
      ) {
        console.log("[SignalR] Already", connection.state);
        return;
      }

      try {
        console.log("[SignalR] Starting connection... State:", connection.state);
        await connection.start();

        if (isCancelled) {
          console.log(
            "[SignalR] start finished but effect already cleaned, stopping..."
          );
          if (connection.state === signalR.HubConnectionState.Connected) {
            await connection.stop();
          }
          return;
        }

        console.log("✅ SignalR connected (Partner Dashboard)");

        const partnerId = user?.id || user?.userId;
        if (partnerId) {
          try {
            await connection.invoke("JoinPartnerGroup", partnerId);
            console.log("[SignalR] Joined group partner-" + partnerId);
          } catch (err) {
            console.warn("JoinPartnerGroup failed:", err);
          }
        }
      } catch (err) {
        if (
          err?.name === "AbortError" ||
          err?.message?.includes("stopped during negotiation")
        ) {
          console.warn("[SignalR] Start aborted (cleanup):", err);
          return;
        }
        console.error("SignalR connection error:", err);
      }
    };

    start();

    return () => {
      isCancelled = true;
      connection.off("NewOrderAssigned", handleNewOrder);

      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.stop();
      }
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
      }
    };
  }, [isPartner, isAuthenticated, token, user?.id, user?.userId]);

  // ================== 3. HANDLE SOUND QUEUE ==================
  useEffect(() => {
    if (!isPartner) return;
    if (!audioEnabledRef.current) return;

    const audio = notifAudioRef.current;
    if (!audio) {
      console.log("[Audio] element not ready in queue effect");
      return;
    }


    const handleEnded = () => {
      setSoundQueue((prev) => {
        const next = prev - 1;
        if (next > 0) {
          audio.currentTime = 0;
          audio.muted = false;
          audio
            .play()
            .then(() => {
              console.log("[Audio] Played next sound in queue, remain:", next);
            })
            .catch((err) => {
              console.warn("Notification sound play blocked (queue next):", err);
            });
        }
        return next;
      });
    };

    audio.addEventListener("ended", handleEnded);

    if (soundQueue > 0 && audio.paused) {
      audio.currentTime = 0;
      audio
        .play()
        .then(() => {
          console.log("[Audio] Played notification (queue start). Queue:", soundQueue);
        })
        .catch((err) => {
          console.warn("Notification sound play blocked (queue start):", err);
        });
    }

    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [soundQueue, isPartner, isAuthenticated]);

  // ================== BELL ICON SVG ==================
  const BellIcon = ({ className = "" }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.8"
      stroke="currentColor"
    >
      <path
        d="M12 3C9.79086 3 8 4.79086 8 7V8.15483C8 8.82954 7.74527 9.48043 7.28886 9.96117L5.41421 11.9393C5.149 12.2259 5 12.6022 5 12.9948V14C5 14.5523 5.44772 15 6 15H18C18.5523 15 19 14.5523 19 14V12.9948C19 12.6022 18.851 12.2259 18.5858 11.9393L16.7111 9.96117C16.2547 9.48043 16 8.82954 16 8.15483V7C16 4.79086 14.2091 3 12 3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 18C10.3866 18.5978 11.1442 19 12 19C12.8558 19 13.6134 18.5978 14 18"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  // ================== RETURN ==================

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!roles) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <Page>
      <Sparkles />
      {isPartner && (
        <audio
          ref={notifAudioRef}
          src="/sounds/new-order.mp3"
          preload="auto"
          style={{ display: "none" }}
        />
      )}

      {isPartner && showPopup && (
        <div className="fixed top-24 right-4 z-50">
          <div className="bg-white/95 backdrop-blur border border-pink-200 shadow-xl rounded-2xl px-4 py-3 flex items-center gap-3 animate-bounce">
            <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white text-lg">
              🔔
            </div>
            <div>
              <div className="text-sm font-semibold text-pink-600">
                New order assigned!
              </div>
              <div className="text-xs text-gray-600">
                You have a new bouquet order to process.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-b from-pink-100 to-pink-50 p-6 pt-24 relative">
        {/* HEADER + BELL NOTIFICATION */}
        <div className="max-w-5xl mx-auto flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-pink-600 drop-shadow-sm tracking-wide">
              Welcome Back 🌸
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              Choose where you want to go
            </p>
          </div>

          {isPartner && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotifOpen((prev) => !prev)}
                className="relative h-12 w-12 rounded-full bg-white shadow-lg shadow-pink-200 flex items-center justify-center border border-pink-100 hover:bg-pink-50 transition"
              >
                <BellIcon className="w-6 h-6 text-pink-500" />
                {newOrders > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[22px] h-5 px-1 rounded-full bg-pink-500 text-white text-[11px] flex items-center justify-center font-bold">
                    {newOrders}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {isAdmin ? (
              <>
                {/* ============ ADMIN CARDS ============ */}
                <Link
                  to="/admin/user-management"
                  className="group bg-white rounded-[26px] px-10 py-8 shadow-[0_18px_35px_rgba(248,113,165,0.25)] 
                    hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center"
                >
                  <h2 className="text-xl font-semibold text-pink-600 mb-2 text-center">
                    User Management
                  </h2>
                  <p className="text-sm text-gray-600 text-center">
                    View & manage platform users
                  </p>
                </Link>

                <Link
                  to="/bouquetManagement"
                  className="group bg-white rounded-[26px] px-10 py-8 shadow-[0_18px_35px_rgba(248,113,165,0.25)] 
                    hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center"
                >
                  <h2 className="text-xl font-semibold text-pink-600 mb-2 text-center">
                    Bouquet Management
                  </h2>
                  <p className="text-sm text-gray-600 text-center">
                    Add, edit & manage bouquets
                  </p>
                </Link>

                <Link
                  to="/admin/partner-approvals"
                  className="group bg-white rounded-[26px] px-10 py-8 shadow-[0_18px_35px_rgba(248,113,165,0.25)] 
                    hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center"
                >
                  <h2 className="text-xl font-semibold text-pink-600 mb-2 text-center">
                    Partner Approvals
                  </h2>
                  <p className="text-sm text-gray-600 text-center">
                    Review partner requests
                  </p>
                </Link>

                <Link
                  to="/admin/orders"
                  className="group bg-white rounded-[26px] px-10 py-8 shadow-[0_18px_35px_rgba(248,113,165,0.25)] 
                    hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center"
                >
                  <h2 className="text-xl font-semibold text-pink-600 mb-2 text-center">
                    Partner Orders Management
                  </h2>
                  <p className="text-sm text-gray-600 text-center">
                    Manage all bouquet orders
                  </p>
                </Link>

                {/* ✅ ADMIN: LOGOUT CARD */}
                <button
                  onClick={logout}
                  className="group bg-white rounded-[26px] px-10 py-8 shadow-[0_18px_35px_rgba(248,113,165,0.25)]
                    hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center"
                >
                  <h2 className="text-xl font-semibold text-red-500 mb-2 text-center">
                    Logout
                  </h2>
                  <p className="text-sm text-red-400 text-center">
                    Sign out safely
                  </p>
                </button>
              </>
            ) : isPartner ? (
              <>
                {/* ============ PARTNER CARDS ============ */}
                <Link
                  to="/profile"
                  className="group bg-white rounded-[26px] px-10 py-8 shadow-[0_18px_35px_rgba(248,113,165,0.25)]
                    hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center"
                >
                  <h2 className="text-2xl font-semibold text-pink-600 mb-2 text-center">
                    My Account
                  </h2>
                  <p className="text-sm text-gray-600 text-center">
                    View & update your partner info
                  </p>
                </Link>

                <Link
                  to="/partner/orders"
                  className="relative group bg-white rounded-[26px] px-10 py-8 shadow-[0_18px_35px_rgba(248,113,165,0.25)]
                    hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center"
                >
                  {newOrders > 0 && (
                    <span
                      className="absolute -top-3 right-0 rounded-t-[26px] rounded-bl-[26px]
                        bg-pink-500 text-white text-xs font-semibold px-5 py-1 shadow-md"
                    >
                      {newOrders} new
                    </span>
                  )}

                  <h2 className="text-2xl font-semibold text-pink-600 mb-2 text-center">
                    Managed Orders
                  </h2>
                  <p className="text-sm text-gray-600 text-center">
                    View & process assigned orders
                  </p>
                </Link>

                <Link
                  to="/partner/analytics"
                  className="group bg-white rounded-[26px] px-10 py-8 shadow-[0_18px_35px_rgba(248,113,165,0.25)]
                    hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center"
                >
                  <h2 className="text-2xl font-semibold text-pink-600 mb-2 text-center">
                    Analytics
                  </h2>
                  <p className="text-sm text-gray-600 text-center">
                    View sales performance & detailed income reports.
                  </p>
                </Link>

                <button
                  onClick={logout}
                  className="group bg-white rounded-[26px] px-10 py-8 shadow-[0_18px_35px_rgba(248,113,165,0.25)]
                    hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center"
                >
                  <h2 className="text-2xl font-semibold text-red-500 mb-2 text-center">
                    Logout
                  </h2>
                  <p className="text-sm text-red-400 text-center">
                    Sign out safely
                  </p>
                </button>
              </>
            ) : (
              <>
                {/* ============ CUSTOMER CARDS ============ */}
                <Link
                  to="/profile"
                  className="group bg-white rounded-[26px] px-10 py-8 shadow-[0_18px_35px_rgba(248,113,165,0.25)]
                    hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center"
                >
                  <h2 className="text-2xl font-semibold text-pink-600 mb-2 text-center">
                    My Account
                  </h2>
                  <p className="text-sm text-gray-600 text-center">
                    View & update your info
                  </p>
                </Link>

                <Link
                  to="/my-orders"
                  className="group bg-white rounded-[26px] px-10 py-8 shadow-[0_18px_35px_rgba(248,113,165,0.25)]
                    hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center"
                >
                  <h2 className="text-2xl font-semibold text-pink-600 mb-2 text-center">
                    My Orders
                  </h2>
                  <p className="text-sm text-gray-600 text-center">
                    Track your bouquet orders
                  </p>
                </Link>

                <button
                  onClick={logout}
                  className="group bg-white rounded-[26px] px-10 py-8 shadow-[0_18px_35px_rgba(248,113,165,0.25)]
                    hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center"
                >
                  <h2 className="text-2xl font-semibold text-red-500 mb-2 text-center">
                    Logout
                  </h2>
                  <p className="text-sm text-red-400 text-center">
                    Sign out safely
                  </p>
                </button>
              </>
            )}
          </div>
        </div>

        {/* NOTIFICATION POPUP */}
        {isPartner && isNotifOpen && (
          <div className="fixed right-4 bottom-4 w-80 bg-white rounded-2xl shadow-2xl border border-pink-100 p-4 z-50">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-50">
                <BellIcon className="w-5 h-5 text-pink-500" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900">
                    New order notification
                  </span>
                  <button
                    className="text-xs text-gray-400 hover:text-gray-600"
                    onClick={() => setIsNotifOpen(false)}
                  >
                    ✕
                  </button>
                </div>

                {newOrders > 0 ? (
                  <p className="text-xs text-gray-700 mb-2">
                    You currently have{" "}
                    <span className="font-semibold text-pink-600">
                      {newOrders} new order{newOrders > 1 ? "s" : ""}
                    </span>{" "}
                    assigned. Please review them in your managed orders.
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mb-2">
                    You have no new orders waiting for action.
                  </p>
                )}

                <div className="flex justify-end">
                  <Link
                    to="/partner/orders"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-pink-500 text-white text-xs font-semibold hover:bg-pink-600 transition"
                  >
                    View orders
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
