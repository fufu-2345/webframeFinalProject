"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface Payment {
  id: number;
  user_id: number;
  paymenttype: "subscription" | "topup";
  subprice: number;
  tokenpaid: number;
  transdate: string;
  status: string;
}

type AlertConfig = {
  show: boolean;
  icon?: "success" | "error";
  title?: string;
  text?: string;
  timer?: number;
  showConfirmButton?: boolean;
  resolve?: () => void;
};

export default function AdminPaymentPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({ show: false });

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
    return "";
  };

  const fireAlert = useCallback((config: Omit<AlertConfig, "show">) => {
    return new Promise<void>((resolve) => {
      setAlertConfig({ ...config, show: true, resolve });
      if (config.timer) {
        setTimeout(() => {
          setAlertConfig({ show: false });
          resolve();
        }, config.timer);
      }
    });
  }, []);

  const closeAlert = () => {
    if (alertConfig.resolve) alertConfig.resolve();
    setAlertConfig({ show: false });
  };

  const fetchPendingPayments = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:8000/app/admin/payments/pending/", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      } else if (res.status === 403) {
        await fireAlert({
          icon: "error",
          title: "Access Denied",
          text: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้",
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        await fireAlert({
          icon: "error",
          title: "Error",
          text: errData.error || "โหลดข้อมูลไม่สำเร็จ",
        });
      }
    } catch (error) {
      console.error(error);
      await fireAlert({
        icon: "error",
        title: "Connection Error",
        text: "ไม่สามารถเชื่อมต่อ Server ได้",
      });
    } finally {
      setLoading(false);
    }
  }, [fireAlert]);

  useEffect(() => {
    const userid = getCookie("userid");
    if (!userid) {
      router.replace("/login");
      setLoading(false);
      return;
    }

    fetchPendingPayments();
  }, [fetchPendingPayments, router]);

  const getCsrfToken = async (): Promise<string> => {
    const res = await fetch("http://localhost:8000/app/csrf/", {
      credentials: "include",
    });
    const data = await res.json();
    return data.csrfToken;
  };

  const handleVerify = async (paymentId: number, action: "confirm" | "reject") => {
    try {
      const csrfToken = await getCsrfToken();

      const res = await fetch("http://localhost:8000/app/admin/payments/verify/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({ payment_id: paymentId, action }),
        credentials: "include",
      });

      if (res.ok) {
        await fireAlert({
          icon: "success",
          title: action === "confirm" ? "Confirmed!" : "Rejected!",
          text: `Transaction ${paymentId} has been updated.`,
          timer: 1500,
          showConfirmButton: false,
        });
        fetchPendingPayments();
      } else {
        const errData = await res.json();
        fireAlert({
          icon: "error",
          title: "Error",
          text: errData.error || "Something went wrong",
        });
      }
    } catch (error) {
      console.error(error);
      fireAlert({
        icon: "error",
        title: "Connection Error",
        text: "ไม่สามารถเชื่อมต่อ Server ได้",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 relative font-sans">
      {alertConfig.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-sm w-full text-center transform transition-all">
            {alertConfig.icon === "success" ? (
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
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
                className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                OK
              </button>
            )}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-sm border-t-4 border-blue-500">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-500">จัดการรายการชำระเงินที่รอการอนุมัติ</p>
          </div>
          <button
            onClick={fetchPendingPayments}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </header>

        {loading ? (
          <div className="text-center py-20 text-gray-400">กำลังโหลดข้อมูล...</div>
        ) : payments.length === 0 ? (
          <div className="bg-white p-20 rounded-lg text-center shadow-md">
            <p className="text-gray-400 italic text-lg">ไม่มีรายการที่รอการตรวจสอบในขณะนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {payments.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition"
              >
                <div className="p-5 border-b border-gray-50 bg-gray-50/50">
                  <div className="flex justify-between items-start">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        p.paymenttype === "subscription" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"
                      }`}
                    >
                      {p.paymenttype.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">#{p.id}</span>
                  </div>
                  <h2 className="mt-3 font-bold text-gray-800 text-lg">
                    {p.paymenttype === "subscription" ? "สมัครสมาชิกนักเขียน" : `เติมเงิน ${p.tokenpaid} Tokens`}
                  </h2>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">ยอดเงิน:</span>
                    <span className="font-semibold text-blue-600 font-mono text-base">
                      {p.subprice.toLocaleString()} THB
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">วันที่ทำรายการ:</span>
                    <span className="text-gray-700">{new Date(p.transdate).toLocaleString("th-TH")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">User ID:</span>
                    <span className="text-gray-700 font-medium">{p.user_id}</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 flex gap-3">
                  <button
                    onClick={() => handleVerify(p.id, "reject")}
                    className="flex-1 py-2 px-4 border border-red-200 text-red-600 rounded hover:bg-red-50 font-medium transition"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleVerify(p.id, "confirm")}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium shadow-sm transition"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
