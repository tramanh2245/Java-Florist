import { useState } from "react";
import { Link } from "react-router-dom";
import { submitPartnerApplication } from "../api/partner";
import LocationSelector from "../components/LocationSelector";
import Page from "../components/Page";
import "../css/PartnerRegistrationPage.css";


const STATE_TO_ZONE_MAP = {
  DL: "North Zone",
  HR: "North Zone",
  PB: "North Zone",
  HP: "North Zone",
  JK: "North Zone",
  CH: "North Zone",
  LA: "North Zone",

  UP: "North-Central Zone",
  UT: "North-Central Zone",

  MH: "West Zone",
  GA: "West Zone",
  DN: "West Zone",
  DD: "West Zone",

  GJ: "North-West Zone",
  RJ: "North-West Zone",

  KA: "South Zone",
  KL: "South Zone",
  LD: "South Zone",

  TN: "South-East Zone",
  PY: "South-East Zone",
  AN: "South-East Zone",

  TG: "Central Zone",
  AP: "Central Zone",

  MP: "Central-East Zone",
  CT: "Central-East Zone",

  WB: "East Zone",
  OR: "East Zone",
  BR: "East Zone",
  JH: "East Zone",

  AS: "North-East Zone",
  SK: "North-East Zone",
  MN: "North-East Zone",
  ML: "North-East Zone",
  TR: "North-East Zone",
  NL: "North-East Zone",
  MZ: "North-East Zone",
  AR: "North-East Zone",
};


const ZONE_DETAILS = {
  "North Zone":
    "Delhi, Haryana, Punjab, Himachal Pradesh, Jammu & Kashmir, Chandigarh, Ladakh",
  "North-Central Zone": "Uttar Pradesh, Uttarakhand",
  "West Zone": "Maharashtra (Mumbai/Pune), Goa, Dadra & Nagar Haveli, Daman & Diu",
  "North-West Zone": "Gujarat (Ahmedabad), Rajasthan (Jaipur)",
  "South Zone": "Karnataka (Bengaluru), Kerala, Lakshadweep",
  "South-East Zone": "Tamil Nadu (Chennai), Puducherry, Andaman & Nicobar",
  "Central Zone": "Telangana (Hyderabad), Andhra Pradesh",
  "Central-East Zone": "Madhya Pradesh, Chhattisgarh",
  "East Zone": "West Bengal (Kolkata), Odisha, Bihar, Jharkhand",
  "North-East Zone":
    "Assam, Sikkim, Manipur, Meghalaya, Tripura, Nagaland, Mizoram, Arunachal Pradesh",
};

export default function PartnerRegistrationPage() {

  const [form, setForm] = useState({
    CompanyName: "",
    ContactPerson: "",
    Email: "",
    PhoneNumber: "",
    Address: "",
    BusinessLicenseId: "",
    ServiceArea: "",
  });


  const [streetAddress, setStreetAddress] = useState("");
  const [locationDetails, setLocationDetails] = useState({
    state: "",
    stateCode: "",
    city: "",
  });


  const [assignedZone, setAssignedZone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);


  const [showZoneInfo, setShowZoneInfo] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };


  const handleLocationSelect = (data) => {
    setLocationDetails(data);

    if (data.stateCode) {

      setForm((prev) => ({
        ...prev,
        ServiceArea: data.stateCode,
      }));


      const zone = STATE_TO_ZONE_MAP[data.stateCode] || "Unknown Region";
      setAssignedZone(zone);
    } else {
      setForm((prev) => ({ ...prev, ServiceArea: "" }));
      setAssignedZone("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);


    if (!locationDetails.state || !locationDetails.city || !streetAddress) {
      setError("Please select complete address.");
      return;
    }


    if (!form.ServiceArea) {
      setError("Service area is invalid. Please select a valid Indian state.");
      return;
    }

    setLoading(true);

    const fullAddress = `${streetAddress}, ${locationDetails.city}, ${locationDetails.state}`;

    const submitData = {
      ...form,
      Address: fullAddress,
    };

    try {
      const res = await submitPartnerApplication(submitData);
      setSuccess(res.data.message);

      // Reset form
      setForm({
        CompanyName: "",
        ContactPerson: "",
        Email: "",
        PhoneNumber: "",
        Address: "",
        BusinessLicenseId: "",
        ServiceArea: "",
      });
      setStreetAddress("");
      setLocationDetails({ state: "", stateCode: "", city: "" });
      setAssignedZone("");
    } catch (err) {
      const errMsg =
        err.response?.data?.message || err.message || "An error occurred.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-md text-center">
          <p className="text-lg font-semibold text-green-600 mb-4">{success}</p>
          <Link to="/" className="text-pink-600 hover:underline">
            Back to home page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Page>
      <div className="min-h-screen bg-pink-50 flex items-center justify-center px-4 py-12">
        <form className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-2xl space-y-8"
          onSubmit={handleSubmit}>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-pink-600">Partner Registration</h1>
            <p className="text-gray-500 mt-1">
              Join us and start selling your products on Java Florist.
            </p>
          </div>

          <div className="form-body">
            {error && <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm text-center">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="CompanyName">Company Name *</label>
                <input
                  id="CompanyName"
                  className="mt-1 w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-300 outline-none"
                  name="CompanyName"
                  value={form.CompanyName}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="ContactPerson">Contact Person *</label>
                <input
                  id="ContactPerson"
                  className="mt-1 w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-300 outline-none"
                  name="ContactPerson"
                  value={form.ContactPerson}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="Email">Email *</label>
                <input
                  id="Email"
                  className="mt-1 w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-300 outline-none"
                  name="Email"
                  type="email"
                  value={form.Email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="PhoneNumber">Phone Number *</label>
                <input
                  id="PhoneNumber"
                  className="mt-1 w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-300 outline-none"
                  name="PhoneNumber"
                  type="tel"
                  value={form.PhoneNumber}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Business Address *</label>
              <LocationSelector onLocationSelect={handleLocationSelect} />

              <input
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-300 outline-none"
                placeholder="Street Address (e.g. 123 Mahatma Gandhi Road)"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                disabled={loading}
                required
              />
            </div>



            <div className="form-group">
              <label htmlFor="BusinessLicenseId">
                Business License ID (Optional)
              </label>
              <input
                id="BusinessLicenseId"
                className="form-input"
                name="BusinessLicenseId"
                value={form.BusinessLicenseId}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 text-white font-semibold bg-pink-500 hover:bg-pink-600 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </Page>
  );
}
