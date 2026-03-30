"use client";

import { useState } from "react";

export default function SearchPaymentPage() {
  const [username, setUsername] = useState("");
  const [date, setDate] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);

    try {
      const query = new URLSearchParams({
        username,
        date,
      }).toString();

      const res = await fetch(
        `http://localhost:8000/app/payments/search/?${query}`
      );

      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            ค้นหาประวัติการชำระเงิน
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* search box */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <input
              type="date"
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <button
              onClick={handleSearch}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              ค้นหา
            </button>
          </div>
        </div>

        {/* loading */}
        {loading && (
          <div className="text-center py-10">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500 text-sm">กำลังค้นหา...</p>
          </div>
        )}

        {/* table */}
        {!loading && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-6 py-3 text-left">ID</th>
                  <th className="px-6 py-3 text-left">User</th>
                  <th className="px-6 py-3 text-left">Type</th>
                  <th className="px-6 py-3 text-center">Token</th>
                  <th className="px-6 py-3 text-center">Date</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>

              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-10 text-gray-400"
                    >
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                ) : (
                  results.map((item) => (
                    <tr key={item.id} className="border-t text-sm">
                      <td className="px-6 py-4">{item.id}</td>
                      <td className="px-6 py-4">{item.username}</td>
                      <td className="px-6 py-4">{item.paymenttype}</td>

                      <td className="px-6 py-4 text-center font-semibold">
                        {item.tokenpaid} Tk
                      </td>

                      <td className="px-6 py-4 text-center">
                        {item.transdate?.slice(0, 10)}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            item.status === "wait"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {item.status}
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