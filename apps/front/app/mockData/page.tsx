"use client";

import React, { useState, useEffect } from "react";

interface User {
    userid: number;
    fullname: string;
    role: string;
}

export default function CreateUser() {
    const [userName, setUserName] = useState("");
    const [userRole, setUserRole] = useState("user");

    const [bookTitle, setBookTitle] = useState("");
    const [bookAuthorId, setBookAuthorId] = useState("");

    const [singleFile, setSingleFile] = useState<File | null>(null);

    const [authors, setAuthors] = useState<User[]>([]);

    // Custom Alert Configuration (Mimicking SweetAlert2)
    const [alertConfig, setAlertConfig] = useState<any>({ show: false });

    const fireAlert = (config: any) => {
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

    const fetchAuthors = async () => {
        try {
            const res = await fetch("http://localhost:8000/app/users/list/");
            if (res.ok) {
                const data = await res.json();
                setAuthors(data.filter((u: User) => u.role === "author" || u.role === "admin"));
            }
        } catch (error) {
            console.error("Failed to fetch authors", error);
        }
    };

    useEffect(() => {
        fetchAuthors();
    }, []);

    const handleUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const cleanName = userName.replace(/\s+/g, '').toLowerCase();

        const payload = {
            username: cleanName,
            fullname: userName,
            email: `${cleanName}@gmail.com`,
            password: cleanName,
            role: userRole,
        };

        try {
            const res = await fetch("http://localhost:8000/app/users/create/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setUserName("");
                fetchAuthors();
                await fireAlert({
                    icon: "success",
                    title: "Success",
                    text: "User created successfully!",
                    showConfirmButton: false,
                    timer: 1500
                });
            } else {
                const errorData = await res.json();
                console.error("User Backend Error:", errorData);
                fireAlert({
                    icon: "error",
                    title: "Error",
                    text: JSON.stringify(errorData, null, 2)
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

    const handleBookSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();

        formData.append("title", bookTitle);
        formData.append("author", bookAuthorId);
        formData.append("category", "computer");
        formData.append("ebook_description", `Mock book: ${bookTitle} for testing`);
        formData.append("ebooktoken", "10");
        formData.append("publishdate", new Date().toISOString().substring(0, 10));
        formData.append("page", "100");
        formData.append("poststatus", "Publish");
        formData.append("tag", "mock, test");

        if (singleFile) {
            formData.append("cover", singleFile);
            formData.append("ebooksample", singleFile);
        }

        try {
            const res = await fetch("http://localhost:8000/app/ebooks/create/", {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                setBookTitle("");
                setSingleFile(null);
                (e.target as HTMLFormElement).reset();
                await fireAlert({
                    icon: "success",
                    title: "Success",
                    text: "eBook created successfully!",
                    showConfirmButton: false,
                    timer: 1500
                });
            } else {
                const errorData = await res.json();
                console.error("eBook Backend Error:", errorData);
                fireAlert({
                    icon: "error",
                    title: "Error",
                    text: JSON.stringify(errorData, null, 2)
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
        <div className="min-h-screen bg-gray-100 p-8 relative">

            {/* Custom Alert Modal mimicking SweetAlert2 */}
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
                        {alertConfig.text && <p className="text-gray-500 mb-6 text-sm break-words">{alertConfig.text}</p>}

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

            <h1 className="text-3xl font-bold text-center mb-8">Mock Data</h1>

            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 z-10 relative">
                <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500">
                    <h2 className="text-xl font-bold mb-4 border-b pb-2">Create User</h2>
                    <form onSubmit={handleUserSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">User Name</label>
                            <input type="text" required className="w-full border p-2 rounded mt-1 bg-gray-50"
                                placeholder="Enter User Name"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Role</label>
                            <select className="w-full border p-2 rounded mt-1 bg-gray-50"
                                value={userRole}
                                onChange={(e) => setUserRole(e.target.value)}
                            >
                                <option value="author">Author</option>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition">
                            Create User
                        </button>
                    </form>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-green-500">
                    <h2 className="text-xl font-bold mb-4 border-b pb-2">Create eBook</h2>
                    <form onSubmit={handleBookSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Author</label>
                            <select required className="w-full border p-2 rounded mt-1 bg-gray-50"
                                value={bookAuthorId}
                                onChange={(e) => setBookAuthorId(e.target.value)}
                            >
                                <option value="" disabled>-- Select Author --</option>
                                {authors.map(a => (
                                    <option key={a.userid} value={a.userid}>{a.fullname}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Title</label>
                            <input type="text" required className="w-full border p-2 rounded mt-1 bg-gray-50"
                                placeholder="Enter eBook Title"
                                value={bookTitle}
                                onChange={(e) => setBookTitle(e.target.value)} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Cover | eBookSample</label>
                            <input type="file" required accept="image/*,application/pdf" className="w-full border p-2 rounded mt-1 bg-gray-50 text-sm"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSingleFile(e.target.files?.[0] || null)} />
                        </div>

                        <button type="submit" className="w-full bg-green-600 text-white font-bold py-2 rounded hover:bg-green-700 transition">
                            Create eBook
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}