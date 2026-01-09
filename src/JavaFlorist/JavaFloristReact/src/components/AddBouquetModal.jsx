import { useState, useEffect } from "react";
import { createBouquet, getOccasions } from "../api/bouquets";

export default function AddBouquetModal({ onClose, onSaved }) {
    const [form, setForm] = useState({
        name: "",
        price: "",
        occasion_Id: "",
        description: "",
    });

    const [imageFiles, setImageFiles] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);

    const [occasions, setOccasions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load Occasions
    useEffect(() => {
        const load = async () => {
            try {
                const res = await getOccasions();
                setOccasions(res.data);
            } catch {
                setError("Failed to load occasions.");
            }
        };
        load();
    }, []);

    // Cleanup URLs
    useEffect(() => {
        return () => {
            previewImages.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [previewImages]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const urls = files.map((f) => URL.createObjectURL(f));

        setImageFiles((prev) => [...prev, ...files]);
        setPreviewImages((prev) => [...prev, ...urls]);
    };

    const handleRemoveImage = (index) => {
        URL.revokeObjectURL(previewImages[index]);
        setPreviewImages((prev) => prev.filter((_, i) => i !== index));
        setImageFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!form.name || !form.price || !form.occasion_Id)
            return setError("Name, Price, and Occasion are required.");

        if (imageFiles.length === 0)
            return setError("Please upload at least one image.");

        setLoading(true);

        const fd = new FormData();
        fd.append("Name", form.name);
        fd.append("Price", parseInt(form.price));
        fd.append("Occasion_Id", parseInt(form.occasion_Id));
        fd.append("Description", form.description);

        imageFiles.forEach((file) => fd.append("imageFiles", file));

        try {
            await createBouquet(fd);
            onSaved();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        // BACKDROP
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200]">
            {/* MODAL CARD */}
            <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-10 animate-fadeSlide relative">

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center"
                >
                    ✕
                </button>

                {/* Header */}
                <h1 className="text-3xl font-bold text-pink-600 text-center mb-3">
                    Add New Bouquet
                </h1>
                <p className="text-center text-gray-500 mb-6">Fill in all details below.</p>

                {/* Error */}
                {error && (
                    <div className="bg-red-100 border border-red-300 text-red-600 p-3 rounded-md text-center mb-4">
                        {error}
                    </div>
                )}

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Name & Price */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm text-gray-700">Bouquet Name *</label>
                            <input
                                name="name"
                                required
                                onChange={handleChange}
                                className="w-full mt-1 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-300 outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-700">Price *</label>
                            <input
                                name="price"
                                required
                                type="number"
                                onChange={handleChange}
                                className="w-full mt-1 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-300 outline-none"
                            />
                        </div>
                    </div>

                    {/* Occasion */}
                    <div>
                        <label className="text-sm text-gray-700">Occasion *</label>
                        <select
                            name="occasion_Id"
                            value={form.occasion_Id}
                            required
                            onChange={handleChange}
                            className="w-full mt-1 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-300 outline-none"
                        >
                            <option value="">-- Choose --</option>
                            {occasions.map((o) => (
                                <option key={o.occasion_Id} value={o.occasion_Id}>
                                    {o.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-sm text-gray-700">Description</label>
                        <textarea
                            name="description"
                            rows={4}
                            onChange={handleChange}
                            className="w-full mt-1 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-300 outline-none"
                        ></textarea>
                    </div>

                    {/* Upload */}
                    <div>
                        <label className="text-sm text-gray-700">Bouquet Images *</label>

                        <label
                            htmlFor="imageFile"
                            className="mt-2 flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-pink-300 rounded-xl bg-pink-50 cursor-pointer hover:bg-pink-100 transition"
                        >
                            <span className="text-pink-600 font-medium">Upload Images</span>
                            <p className="text-xs text-gray-500">or drag and drop</p>

                            <input
                                id="imageFile"
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {/* Previews */}
                    {previewImages.length > 0 && (
                        <div>
                            <label className="text-sm text-gray-700">Image Preview</label>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                                {previewImages.map((src, i) => (
                                    <div key={i} className="relative group">
                                        <img
                                            src={src}
                                            className="w-full h-32 object-cover rounded-xl shadow-md"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(i)}
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
                        disabled={loading}
                        className="w-full py-4 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-xl transition disabled:opacity-50"
                    >
                        {loading ? "Saving…" : "Save Bouquet"}
                    </button>
                </form>
            </div>
        </div>
    );
}
