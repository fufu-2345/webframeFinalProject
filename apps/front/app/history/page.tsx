"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface PaymentHistoryItem {
  id: number;
  type: string;
  tokenpaid: number;
  status: string;
}

interface TransactionHistoryItem {
  id: number;
  paidtype: string;
  ebook_title: string;
  paidtoken: number;
  gettoken: number;
  tokenbalance: number;
  created_at: string;
}

interface HistoryResponse {
  payments?: PaymentHistoryItem[];
  transactions?: TransactionHistoryItem[];
  error?: string;
}

function getCookie(name: string) {
  if (typeof document === "undefined") return "";
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop()?.split(";").shift() ?? "" : "";
}

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<"payment" | "transaction">("payment");
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistoryData = async () => {
      const userid = getCookie("userid");

      if (!userid) {
        setError("Please login first");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`http://localhost:8000/app/history/?userid=${userid}`, {
          credentials: "include",
        });
        const data: HistoryResponse = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load history");
          return;
        }

        setPayments(data.payments || []);
        setTransactions(data.transactions || []);
      } catch {
        setError("Unable to connect to the backend");
      } finally {
        setLoading(false);
      }
    };

    void fetchHistoryData();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-slate-100 px-6 py-16 text-slate-700">Loading history...</div>;
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-12">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">History</h1>
          <p className="mt-3 text-sm text-rose-700">{error}</p>
          <Link
            href="/menu"
            className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Back to menu
          </Link>
        </div>
      </main>
    );
  }

  return (
  <div className="min-h-screen bg-gray-50">
    {/* header */}
    <div className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          History
        </h1>

        <div className="flex gap-2">
          <Link
            href="/menu"
            className="px-4 py-2 text-sm rounded-lg border bg-white text-gray-700"
          >
            Menu
          </Link>
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("payment")}
          className={`px-4 py-2 rounded-lg text-sm ${
            activeTab === "payment"
              ? "bg-blue-500 text-white"
              : "bg-white border text-gray-600"
          }`}
        >
        การเติมโทเค็น
        </button>

        <button
          onClick={() => setActiveTab("transaction")}
          className={`px-4 py-2 rounded-lg text-sm ${
            activeTab === "transaction"
              ? "bg-blue-500 text-white"
              : "bg-white border text-gray-600"
          }`}
        >
          การใช้โทเค็น
        </button>
      </div>

      {/* payment */}
      {activeTab === "payment" && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">รหัส</th>
                <th className="px-6 py-3 text-left">ประเภท</th>
                <th className="px-6 py-3 text-center">จำนวน</th>
                <th className="px-6 py-3 text-center">สถานะ</th>
              </tr>
            </thead>

            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-400">
                    ยังไม่มีประวัติการเติมเงิน
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="border-t">
                    <td className="px-6 py-4">{payment.id}</td>
                    <td className="px-6 py-4">{payment.type}</td>
                    <td className="px-6 py-4 text-center">
                      {payment.tokenpaid} Tk
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          payment.status === "รอตรวจสอบ"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* transaction */}
      {activeTab === "transaction" && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">รหัส</th>
                <th className="px-6 py-3 text-left">วันที่</th>
                <th className="px-6 py-3 text-left">รายการ</th>
                <th className="px-6 py-3 text-left">หนังสือ</th>
                <th className="px-6 py-3 text-center">โทเค็น</th>
                <th className="px-6 py-3 text-right">คงเหลือ</th>
              </tr>
            </thead>

            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    ยังไม่มีรายการ
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-t">
                    <td className="px-6 py-4">{transaction.id}</td>
                    <td className="px-6 py-4">
                      {transaction.created_at?.slice(0, 10)}
                    </td>
                    <td className="px-6 py-4">{transaction.paidtype}</td>
                    <td className="px-6 py-4">
                      {transaction.ebook_title || "-"}
                    </td>

                    <td className="px-6 py-4 text-center font-semibold">
                      {transaction.paidtoken > 0 ? (
                        <span className="text-red-500">
                          -{transaction.paidtoken} Tk
                        </span>
                      ) : (
                        <span className="text-green-500">
                          +{transaction.gettoken} Tk
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right font-semibold">
                      {transaction.tokenbalance} Tk
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);
}
