import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBouquet, getOccasions, updateBouquet } from "../api/bouquets";
import '../css/EditBouquetPage.css';

const BACKEND_URL = "https://localhost:7107";

export default function EditBouquetPage() {
    const { id } = useParams();
    const nav = useNavigate();


    const [form, setForm] = useState({
        Name: "",
        Price: 0,
        Occasion_Id: "",
        Description: "",
    });


    const [occasions, setOccasions] = useState([]);
    const [existingImages, setExistingImages] = useState([]);

    const [newImageFiles, setNewImageFiles] = useState([]);
    const [newPreviewImages, setNewPreviewImages] = useState([]);

    const [imageIdsToDelete, setImageIdsToDelete] = useState([]);


    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);


    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [bouquetRes, occasionsRes] = await Promise.all([
                    getBouquet(id),
                    getOccasions()
                ]);

                const bouquetData = bouquetRes.data;
                setForm({
                    Name: bouquetData.name,
                    Price: bouquetData.price,
                    Occasion_Id: bouquetData.occasion_Id,
                    Description: bouquetData.description || "",
                });

                setExistingImages(bouquetData.images || []);
                setOccasions(occasionsRes.data);

            } catch (err) {
                console.error("Failed to load data", err);
                setError("Failed to load bouquet data.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });


    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const newPreviewUrls = files.map(file => URL.createObjectURL(file));

        setNewImageFiles(prevFiles => [...prevFiles, ...files]);
        setNewPreviewImages(prevUrls => [...prevUrls, ...newPreviewUrls]);
    };


    const handleRemoveNewImage = (indexToRemove) => {
        URL.revokeObjectURL(newPreviewImages[indexToRemove]);
        setNewPreviewImages(prev => prev.filter((_, index) => index !== indexToRemove));
        setNewImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };


    const handleRemoveExistingImage = (idToRemove) => {

        setImageIdsToDelete(prevIds => [...prevIds, idToRemove]);

        setExistingImages(prevImages => prevImages.filter(img => img.image_Id !== idToRemove));
    };


    const handleCancel = () => {
        nav("/bouquetManagement");
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        const formData = new FormData();


        formData.append("Name", form.Name);
        formData.append("Price", parseInt(form.Price) || 0);
        formData.append("Occasion_Id", parseInt(form.Occasion_Id));
        formData.append("Description", form.Description);


        for (const file of newImageFiles) {
            formData.append("newImageFiles", file);
        }


        if (imageIdsToDelete.length > 0) {
            formData.append("imageIdsToDelete", imageIdsToDelete.join(','));
        }

        try {
            await updateBouquet(id, formData);
            nav("/bouquetManagement");
        } catch (err) {
            const errMsg = err.response?.data?.title || err.message || "An error occurred.";
            setError(errMsg);

        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loading-message">Loading bouquet details...</div>;
    }

    return (
        <div className="edit-bouquet-form-container">
            <form className="edit-bouquet-form" onSubmit={handleSubmit}>

                <div className="form-header">
                    <h1>Edit Bouquet</h1>
                    <p>Update the details for: {form.Name}</p>
                </div>

                <div className="form-body">
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}


                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="Name">Bouquet Name</label>
                            <input
                                id="Name"
                                className="form-input"
                                name="Name"
                                value={form.Name}
                                onChange={handleChange}
                                disabled={saving}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="Price">Price</label>
                            <input
                                id="Price"
                                className="form-input"
                                name="Price"
                                type="number"
                                value={form.Price}
                                onChange={handleChange}
                                disabled={saving}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="Occasion_Id">Occasion</label>
                        <select
                            id="Occasion_Id"
                            className="form-select"
                            name="Occasion_Id"
                            value={form.Occasion_Id}
                            onChange={handleChange}
                            disabled={saving}
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
                        <label htmlFor="Description">Description</label>
                        <textarea
                            id="Description"
                            className="form-textarea"
                            name="Description"
                            value={form.Description}
                            onChange={handleChange}
                            disabled={saving}
                            rows="4"
                        ></textarea>
                    </div>


                    {existingImages.length > 0 && (
                        <div className="preview-container">
                            <label>Current Images</label>
                            <div className="preview-list">
                                {existingImages.map((img) => (
                                    <div key={img.image_Id} className="preview-item">
                                        <img src={`${BACKEND_URL}${img.url}`} alt="Existing" />
                                        {img.is_Main_Image && (
                                            <span className="main-image-badge">Main</span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveExistingImage(img.image_Id)}
                                            className="preview-remove-btn"
                                        >
                                            X
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                    <div className="form-group">
                        <label>Add New Images</label>
                        <div className="upload-dropzone">
                            <label htmlFor="imageFile">
                                <span>Upload files</span>
                                <input
                                    id="imageFile"
                                    type="file"
                                    name="imageFile"
                                    accept="image/png, image/jpeg, image/webp"
                                    onChange={handleFileChange}
                                    disabled={saving}
                                    multiple
                                />
                            </label>
                            <p>or drag and drop.</p>
                        </div>
                    </div>


                    {newPreviewImages.length > 0 && (
                        <div className="preview-container">
                            <label>New Images Preview</label>
                            <div className="preview-list">
                                {newPreviewImages.map((src, index) => (
                                    <div key={index} className="preview-item">
                                        <img src={src} alt={`Preview ${index}`} />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveNewImage(index)}
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
                        type="button"
                        className="btn-cancel"
                        onClick={handleCancel}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn-save"
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}