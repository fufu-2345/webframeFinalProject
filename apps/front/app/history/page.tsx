"use client";
import { useEffect, useState } from "react";

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState("payment");
  const [payments, setPayments] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
    return null;
  };

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const fetchHistoryData = async () => {
    try {
      const currentUserId = getCookie("userid");

      if (!currentUserId) {
        setError("Please login first");
        setLoading(false);
        return;
      }

      const res = await fetch(
        `http://localhost:8000/app/history/?userid=${currentUserId}`
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to get data");
        return;
      }

      setPayments(data.payments || []);
      setTransactions(data.transactions || []);
    } catch (err) {
      setError("cant connect to backend");
    } finally {
      setLoading(false);
    }
  };

  // loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-2">⚠️ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            ประวัติการทำรายการ
          </h1>
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
            💳 การเติมโทเค็น
          </button>

          <button
            onClick={() => setActiveTab("transaction")}
            className={`px-4 py-2 rounded-lg text-sm ${
              activeTab === "transaction"
                ? "bg-blue-500 text-white"
                : "bg-white border text-gray-600"
            }`}
          >
            📜 การใช้โทเค็น
          </button>
        </div>

        {/* payment */}
        {activeTab === "payment" && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500">
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
                  payments.map((pay) => (
                    <tr key={pay.id} className="border-t text-sm">
                      <td className="px-6 py-4">{pay.id}</td>
                      <td className="px-6 py-4">{pay.type}</td>
                      <td className="px-6 py-4 text-center">
                        {pay.tokenpaid} Tk
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            pay.status === "รอตรวจสอบ"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {pay.status}
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
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500">
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
                  transactions.map((t) => (
                    <tr key={t.id} className="border-t text-sm">
                      <td className="px-6 py-4">{t.id}</td>
                      <td className="px-6 py-4">
                        {t.created_at?.slice(0, 10)}
                      </td>
                      <td className="px-6 py-4">{t.paidtype}</td>
                      <td className="px-6 py-4">{t.ebook_title}</td>

                      <td className="px-6 py-4 text-center font-semibold">
                        {t.paidtoken > 0 ? (
                          <span className="text-red-500">
                            -{t.paidtoken} Tk
                          </span>
                        ) : (
                          <span className="text-green-500">
                            +{t.gettoken} Tk
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold">
                          {t.tokenbalance} Tk
                        </span>
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