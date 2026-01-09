import React, { useState, useEffect } from 'react';
import { getUsers, deleteUser } from '../api/user';
import { Link } from 'react-router-dom';
import Page from "../components/Page";

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    
    const [activeTab, setActiveTab] = useState('Customer');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10 ;

    useEffect(() => {
        fetchUsers();
    }, []);

    
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getUsers();
            setUsers(Array.isArray(res) ? res : res.data || []);
        } catch (err) {
            setError("Failed to fetch users.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm("Delete this user?")) return;
        try {
            await deleteUser(userId);
            setUsers(users.filter((u) => u.id !== userId));
        } catch {
            alert("Failed to delete user.");
        }
    };

    const formatDate = (d) => {
        if (!d) return "N/A";
        try { return new Date(d).toLocaleDateString(); } 
        catch { return "Invalid"; }
    };

  
    const filteredUsers = users.filter(u => {
      
        let isMatchTab = false;
        if (activeTab === 'Customer') {
            isMatchTab = (u.roles && (u.roles.includes('Customer') || u.roles.includes('User'))) || (!u.roles || u.roles.length === 0);
        } else if (activeTab === 'Partner') {
            isMatchTab = u.roles && u.roles.includes('Partner');
        }
        
        if (!isMatchTab) return false;

        return (
            u.userName?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase())
        );
    });

   
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    return (
      <Page>
        <div className="min-h-screen bg-pink-50 px-6 py-10">
         
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
                <h1 className="text-3xl font-bold text-pink-700">
                    User Management
                </h1>
                <button
                    onClick={fetchUsers}
                    disabled={loading}
                    className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl shadow-md transition"
                >
                    {loading ? "Refreshing..." : "Refresh"}
                </button>
            </div>

         
            <div className="flex justify-center mb-8">
                <div className="inline-flex bg-white p-1.5 rounded-2xl shadow-sm border border-pink-100">
                    <button
                        onClick={() => setActiveTab('Customer')}
                        className={`
                            px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                            ${activeTab === 'Customer' 
                                ? 'bg-pink-500 text-white shadow-md' 
                                : 'text-gray-500 hover:text-pink-600 hover:bg-pink-50'}
                        `}
                    >
                        Customers <span className={`ml-1 text-xs ${activeTab === 'Customer' ? 'text-pink-200' : 'text-gray-400'}`}>
                            ({users.filter(u => (u.roles?.includes('Customer') || u.roles?.includes('User') || !u.roles?.length)).length})
                        </span>
                    </button>
                    
                    <button
                        onClick={() => setActiveTab('Partner')}
                        className={`
                            px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                            ${activeTab === 'Partner' 
                                ? 'bg-pink-500 text-white shadow-md' 
                                : 'text-gray-500 hover:text-pink-600 hover:bg-pink-50'}
                        `}
                    >
                        Partners <span className={`ml-1 text-xs ${activeTab === 'Partner' ? 'text-pink-200' : 'text-gray-400'}`}>
                            ({users.filter(u => u.roles?.includes('Partner')).length})
                        </span>
                    </button>
                </div>
            </div>

            {/* SEARCH BAR */}
            <div className="max-w-md mx-auto mb-8"> 
                <div className="relative">
                    <input
                        type="text"
                        placeholder={`Search ${activeTab.toLowerCase()}...`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-4 py-3 pl-12 rounded-xl border border-pink-200 focus:ring-2 focus:ring-pink-300 outline-none shadow-sm bg-white"
                    />
                    <span className="absolute left-4 top-3 text-pink-500 text-xl">
                        🔍
                    </span>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-2xl shadow-xl p-6 overflow-x-auto">
                {error && (
                    <div className="text-red-500 mb-4 text-center">{error}</div>
                )}

                {currentItems.length === 0 ? (
                    <p className="text-center py-10 text-gray-500">
                        No {activeTab.toLowerCase()}s found.
                    </p>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-pink-700 font-semibold border-b border-pink-100 text-sm">
                                <th className="py-3">Email</th>
                                <th>Roles</th>
                                <th>Phone</th>
                                <th>Created</th>
                                <th>Status</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {currentItems.map((u) => {
                                const locked = u.lockoutEnd && new Date(u.lockoutEnd) > new Date();

                                return (
                                    <tr key={u.id} className="border-b border-pink-50 hover:bg-pink-200/50 transition">
                                        <td className="py-3">
                                            <div className="font-semibold text-gray-800">{u.userName}</div>
                                            <div className="text-gray-500 text-sm">{u.email}</div>
                                        </td>

                                        <td className="text-gray-700">
                                            {u.roles?.map((r) => (
                                                <span key={r} className="bg-pink-100 text-pink-700 px-2 py-1 rounded-md text-xs font-medium mr-1">
                                                    {r}
                                                </span>
                                            ))}
                                        </td>

                                        <td>{u.phoneNumber || "-"}</td>
                                        <td>{formatDate(u.createdDate)}</td>
                                        <td>
                                            {locked ? (
                                                <span className="text-red-600 font-semibold">Locked</span>
                                            ) : (
                                                <span className="text-green-600 font-semibold">Active</span>
                                            )}
                                        </td>

                                        <td className="text-center space-x-3">
                                            <Link to={`/admin/users/${u.id}`} className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow transition">
                                                View
                                            </Link>

                                            <button onClick={() => handleDelete(u.id)} className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg shadow transition">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {totalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg bg-white border border-pink-200 text-pink-600 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        Previous
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i + 1}
                            onClick={() => handlePageChange(i + 1)}
                            className={`w-10 h-10 rounded-lg border transition font-medium
                                ${currentPage === i + 1
                                    ? "bg-pink-500 text-white border-pink-500 shadow-md"
                                    : "bg-white border-pink-200 text-pink-600 hover:bg-pink-50"
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg bg-white border border-pink-200 text-pink-600 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        Next
                    </button>
                </div>
            )}

            <div className="mt-4 text-gray-500 text-sm text-center">
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} results
            </div>
        </div>
      </Page>
    );
}