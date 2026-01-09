import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getUserById } from "../api/user";
import Page from "../components/Page";
export default function UserDetailPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getUserById(id);
        setUser(res.data);
      } catch {
        setError("Failed to load user details.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-pink-600 text-xl font-semibold">
        Loading...
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 text-xl font-semibold">
        {error}
      </div>
    );

  if (!user) return null;

  const isPartner = user.roles?.includes("Partner");
  const isLocked =
    user.lockoutEnd && new Date(user.lockoutEnd) > new Date();

  const prettyDate = (value) => {
    if (!value) return "N/A";
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return "Invalid Date";
    }
  };

  return (
    <Page>
    <div className="min-h-screen bg-gradient-to-br from-pink-200 to-pink-100 flex items-center justify-center p-6 relative">

      {/* Back Button */}
      <Link
        to="/admin/user-management"
        className="absolute top-6 left-6 bg-white/70 backdrop-blur-md px-5 py-3 rounded-full shadow-md text-pink-600 font-medium hover:bg-white transition"
      >
        ← Back to List
      </Link>

      {/* Main Card */}
      <div className="w-full max-w-2xl bg-white/60 backdrop-blur-xl p-10 rounded-3xl shadow-2xl">

        <h1 className="text-4xl font-bold text-pink-600 text-center mb-6">
          User Details
        </h1>

        {/* SECTION TITLE */}
        <div className="text-xl font-semibold text-pink-500 mb-3">
          Account Information
        </div>

        {/* Rows */}
        <DetailRow label="ID" value={user.id} />
        <DetailRow label="Email" value={user.email} />
        <DetailRow label="Username" value={user.userName} />

        {/* Roles */}
        <div className="flex items-start mb-4">
          <span className="w-40 font-semibold text-gray-700">Roles:</span>
          <div className="flex gap-2 flex-wrap">
            {user.roles?.map((r) => (
              <span
                key={r}
                className="px-3 py-1 bg-pink-200 text-pink-700 rounded-full text-sm font-medium"
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Status */}
        <DetailRow
          label="Status"
          value={
            isLocked ? (
              <span className="text-red-600 font-semibold">Locked</span>
            ) : (
              <span className="text-green-600 font-semibold">Active</span>
            )
          }
        />

        <DetailRow
          label="Created Date"
          value={prettyDate(user.createdDate)}
        />

        {/* SECTION TITLE */}
        <div className="text-xl font-semibold text-pink-500 mt-8 mb-3">
          {isPartner ? "Partner Details" : "Personal Details"}
        </div>

        {/* Partner Info */}
        {isPartner ? (
          <>
            <DetailRow
              label="Company Name"
              value={user.companyName || "N/A"}
            />
            <DetailRow
              label="Contact Person"
              value={user.contactPerson || "N/A"}
            />
            <DetailRow
              label="Business License"
              value={user.businessLicenseId || "N/A"}
            />
          </>
        ) : (
          <>
            <DetailRow
              label="First Name"
              value={user.firstName || "N/A"}
            />
            <DetailRow
              label="Last Name"
              value={user.lastName || "N/A"}
            />
            <DetailRow
              label="Gender"
              value={user.gender || "N/A"}
            />
          </>
        )}

        <DetailRow
          label="Phone Number"
          value={user.phoneNumber || "N/A"}
        />
      </div>
    </div>
    </Page>
  );
  
}

/* Reusable Component */
function DetailRow({ label, value }) {
  return (
    <div className="flex items-start mb-3">
      <span className="w-40 font-semibold text-gray-700">{label}:</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}
