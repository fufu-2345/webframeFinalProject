"use client";

import React, { useState, useEffect } from "react";
import { API_URL, ensureCsrfToken } from "../lib/account";

interface User {
    userid: number;
    fullname: string;
    role: string;
}

type AlertConfig = {
    show: boolean;
    icon?: "warning" | "success" | "error";
    title?: string;
    text?: string;
    showConfirmButton?: boolean;
    timer?: number;
    resolve?: () => void;
};

export default function LoginPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>("");

    const [alertConfig, setAlertConfig] = useState<AlertConfig>({ show: false });

    const fireAlert = (config: Omit<AlertConfig, "show" | "resolve">) => {
        return new Promise<void>((resolve) => {
            setAlertConfig({ ...config, show: true, resolve });
            if (config.timer) {
                setTimeout(() => {
                    setAlertConfig({ show: false });
                    resolve();
                }, config.timer);
            }
        });
    };

    const closeAlert = () => {
        if (alertConfig.resolve) alertConfig.resolve();
        setAlertConfig({ show: false });
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch("http://localhost:8000/app/users/list/");
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data);
                }
            } catch (error) {
                console.error(error);
            }
        };
        fetchUsers();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedUserId) {
            fireAlert({
                icon: "warning",
                title: "Warning",
                text: "Please select an account."
            });
            return;
        }

        try {
            const csrfToken = await ensureCsrfToken();
            const res = await fetch(`${API_URL}/login/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
                },
                body: JSON.stringify({ userid: selectedUserId }),
                credentials: "include"
            });

            if (res.ok) {
                const data = await res.json();

                document.cookie = `userid=${data.userid}; path=/; max-age=604800`;
                document.cookie = `role=${data.role}; path=/; max-age=604800`;

                await fireAlert({
                    icon: "success",
                    title: "Login Successful!",
                    showConfirmButton: false,
                    timer: 1500
                });

                window.location.href = "/";
            } else {
                fireAlert({
                    icon: "error",
                    title: "Error",
                    text: "Login failed."
                });
            }
        } catch (error) {
            console.error(error);
            fireAlert({
                icon: "error",
                title: "Connection Error",
                text: "Unable to connect to the server."
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">

            {alertConfig.show && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity">
                    <div className="bg-white rounded-lg shadow-2xl p-8 max-w-sm w-full text-center transform transition-all">

                        {alertConfig.icon === 'warning' && (
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
                                <svg className="h-10 w-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                        )}
                        {alertConfig.icon === 'success' && (
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                                <svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                        {alertConfig.icon === 'error' && (
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                                <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        )}

                        <h3 className="text-2xl font-semibold text-gray-800 mb-2">{alertConfig.title}</h3>
                        {alertConfig.text && <p className="text-gray-500 mb-6">{alertConfig.text}</p>}

                        {alertConfig.showConfirmButton !== false && (
                            <button
                                onClick={closeAlert}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm transition-colors"
                            >
                                OK
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border-t-4 border-blue-500 z-10">
                <h1 className="text-2xl font-bold text-center mb-6">Login</h1>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Account</label>
                        <select
                            className="w-full border p-3 rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                        >
                            <option value="" disabled>Select Account</option>
                            {users.map(u => (
                                <option key={u.userid} value={u.userid}>
                                    {u.fullname} ({u.role})
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}
