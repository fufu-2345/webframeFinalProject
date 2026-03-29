"use client"

import { useEffect, useState } from "react"

type TopBook = {
  title: string
  author: string | null
  total_sales: number
}

export default function TopBooksPage() {
  const [data, setData] = useState<TopBook[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getTopBooks() {
      try {
        const res = await fetch("http://127.0.0.1:8000/app/report/top-books/", {
          credentials: "include"
        })

        if (!res.ok) {
          const text = await res.text()
          console.log("ERROR:", text)
          throw new Error("Failed to fetch data")
        }

        const result = (await res.json()) as TopBook[]
        setData(result)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    getTopBooks()
  }, [])

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-600 text-white py-6 shadow">
        <h1 className="text-3xl font-bold text-center">
          Top Books Sales
        </h1>
        <p className="text-center text-blue-100 mt-2">
          All Books famous
        </p>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        <p className="mb-4 text-gray-600">
          พบทั้งหมด {data.length} รายการ
        </p>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {data.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow hover:shadow-xl transition p-5 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-400">
                  #{index + 1}
                </span>

                {index < 3 && (
                  <span className="bg-yellow-400 text-white text-xs px-2 py-1 rounded-full">
                    TOP {index + 1}
                  </span>
                )}
              </div>

              <div className="mt-3">
                <h2 className="text-lg font-semibold line-clamp-2">
                  {item.title}
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  {item.author ?? "-"}
                </p>
              </div>

              <div className="mt-4">
                <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">
                  ขายแล้ว {item.total_sales} ครั้ง
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
