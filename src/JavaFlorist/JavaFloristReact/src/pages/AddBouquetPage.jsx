import { useState, useEffect } from "react";
import { createBouquet, getOccasions } from "../api/bouquets";
import { useNavigate } from "react-router-dom";
import '../css/AddBouquetPage.css';

export default function AddBouquetPage() {
    const nav = useNavigate();
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

    useEffect(() => {
        const loadOccasions = async () => {
            try {
                const res = await getOccasions();
                setOccasions(res.data);
            } catch (err) {
                console.error("Failed to fetch occasions", err);
                setError("Failed to load occasion list. Please check API.");
            }
        };
        loadOccasions();
    }, []);

    useEffect(() => {
        return () => {
            previewImages.forEach(url => URL.revokeObjectURL(url));
        };
    }, [previewImages]);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const newPreviewUrls = files.map(file => URL.createObjectURL(file));

        setImageFiles(prevFiles => [...prevFiles, ...files]);
        setPreviewImages(prevUrls => [...prevUrls, ...newPreviewUrls]);
    };

    const handleRemoveImage = (indexToRemove) => {
        URL.revokeObjectURL(previewImages[indexToRemove]);
        setPreviewImages(prev => prev.filter((_, index) => index !== indexToRemove));
        setImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!form.name || !form.price || !form.occasion_Id) {
            setError("Please fill in all required fields: Name, Price, and Occasion.");
            return;
        }
        if (imageFiles.length === 0) {
            setError("Please upload at least one image.");
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append("Name", form.name);
        formData.append("Price", parseInt(form.price) || 0);
        formData.append("Occasion_Id", parseInt(form.occasion_Id));
        formData.append("Description", form.description);

        for (const file of imageFiles) {
            formData.append("imageFiles", file);
        }

        try {
            await createBouquet(formData);
            nav("/bouquetManagement");
        } catch (err) {
            const errMsg = err.response?.data?.title || err.message || "An error occurred.";
            setError(errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-bouquet-form-container">
            <form className="add-bouquet-form" onSubmit={handleSubmit}>

                <div className="form-header">
                    <h1>Add New Bouquet</h1>
                    <p>Fill in the details below to add a new product.</p>
                </div>

                <div className="form-body">
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="name">Bouquet Name</label>
                            <input
                                id="name"
                                className="form-input"
                                name="name"
                                placeholder="e.g. Classic Red Roses"
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="price">Price</label>
                            <input
                                id="price"
                                className="form-input"
                                name="price"
                                type="number"
                                placeholder="e.g. 50"
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="occasion_Id">Occasion</label>
                        <select
                            id="occasion_Id"
                            className="form-select"
                            name="occasion_Id"
                            value={form.occasion_Id}
                            onChange={handleChange}
                            disabled={loading}
                            required
                        >
                            <option value="">-- Choose an Occasion --</option>
                            {occasions.map((occ) => (
                                <option key={occ.occasion_Id} value={occ.occasion_Id}>
                                    {occ.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            className="form-textarea"
                            name="description"
                            placeholder="Enter description"
                            onChange={handleChange}
                            disabled={loading}
                            rows="4"
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label>Bouquet Images</label>
                        <div className="upload-dropzone">
                            <label htmlFor="imageFile">
                                <span>Upload files</span>
                                <input
                                    id="imageFile"
                                    type="file"
                                    name="imageFile"
                                    accept="image/png, image/jpeg, image/webp"
                                    onChange={handleFileChange}
                                    disabled={loading}
                                    multiple
                                />
                            </label>
                            <p>or drag and drop. First image will be the main cover.</p>
                        </div>
                    </div>

                    {previewImages.length > 0 && (
                        <div className="preview-container">
                            <label>Image Previews</label>
                            <div className="preview-list">
                                {previewImages.map((src, index) => (
                                    <div key={index} className="preview-item">
                                        <img src={src} alt={`Preview ${index}`} />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(index)}
                                            className="preview-remove-btn"
                                        >
                                            X
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="form-footer">
                    <button
                        type="submit"
                        className="btn-save"
                        disabled={loading}
                    >
                        {loading ? "Saving..." : "Save Bouquet"}
                    </button>
                </div>
            </form>
        </div>
    );
}