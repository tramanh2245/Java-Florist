import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyProfile, updateMyProfile } from "../api/profile";
import "../css/ProfilePage.css";
import Page from "../components/Page";


function ProfileRow({ label, value, name, isEditing, onChange, editable = false, type = "text", options = [] }) {
  return (
    <div className="flex justify-between items-center border-b border-pink-100 py-3">
      <span className="text-gray-600 font-medium w-1/3">{label}:</span>
      <div className="w-2/3 text-right text-gray-900">
        {isEditing && editable ? (
          type === "select" ? (
            <select
              name={name}
              value={value || ""}
              onChange={onChange}
              className="w-full p-2 border border-pink-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
            >
              {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <input
              type={type}
              name={name}
              value={value || ""}
              onChange={onChange}
              className="w-full p-2 border border-pink-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500 text-right"
            />
          )
        ) : (
          <span>{value || "N/A"}</span>
        )}
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { roles } = useAuth();
  const isPartner = roles.includes("Partner");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getMyProfile();
      setProfile(data);
  
      setFormData({
        phoneNumber: data.phoneNumber || "",
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        gender: data.gender || "Male",
        contactPerson: data.contactPerson || ""
      });
    } catch (err) {
      setError(err.message || "Failed to fetch profile data.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      await updateMyProfile(formData);
      alert("Profile updated successfully!");
      setIsEditing(false);
      fetchProfile(); 
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Loading Profile...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!profile) return <div className="text-center py-20 text-red-500">Profile not found.</div>;

  return (
    <Page>
      <div className="min-h-screen bg-pink-50 flex flex-col items-center px-4 py-10">
        <div className="flex justify-between items-center w-full max-w-2xl mb-6">
            <h2 className="text-3xl font-bold text-pink-600">
            {isPartner ? "Partner Profile" : "Your Profile"}
            </h2>
            
      
            {!isEditing ? (
                <button 
                    onClick={() => setIsEditing(true)}
                    className="text-pink-600 font-semibold hover:underline flex items-center gap-1"
                >
                    ✏️ Edit Info
                </button>
            ) : (
                <button 
                    onClick={() => setIsEditing(false)}
                    className="text-gray-500 hover:text-gray-700 font-medium"
                >
                    Cancel
                </button>
            )}
        </div>

        <div className="w-full max-w-2xl bg-white/70 backdrop-blur-xl shadow-lg rounded-2xl p-8 border border-pink-200">
          <div className="space-y-1">
            {isPartner ? (
              <>
       
                <ProfileRow label="Company Name" value={profile.companyName} />
                
          
                <ProfileRow 
                    label="Contact Person" 
                    value={isEditing ? formData.contactPerson : profile.contactPerson} 
                    name="contactPerson"
                    isEditing={isEditing}
                    editable={true}
                    onChange={handleChange}
                />
                
                <ProfileRow label="Business License" value={profile.businessLicenseId} />
                <ProfileRow label="Shop Address" value={profile.address} />
                <ProfileRow label="Service Area" value={profile.serviceArea} />
              </>
            ) : (
              <>
           
                <ProfileRow 
                    label="First Name" 
                    value={isEditing ? formData.firstName : profile.firstName}
                    name="firstName"
                    isEditing={isEditing}
                    editable={true}
                    onChange={handleChange}
                />
                <ProfileRow 
                    label="Last Name" 
                    value={isEditing ? formData.lastName : profile.lastName}
                    name="lastName"
                    isEditing={isEditing}
                    editable={true}
                    onChange={handleChange}
                />
                <ProfileRow 
                    label="Gender" 
                    value={isEditing ? formData.gender : profile.gender}
                    name="gender"
                    isEditing={isEditing}
                    editable={true}
                    type="select"
                    options={["Male", "Female"]}
                    onChange={handleChange}
                />
              </>
            )}

            <ProfileRow label="Email" value={profile.email} />
            
          
            <ProfileRow 
                label="Phone" 
                value={isEditing ? formData.phoneNumber : profile.phoneNumber}
                name="phoneNumber"
                isEditing={isEditing}
                editable={true}
                onChange={handleChange}
            />
          </div>

          {/* Footer Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            {isEditing ? (
                 <button
                 onClick={handleSave}
                 disabled={saveLoading}
                 className="px-8 py-3 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 shadow-md transition"
               >
                 {saveLoading ? "Saving..." : "Save Changes"}
               </button>
            ) : (
                <>
                    <Link
                    to="/change-password"
                    className="px-6 py-3 rounded-lg bg-pink-500 text-white font-semibold hover:bg-pink-600 text-center shadow-md transition"
                    >
                    Change Password
                    </Link>

                    <Link
                    to="/dashboard"
                    className="px-6 py-3 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 text-center transition"
                    >
                    Back
                    </Link>
                </>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}
export default ProfilePage;