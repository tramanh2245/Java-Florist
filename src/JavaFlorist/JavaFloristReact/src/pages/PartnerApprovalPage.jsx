import { useState, useEffect } from "react";
import {
    getPendingApplications,
    approveApplication,
    rejectApplication,
} from "../api/partner";
import Page from "../components/Page";

export default function PartnerApprovalPage() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        loadPendingApplications();
    }, []);

    const loadPendingApplications = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getPendingApplications();
            setApplications(res.data);
        } catch {
            setError("Failed to load applications.");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!confirm("Approve this partner?")) return;

        setActionLoading(id);
        try {
            await approveApplication(id);
            loadPendingApplications();
        } catch {
            setError("Failed to approve.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id) => {
        if (!confirm("Reject this partner?")) return;

        setActionLoading(id);
        try {
            await rejectApplication(id);
            loadPendingApplications();
        } catch {
            setError("Failed to reject.");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <Page>
        <div className="min-h-screen bg-pink-50 px-6 py-10">
            <h1 className="text-3xl font-bold text-pink-700 mb-8">
                Pending Partner Applications
            </h1>

            {error && (
                <div className="text-red-500 bg-red-100 px-4 py-3 rounded-xl mb-4 text-center">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl p-6 overflow-x-auto">
                {loading ? (
                    <p className="text-center py-10 text-gray-500">
                        Loading...
                    </p>
                ) : applications.length === 0 ? (
                    <p className="text-center py-10 text-gray-500">
                        No pending applications.
                    </p>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-pink-700 font-semibold border-b border-pink-100 text-sm">
                                <th className="py-3">Company</th>
                                <th>Contact</th>
                                <th>Area</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Address</th>
                                <th>Submitted</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {applications.map((app) => (
                                <tr
                                    key={app.id}
                                    className="border-b border-pink-50 hover:bg-pink-200/40 transition"
                                >
                                    <td className="font-semibold text-gray-700">
                                        {app.companyName}
                                    </td>
                                    <td>{app.contactPerson}</td>
                                    <td>
                                        <span className="font-medium text-blue-600">
                                            {app.serviceArea || "N/A"}
                                        </span>
                                    </td>
                                    <td>{app.email}</td>
                                    <td>{app.phoneNumber}</td>
                                    <td className="max-w-sm">{app.address}</td>
                                    <td>
                                        {new Date(app.submittedAt).toLocaleDateString()}
                                    </td>

                                    <td className="py-3 text-center space-x-3">
                                        <button
                                            onClick={() => handleApprove(app.id)}
                                            disabled={actionLoading === app.id}
                                            className="px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg shadow transition disabled:opacity-50"
                                        >
                                            {actionLoading === app.id
                                                ? "..."
                                                : "Approve"}
                                        </button>

                                        <button
                                            onClick={() => handleReject(app.id)}
                                            disabled={actionLoading === app.id}
                                            className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg shadow transition disabled:opacity-50"
                                        >
                                            {actionLoading === app.id
                                                ? "..."
                                                : "Reject"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
        </Page>
    );
}
