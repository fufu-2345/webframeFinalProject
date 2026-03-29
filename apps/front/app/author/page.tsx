"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API_URL = "http://localhost:8000";

type BookItem = {
  title: string;
  total_sales: number;
};

type TransactionItem = {
  transaction_id: number;
  ebook_title: string;
  tokens_earned: number;
  earnings: number;
};

export default function Dashboard() {
  const router = useRouter();
  const [books, setBooks] = useState<BookItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthor, setIsAuthor] = useState(false);
  const [error, setError] = useState("");

  function getCookie(name: string) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
  }

  useEffect(() => {
    const userid = getCookie("userid");

    if (!userid) {
      router.replace("/login");
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/app/users/me/`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("ไม่สามารถดึงข้อมูลผู้ใช้ได้");
        }

        return res.json();
      })
      .then((profile) => {
        document.cookie = `role=${profile.role}; path=/; max-age=604800`;

        if (profile.role !== "author") {
          setIsAuthor(false);
          setLoading(false);
          return;
        }

        setIsAuthor(true);

        return Promise.all([
          fetch(`${API_URL}/app/report/top-ebooks-author/`, {
            credentials: "include",
          }).then(async (res) => {
            if (!res.ok) {
              const text = await res.text();
              console.log("BOOK ERROR:", text);
              throw new Error("ไม่สามารถดึงข้อมูลหนังสือได้");
            }
            return res.json();
          }),
          fetch(`${API_URL}/app/report/transactions/`, {
            credentials: "include",
          }).then(async (res) => {
            if (!res.ok) {
              const text = await res.text();
              console.log("TRANS ERROR:", text);
              throw new Error("ไม่สามารถดึงข้อมูลรายรับได้");
            }
            return res.json();
          }),
        ]);
      })
      .then((result) => {
        if (!result) {
          return;
        }

        const [booksData, transactionsData] = result;
        setBooks(booksData);
        setTransactions(transactionsData);
      })
      .catch((loadError: Error) => {
        setError(loadError.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!isAuthor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <h1 className="text-xl font-bold text-red-500">Author Only</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-xl shadow text-center max-w-md">
          <h1 className="text-xl font-bold text-red-500 mb-3">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-600 text-white py-6 shadow">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Author</h1>
            <p className="text-blue-100 mt-2">รายละเอียดหนังสือและยอดรายรับของคุณ</p>
          </div>
          <Link
            href="/author/subscription"
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium"
          >
            ต่อสมาชิก & เติมโทเคน
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        <div>
          <h2 className="text-2xl font-semibold mb-4">My Books Top Sales</h2>

          {books.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-xl text-center text-gray-500">No data</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {books.map((item, index) => (
                <div key={index} className="bg-white p-4 rounded-xl shadow">
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="text-gray-600">ขายได้ {item.total_sales} ครั้ง</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">รายการรายรับ</h2>

          {transactions.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-xl text-center text-gray-500">No data</div>
          ) : (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full table-auto text-center">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-3 text-center">ID</th>
                    <th className="p-3 text-center">หนังสือ</th>
                    <th className="p-3 text-center">รายรับ</th>
                  </tr>
                </thead>

                <tbody>
                  {transactions.map((item) => (
                    <tr key={item.transaction_id} className="border-b hover:bg-gray-50 align-middle">
                      <td className="p-3 text-center">{item.transaction_id}</td>
                      <td className="p-3 text-center">{item.ebook_title}</td>
                      <td className="p-3 text-center text-green-600 font-bold">
                        +{item.tokens_earned} tokens / {item.earnings} bath
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
