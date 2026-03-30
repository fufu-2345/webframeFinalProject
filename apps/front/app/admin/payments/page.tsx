"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_URL, fetchJson, UserProfile } from "../../lib/account";

interface Payment {
  id: number;
  user_id: number;
  paymenttype: "subscription" | "topup";
  subprice: number;
  tokenpaid: number;
  transdate: string;
  status: string;
}

type Notice = {
  type: "success" | "error";
  text: string;
};

function getCookie(name: string) {
  if (typeof document === "undefined") {
    return "";
  }

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop()?.split(";").shift() ?? "" : "";
}

export default function AdminPaymentPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);

  const loadPendingPayments = async () => {
    const paymentData = await fetchJson<Payment[]>(`${API_URL}/admin/payments/pending/`);
    setPayments(paymentData);
  };

  useEffect(() => {
    const userid = getCookie("userid");

    if (!userid) {
      router.replace("/login");
      return;
    }

    const loadPage = async () => {
      try {
        const profileData = await fetchJson<UserProfile>(`${API_URL}/users/me/`);
        setProfile(profileData);

        if (profileData.role === "admin") {
          await loadPendingPayments();
        }
      } catch (loadError) {
        setNotice({
          type: "error",
          text:
            loadError instanceof Error ? loadError.message : "Unable to load admin payments",
        });
      } finally {
        setLoading(false);
      }
    };

    void loadPage();
  }, [router]);

  const handleVerify = async (paymentId: number, action: "confirm" | "reject") => {
    try {
      await fetchJson<{ message: string }>(`${API_URL}/admin/payments/verify/`, {
        method: "POST",
        body: JSON.stringify({ payment_id: paymentId, action }),
      });

      await loadPendingPayments();
      setNotice({
        type: "success",
        text:
          action === "confirm"
            ? `Payment #${paymentId} was approved.`
            : `Payment #${paymentId} was rejected.`,
      });
    } catch (actionError) {
      setNotice({
        type: "error",
        text:
          actionError instanceof Error ? actionError.message : "Unable to update payment",
      });
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-100 px-6 py-16 text-slate-700">Loading payment approvals...</div>;
  }

  if (profile?.role !== "admin") {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-12">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Admin only</h1>
          <p className="mt-3 text-sm text-slate-600">
            You need an admin account to approve payment requests.
          </p>
          <Link
            href="/admin"
            className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Back to admin
          </Link>
        </div>
      </main>
    );
  }

 return (
  <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border-t-4 border-blue-500">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">
            จัดการรายการชำระเงินที่รอการอนุมัติ
          </h1>
            <p className="text-sm font-medium lowercase  text-gray-500">
            Payment Approval
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm text-white bg-blue-500 hover:bg-blue-600"
          >
            ย้อนกลับ
          </Link>

          <button
            onClick={() => void loadPendingPayments()}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Notice */}
      {notice && (
        <div
          className={`rounded-lg px-5 py-4 text-sm shadow-sm ${
            notice.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Content */}
      {payments.length === 0 ? (
        <div className="bg-white p-20 rounded-lg text-center shadow-md">
          <p className="text-gray-400 italic text-lg">
            No pending requests right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition"
            >
              {/* Top */}
              <div className="p-5 border-b border-gray-50 bg-gray-50/50">
                <div className="flex justify-between items-start">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                    {payment.paymenttype}
                  </span>
                  <span className="text-xs text-gray-400">
                    #{payment.id}
                  </span>
                </div>

                <h2 className="mt-3 font-bold text-gray-800 text-lg">
                  {payment.paymenttype === "subscription"
                    ? "Author subscription request"
                    : `Top-up request: ${payment.tokenpaid} tokens`}
                </h2>
              </div>

              {/* Body */}
              <div className="p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-semibold text-blue-600 font-mono text-base">
                    {payment.subprice} THB
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date:</span>
                  <span className="text-gray-700">
                    {new Date(payment.transdate).toLocaleString("th-TH")}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">User ID:</span>
                  <span className="text-gray-700 font-medium">
                    {payment.user_id}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 bg-gray-50 flex gap-3">
                <button
                  onClick={() => void handleVerify(payment.id, "reject")}
                  className="flex-1 py-2 px-4 border border-red-200 text-red-600 rounded hover:bg-red-50 font-medium transition"
                >
                  Reject
                </button>
                <button
                  onClick={() => void handleVerify(payment.id, "confirm")}
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
