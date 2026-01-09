import { useEffect, useState } from "react";
import { getBouquets, deleteBouquet } from "../api/bouquets";
import { Link } from "react-router-dom";
import Page from "../components/Page";
import AddBouquetModal from "../components/AddBouquetModal";
import EditBouquetModal from "../components/EditBouquetModal";

const BACKEND_URL = "https://localhost:7107";

export default function BouquetManagement() {
  const [editingId, setEditingId] = useState(null);

  const [showModal, setShowModal] = useState(false);

  const [bouquets, setBouquets] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedOccasion, setSelectedOccasion] = useState("All");

const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;


  useEffect(() => {
    loadBouquets();
  }, []);

  const loadBouquets = async () => {
    try {
      const res = await getBouquets();
      setBouquets(res.data);
    } catch (err) {
      console.error("Failed to load bouquets:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this bouquet?")) {
      try {
        await deleteBouquet(id);
        loadBouquets();
      } catch (err) {
        console.error("Failed to delete bouquet:", err);
      }
    }
  };

// 1️⃣ Filter bouquets
const filtered = bouquets.filter((b) => {
  const matchesSearch = b.name
    .toLowerCase()
    .includes(search.toLowerCase());

  const occasionName = b.occasion?.name || "Other";

  const matchesOccasion =
    selectedOccasion === "All" ||
    occasionName.toLowerCase() === selectedOccasion.toLowerCase();

  return matchesSearch && matchesOccasion;
});

// 2️⃣ Pagination setup AFTER filtering
const indexOfLast = currentPage * itemsPerPage;
const indexOfFirst = indexOfLast - itemsPerPage;

// 3️⃣ Slice filtered results
const currentItems = filtered.slice(indexOfFirst, indexOfLast);

// 4️⃣ Total pages
const totalPages = Math.ceil(filtered.length / itemsPerPage);

useEffect(() => {
  setCurrentPage(1);
}, [search, selectedOccasion]);


  return (
    <Page>
      <div className="min-h-screen px-6 py-10 bg-pink-50">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-bold text-pink-700 mb-4 md:mb-0">
            Bouquet Management
          </h1>

          <button
            onClick={() => setShowModal(true)}
            className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl shadow-md transition"
          >
            + Add New Bouquet
          </button>
        </div>
        {showModal && (
          <AddBouquetModal
            onClose={() => setShowModal(false)}
            onSaved={loadBouquets}
          />
        )}
        {editingId && (
          <EditBouquetModal
            id={editingId}
            onClose={() => setEditingId(null)}
            onSaved={loadBouquets}
          />
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search bouquets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-3 pl-12 rounded-xl border border-pink-200 focus:ring-2 focus:ring-pink-300 outline-none shadow-sm"
              />
              <span className="absolute left-4 top-3 text-pink-500 text-xl">
                🔍
              </span>
            </div>
          </div>
        </div>

{/* Occasion Filter Buttons */}
<div className="flex flex-wrap gap-3 mb-6 justify-center">

  {[
    "All",
    "Birthday",
    "Anniversary",
    "Valentine's Day",
    "Mother's Day",
    "Sympathy",
    "Congratulations",
    "New Baby",
    "Wedding",
  ].map((o) => (
    <button
      key={o}
      onClick={() => setSelectedOccasion(o)}
      className={`
        px-4 py-2 rounded-full text-sm font-medium transition 
        ${
          selectedOccasion === o
            ? "bg-pink-500 text-white shadow"
            : "bg-pink-100 text-pink-700 hover:bg-pink-200"
        }
      `}
    >
      {o}
    </button>
  ))}
</div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl shadow-xl p-6 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-pink-700 font-semibold border-b border-pink-100">
                <th className="py-3">Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Occasion</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
{currentItems.map((b) => {

                const mainImage =
                  b.images?.find((i) => i.is_Main_Image) || b.images?.[0];

                return (
                  <tr
                    key={b.bouquet_Id}
                    className="border-b border-pink-50 hover:bg-pink-200/40 transition"
                  >
                    {/* Image */}
                    <td className="py-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shadow">
                        {mainImage ? (
                          <img
                            src={`${BACKEND_URL}${mainImage.url}`}
                            alt={b.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-pink-100 flex items-center justify-center text-xs text-gray-500">
                            No Image
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="font-medium text-gray-700">{b.name}</td>

                    {/* Price */}
                    <td className="font-semibold text-pink-600">${b.price}</td>

                    {/* Occasion */}
                    <td className="text-gray-600">
                      {b.occasion?.name || "N/A"}
                    </td>

                    {/* Actions */}
                    <td className="py-3 text-center space-x-3">
                      <button
                        onClick={() => setEditingId(b.bouquet_Id)}
                        className="px-4 py-2 text-sm bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg shadow transition"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(b.bouquet_Id)}
                        className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg shadow transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-500">
                    No bouquets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
{totalPages > 1 && (
  <div className="flex justify-end mt-8 gap-3">


    {/* Prev Button */}
    <button
      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
      disabled={currentPage === 1}
      className={`
        px-4 py-2 rounded-lg border 
        ${currentPage === 1
          ? "border-gray-300 text-gray-400 cursor-not-allowed"
          : "border-pink-300 text-pink-600 hover:bg-pink-50"}
      `}
    >
      Prev
    </button>

    {/* Page Numbers */}
    {[...Array(totalPages)].map((_, i) => (
      <button
        key={i}
        onClick={() => setCurrentPage(i + 1)}
        className={`
          px-4 py-2 rounded-lg 
          ${currentPage === i + 1
            ? "bg-pink-500 text-white"
            : "bg-pink-100 text-pink-700 hover:bg-pink-200"}
        `}
      >
        {i + 1}
      </button>
    ))}

    {/* Next Button */}
    <button
      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
      disabled={currentPage === totalPages}
      className={`
        px-4 py-2 rounded-lg border 
        ${currentPage === totalPages
          ? "border-gray-300 text-gray-400 cursor-not-allowed"
          : "border-pink-300 text-pink-600 hover:bg-pink-50"}
      `}
    >
      Next
    </button>

  </div>
)}

      </div>
    </Page>
  );
}
