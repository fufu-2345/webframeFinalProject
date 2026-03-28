"use client";

import React, { useState, useEffect } from "react";

interface Ebook {
    ebookid: number;
    title: string;
    cover: string;
    ebooktoken: number;
    author: number;
}

export default function EbookList() {
    const [ebooks, setEbooks] = useState<Ebook[]>([]);

    // จำลองข้อมูลผู้ใช้ (ล็อกอินแล้ว) และยอดเงินคงเหลือ
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [userTokens, setUserTokens] = useState<number>(500); // สมมติว่ามี 500 โทเคน
    const TOKEN_RATE = 50; // 1 โทเคน = 50 บาท

    // อัปเกรด Alert Config ให้รองรับการ Confirm/Cancel
    const [alertConfig, setAlertConfig] = useState<any>({ show: false });

    const fireAlert = (config: any) => {
        return new Promise<boolean>((resolve) => {
            setAlertConfig({ ...config, show: true, resolve });
            if (config.timer) {
                setTimeout(() => {
                    setAlertConfig({ show: false });
                    resolve(true); // default ให้เป็น true ถ้าหมดเวลา
                }, config.timer);
            }
        });
    };

    const handleAlertClose = (isConfirmed: boolean) => {
        if (alertConfig.resolve) alertConfig.resolve(isConfirmed);
        setAlertConfig({ show: false });
    };

    const fetchEbooks = async () => {
        try {
            const res = await fetch("http://localhost:8000/app/ebooks/list/");
            if (res.ok) {
                const data = await res.json();
                setEbooks(data);
            }
        } catch (error) {
            console.error("Failed to fetch ebooks", error);
        }
    };

    useEffect(() => {
        fetchEbooks();
    }, []);

    const handleBuyClick = async (ebook: Ebook) => {
        // 1. ตรวจสอบว่าล็อกอินหรือยัง
        if (!isLoggedIn) {
            await fireAlert({
                icon: "error",
                title: "เข้าสู่ระบบก่อน",
                text: "กรุณาล็อกอินเข้าระบบก่อนทำรายการซื้อหนังสือ",
                showCancelButton: false,
                confirmButtonText: "ตกลง"
            });
            return;
        }

        // 2. ตรวจสอบยอดโทเคนว่าพอหรือไม่
        if (userTokens < ebook.ebooktoken) {
            await fireAlert({
                icon: "error",
                title: "ยอดโทเคนไม่เพียงพอ",
                text: `หนังสือเล่มนี้ราคา ${ebook.ebooktoken} โทเคน แต่คุณมีเพียง ${userTokens} โทเคน (กรุณาเติมโทเคน)`,
                showCancelButton: false,
                confirmButtonText: "ตกลง"
            });
            return;
        }

        // 3. เรียกใช้ Alert แบบมี Confirm / Cancel
        const isConfirmed = await fireAlert({
            icon: "warning",
            title: "ยืนยันการซื้อ",
            text: `คุณต้องการซื้อหนังสือ "${ebook.title}" ในราคา ${ebook.ebooktoken} โทเคน ใช่หรือไม่? (ยอดคงเหลือของคุณจะถูกหักทันที)`,
            showCancelButton: true,
            confirmButtonText: "ใช่, ซื้อเลย",
            cancelButtonText: "ยกเลิก"
        });

        if (isConfirmed) {
            // ตาม Requirement: การซื้อหนังสือไม่ต้องตรวจสอบ (Admin) หักบัญชีโทเคนได้เลย
            // ในการใช้งานจริง: ตรงนี้จะเป็นการยิง API ไปบันทึก Payment และ TransAccount
            // ตัวอย่าง: await fetch(`http://localhost:8000/app/payment/buy/`, { ... });

            // หักโทเคนทันที
            setUserTokens(prev => prev - ebook.ebooktoken);

            await fireAlert({
                icon: "success",
                title: "สั่งซื้อสำเร็จ!",
                text: `คุณได้ซื้อหนังสือ "${ebook.title}" เรียบร้อยแล้ว ยอดคงเหลือใหม่ของคุณคือ ${userTokens - ebook.ebooktoken} โทเคน`,
                showCancelButton: false,
                confirmButtonText: "ตกลง",
                timer: 3000
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8 relative">

            {/* Custom Alert Modal */}
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

                        <div className="flex justify-center space-x-3 mt-6">
                            {alertConfig.showCancelButton && (
                                <button
                                    onClick={() => handleAlertClose(false)}
                                    className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm w-full"
                                >
                                    {alertConfig.cancelButtonText || "Cancel"}
                                </button>
                            )}
                            {alertConfig.showConfirmButton !== false && (
                                <button
                                    onClick={() => handleAlertClose(true)}
                                    className={`inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm w-full
                                        ${alertConfig.icon === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                                            : alertConfig.icon === 'error' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'}`}
                                >
                                    {alertConfig.confirmButtonText || "OK"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header แสดงยอด Token ของผู้ใช้ */}
            <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">คลังหนังสือ eBook</h1>
                    <p className="text-sm text-gray-500 mt-1">เลือกซื้อหนังสือด้วยโทเคนของคุณ</p>
                </div>
                {isLoggedIn && (
                    <div className="text-right bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
                        <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mb-1">ยอดคงเหลือของคุณ</p>
                        <div className="flex items-baseline space-x-2">
                            <span className="text-2xl font-black text-indigo-700">{userTokens}</span>
                            <span className="text-sm font-bold text-indigo-500">Tokens</span>
                        </div>
                        {/* แสดงยอดเงินที่แปลงแล้วตาม Requirement */}
                        <p className="text-xs text-gray-500 mt-1">({(userTokens * TOKEN_RATE).toLocaleString()} บาท)</p>
                    </div>
                )}
            </div>

            {ebooks.length === 0 ? (
                <div className="text-center text-gray-500 py-10">ไม่พบหนังสือในระบบ หรือกำลังโหลดข้อมูล...</div>
            ) : (
                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 z-10 relative">
                    {ebooks.map((ebook) => (
                        <div
                            key={ebook.ebookid}
                            onClick={() => handleBuyClick(ebook)}
                            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col cursor-pointer"
                        >
                            <div className="h-64 bg-gray-200 relative overflow-hidden group">
                                {/* ถ้ารูปไม่มี จะแสดงสีเทา ถ้ามี จะโหลดจาก http://localhost:8000 */}
                                {ebook.cover ? (
                                    <img
                                        src={`http://localhost:8000${ebook.cover}`}
                                        alt={ebook.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400?text=No+Cover'; }}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        ไม่มีรูปปก
                                    </div>
                                )}
                            </div>

                            <div className="p-5 flex-grow flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">{ebook.title}</h3>
                                    <p className="text-sm text-gray-500 mb-3">รหัสหนังสือ: #{ebook.ebookid}</p>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-xl font-bold text-indigo-600">
                                        {ebook.ebooktoken} <span className="text-sm font-medium text-indigo-400">Tokens</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}