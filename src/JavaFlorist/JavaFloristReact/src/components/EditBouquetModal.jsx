import { useState, useEffect } from "react";
import { getBouquet, getOccasions, updateBouquet } from "../api/bouquets";

const BACKEND_URL = "https://localhost:7107";

export default function EditBouquetModal({ id, onClose, onSaved }) {
    const [form, setForm] = useState({
        Name: "",
        Price: "",
        Occasion_Id: "",
        Description: "",
    });

    const [occasions, setOccasions] = useState([]);
    const [existingImages, setExistingImages] = useState([]);

    const [newFiles, setNewFiles] = useState([]);
    const [newPreview, setNewPreview] = useState([]);
    const [deleteIds, setDeleteIds] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [bqRes, occRes] = await Promise.all([
                getBouquet(id),
                getOccasions()
            ]);

            const b = bqRes.data;
            setForm({
                Name: b.name,
                Price: b.price,
                Occasion_Id: b.occasion_Id,
                Description: b.description || "",
            });

            setExistingImages(b.images || []);
            setOccasions(occRes.data);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleFileChange = (e) => {
        const files = [...e.target.files];
        const previews = files.map(f => URL.createObjectURL(f));

        setNewFiles(prev => [...prev, ...files]);
        setNewPreview(prev => [...prev, ...previews]);
    };

    const removeNew = (i) => {
        URL.revokeObjectURL(newPreview[i]);
        setNewPreview(prev => prev.filter((_, x) => x !== i));
        setNewFiles(prev => prev.filter((_, x) => x !== i));
    };

    const removeExisting = (imgId) => {
        setDeleteIds(prev => [...prev, imgId]);
        setExistingImages(prev => prev.filter(i => i.image_Id !== imgId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        const fd = new FormData();
        fd.append("Name", form.Name);
        fd.append("Price", parseInt(form.Price));
        fd.append("Occasion_Id", parseInt(form.Occasion_Id));
        fd.append("Description", form.Description);

        newFiles.forEach(f => fd.append("newImageFiles", f));

        if (deleteIds.length > 0)
            fd.append("imageIdsToDelete", deleteIds.join(","));

        try {
            await updateBouquet(id, fd);
            onSaved(); // reload table
            onClose(); // close modal
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center text-white text-xl">
                Loading...
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200]">
            <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-10 animate-fadeSlide relative">

                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center"
                >
                    ✕
                </button>

                <h1 className="text-3xl font-bold text-pink-600 text-center mb-4">
                    Edit Bouquet
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Name/Price */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm text-gray-600">Name *</label>
                            <input
                                name="Name"
                                value={form.Name}
                                onChange={handleChange}
                                className="w-full p-3 mt-1 border rounded-xl focus:ring-2 focus:ring-pink-300 outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600">Price *</label>
                            <input
                                name="Price"
                                type="number"
                                value={form.Price}
                                onChange={handleChange}
                                className="w-full p-3 mt-1 border rounded-xl focus:ring-2 focus:ring-pink-300 outline-none"
                            />
                        </div>
                    </div>

                    {/* Occasion */}
                    <div>
                        <label className="text-sm text-gray-600">Occasion *</label>
                        <select
                            name="Occasion_Id"
                            value={form.Occasion_Id}
                            onChange={handleChange}
                            className="w-full p-3 mt-1 border rounded-xl"
                        >
                            <option value="">-- choose --</option>
                            {occasions.map(o => (
                                <option key={o.occasion_Id} value={o.occasion_Id}>
                                    {o.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-sm text-gray-600">Description</label>
                        <textarea
                            name="Description"
                            rows={4}
                            value={form.Description}
                            onChange={handleChange}
                            className="w-full p-3 mt-1 border rounded-xl focus:ring-2 focus:ring-pink-300 outline-none"
                        />
                    </div>

                    {/* Existing images */}
                    {existingImages.length > 0 && (
                        <div>
                            <label className="text-sm text-gray-600">Current Images</label>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                                {existingImages.map((img) => (
                                    <div key={img.image_Id} className="relative group">
                                        <img
                                            src={`${BACKEND_URL}${img.url}`}
                                            className="w-full h-32 object-cover rounded-xl shadow-md"
                                        />

                                        {img.is_Main_Image && (
                                            <span className="absolute bottom-2 left-2 bg-pink-500 text-white text-xs px-2 py-1 rounded-md">
                                                Main
                                            </span>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => removeExisting(img.image_Id)}
                                            className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upload new */}
                    <div>
                        <label className="text-sm text-gray-600">Add New Images</label>
                        <label
                            htmlFor="imageUpload"
                            className="mt-2 flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-pink-300 rounded-xl bg-pink-50 cursor-pointer hover:bg-pink-100 transition"
                        >
                            <span className="text-pink-600 font-medium">Upload</span>
                            <p className="text-xs text-gray-500">or drag & drop</p>

                            <input
                                id="imageUpload"
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {/* Preview new */}
                    {newPreview.length > 0 && (
                        <div>
                            <label className="text-sm text-gray-600">New Preview</label>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                                {newPreview.map((src, i) => (
                                    <div key={i} className="relative group">
                                        <img
                                            src={src}
                                            className="w-full h-32 object-cover rounded-xl shadow-md"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => removeNew(i)}
                                            className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Save */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-semibold"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </form>
            </div>
        </div>
    );
}
