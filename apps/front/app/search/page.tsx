export default function SearchMenu() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Search System
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">

          <a
            href="/search/payment"
            className="block p-5 rounded-xl border hover:bg-blue-50 transition"
          >
            <p className="text-lg font-semibold text-blue-600">
               Search Payment
            </p>
            <p className="text-sm text-gray-500 mt-1">
              ค้นหาประวัติการเติมโทเค็น
            </p>
          </a>

          <a
            href="/search/transaccount"
            className="block p-5 rounded-xl border hover:bg-green-50 transition"
          >
            <p className="text-lg font-semibold text-green-600">
               Search TransAccount
            </p>
            <p className="text-sm text-gray-500 mt-1">
              ค้นหาประวัติการใช้โทเค็น
            </p>
          </a>

        </div>
      </div>
    </div>
  );
}