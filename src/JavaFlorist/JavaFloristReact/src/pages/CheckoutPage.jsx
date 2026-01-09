import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import LocationSelector from "../components/LocationSelector";
import { initiateCheckout } from "../api/checkout";
import { getAllOccasions, getMessagesByOccasionId } from "../api/bouquets";
import { getEarliestDeliveryDate, validateSelectedTime, formatDeliveryDisplay } from "../utils/deliveryHelper";

import "../css/CheckoutPage.css";

export default function CheckoutPage() {
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    streetAddress: "",
    deliveryType: "standard",
    scheduledDate: "",
    scheduledTime: "",
    selectedOccasionId: "",
    selectedMessageContent: "",
    customMessage: "",
    useCustomMessage: false,
  });

  const [errors, setErrors] = useState({});
  const [occasionsList, setOccasionsList] = useState([]);
  const [messagesList, setMessagesList] = useState([]);
  const [locationDetails, setLocationDetails] = useState({
    state: "",
    stateCode: "",
    city: "",
  });
  const [earliestDelivery, setEarliestDelivery] = useState(new Date());

  const totalAmount = cartItems.reduce((sum, item) => {
    const price =
      typeof item.price === "string"
        ? parseFloat(item.price.replace("$", ""))
        : item.price;
    return sum + price * item.quantity;
  }, 0);

  useEffect(() => {
    setEarliestDelivery(getEarliestDeliveryDate());
    getAllOccasions().then((res) => setOccasionsList(res.data));
  }, []);

  useEffect(() => {
    if (form.selectedOccasionId) {
      getMessagesByOccasionId(form.selectedOccasionId).then((res) => {
        setMessagesList(res.data);
        setForm((prev) => ({
          ...prev,
          selectedMessageContent: "",
          useCustomMessage: false,
        }));
      });
    }
  }, [form.selectedOccasionId]);

  const validateForm = () => {
    const newErrors = {};
    let valid = true;

    if (!form.customerName.trim()) {
      newErrors.customerName = "Full Name is required.";
      valid = false;
    }
    if (!/^[0-9]{10,12}$/.test(form.phone)) {
      newErrors.phone = "Invalid phone number.";
      valid = false;
    }
    if (!locationDetails.state || !locationDetails.city) {
      newErrors.location = "Select State & City";
      valid = false;
    }
    if (!form.streetAddress.trim()) {
      newErrors.streetAddress = "Address required.";
      valid = false;
    }

    if (form.deliveryType === "scheduled") {
      const timeCheck = validateSelectedTime(
        form.scheduledDate,
        form.scheduledTime
      );
      if (!timeCheck.isValid) {
        newErrors.deliveryTime = timeCheck.message;
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name])
      setErrors((prev) => ({ ...prev, [e.target.name]: null }));
  };

  const handlePayment = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const finalMessage = form.useCustomMessage
        ? form.customMessage
        : form.selectedMessageContent;
      const fullAddress = `${form.streetAddress}, ${locationDetails.city}, ${locationDetails.state}`;

      let finalDeliveryTime = earliestDelivery;
      if (form.deliveryType === "scheduled")
        finalDeliveryTime = new Date(
          `${form.scheduledDate}T${form.scheduledTime}`
        );

      const payload = {
        CustomerName: form.customerName,
        Phone: form.phone,
        ShippingAddress: fullAddress,
        StateCode: locationDetails.stateCode,
        Message: finalMessage,
        EstimatedDeliveryTime: finalDeliveryTime.toISOString(),
        ReturnUrl: `${window.location.origin}/paypal-success`,
        CancelUrl: `${window.location.origin}/checkout`,
        Items: cartItems.map((item) => ({
          BouquetId: item.bouquet_id || item.id,
          Quantity: item.quantity,
        })),
      };

      const result = await initiateCheckout(payload);
      localStorage.setItem("pendingLocalOrderId", result.localOrderId);
      window.location.href = result.approvalUrl;
    } catch (err) {
      console.error(err);
      alert("Payment Init Failed.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-pink-50 via-pink-100 to-pink-200 flex justify-center py-16 px-4">
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-10 max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 border border-pink-200">
        {/* LEFT SIDE — FORM */}
        <div className="accent-pink-500 checkout-form-section">
          <h1 className="text-pink-600 text-3xl font-bold mb-5">Checkout</h1>

          {/* Full Name */}
          <div className="mb-6">
            <label className="block text-pink-600 font-semibold mb-1">
              Full Name *
            </label>
            <input
              className={`w-full border rounded-lg px-4 py-3 text-gray-700 
              placeholder:text-pink-300 border-pink-300
              focus:outline-none focus:ring-2 focus:ring-pink-400
              ${errors.customerName ? "border-red-500" : ""}`}
              name="customerName"
              value={form.customerName}
              onChange={handleChange}
            />

            {errors.customerName && (
              <p className="text-red-500 mt-1 text-sm">{errors.customerName}</p>
            )}
          </div>

          {/* Phone */}
          <div className="mb-6">
            <label className="text-lg font-bold text-pink-600 mb-1">
              Phone Number *
            </label>
            <input
              className={`w-full border rounded-lg px-4 py-3 text-gray-700 
              placeholder:text-pink-300 border-pink-300
              focus:outline-none focus:ring-2 focus:ring-pink-400
              ${errors.phone ? "border-red-500" : ""}`}
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />

            {errors.phone && (
              <p className="text-red-500 mt-1 text-sm">{errors.phone}</p>
            )}
          </div>

          {/* Shipping Address */}
          <div className="text-lg font-bold text-pink-600 mt-6 mb-3">
            Shipping Address
          </div>

          <LocationSelector
            onLocationSelect={(data) => setLocationDetails(data)}
          />
          {errors.location && <p className="error-text">{errors.location}</p>}

          <div className="mb-6 mt-4">
            <label className="block text-pink-600 font-semibold mb-1">
              Street Address *
            </label>
            <input
              className={`w-full border rounded-lg px-4 py-3 text-gray-700 
              placeholder:text-pink-300 border-pink-300
              focus:outline-none focus:ring-2 focus:ring-pink-400
              ${errors.streetAddress ? "border-red-500" : ""}`}
              name="streetAddress"
              value={form.streetAddress}
              onChange={handleChange}
            />

            {errors.streetAddress && (
              <p className="text-red-500 mt-1 text-sm">
                {errors.streetAddress}
              </p>
            )}
          </div>

          {/* Delivery Time — BEAUTIFIED */}
          <div className="text-xl font-bold text-pink-600 mt-8 mb-4">
            Delivery Time
          </div>

          <div className="bg-pink-50/60 border border-pink-200 rounded-2xl p-5 space-y-4 shadow-sm">
            {/* Standard */}
            <label className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-all">
              <input
                type="radio"
                name="deliveryType"
                value="standard"
                checked={form.deliveryType === "standard"}
                onChange={handleChange}
                className="accent-pink-500 h-5 w-5 mt-1"
              />
              <div>
                <p className="font-semibold text-gray-800 text-lg">
                  Standard Delivery
                </p>
                <p className="text-sm text-gray-500">
                  Earliest: {formatDeliveryDisplay(earliestDelivery)}
                </p>
              </div>
            </label>

            {/* Scheduled */}
            <label className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-all">
              <input
                type="radio"
                name="deliveryType"
                value="scheduled"
                checked={form.deliveryType === "scheduled"}
                onChange={handleChange}
                className="accent-pink-500 h-5 w-5 mt-1"
              />
              <p className="font-semibold text-gray-800 text-lg">
                Schedule for Later
              </p>
            </label>

            {/* Scheduled Fields */}
            {form.deliveryType === "scheduled" && (
              <div className="grid grid-cols-2 gap-4 p-2 animate-fadeIn">
                <div>
                  <label className="text-gray-600 font-medium">
                    Select Date
                  </label>
                  <input
                    className="form-input mt-1"
                    type="date"
                    name="scheduledDate"
                    value={form.scheduledDate}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="text-gray-600 font-medium">
                    Select Time (09:00 - 21:00)
                  </label>
                  <input
                    className="form-input mt-1"
                    type="time"
                    name="scheduledTime"
                    value={form.scheduledTime}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {errors.deliveryTime && (
              <p className="text-red-500 text-xs font-semibold pl-1">
                {errors.deliveryTime}
              </p>
            )}
          </div>
        </div>

        {/* RIGHT SIDE — SUMMARY + PAYPAL + GIFT MESSAGE */}
        <div className="checkout-summary-section">
          {/* ORDER SUMMARY */}
          <div className="bg-pink-50 border-pink-200 p-6 rounded-2xl border shadow-md">
            <div className="text-2xl font-semibold text-gray-700 mb-6">
              Order Summary
            </div>

            <div className="space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-gray-500">Your cart is empty…</div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.bouquet_id}
                    className="flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                      <span className="font-medium text-gray-700">
                        {item.name}
                      </span>
                      <span className="text-gray-500">× {item.quantity}</span>
                    </div>
                    <span className="font-semibold text-pink-600">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-between text-lg font-bold text-pink-600">
              <span>Total:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
          {/* GIFT MESSAGE (MOVED BELOW PAYPAL — FULL SECTION) */}
          <div className="mt-8 bg-white border border-pink-200 rounded-2xl p-6 shadow-sm">
            <div className="section-header mb-3 text-pink-600 font-bold text-xl">
              Gift Message
            </div>

            {/* Occasion */}
            <div className="mb-6">
              <label className="block text-gray-600 font-semibold mb-1">
                Select Occasion *
              </label>
              <select
                name="selectedOccasionId"
                className="w-full border rounded-lg px-4 py-3 text-pink-700 bg-white border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
                value={form.selectedOccasionId}
                onChange={handleChange}
              >
                <option value="">-- Select Occasion --</option>
                {occasionsList.map((o) => (
                  <option key={o.occasion_Id} value={o.occasion_Id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div className="form-group mt-4">
              <label className="block text-gray-600 font-semibold mb-1">
                Select Message *
              </label>
              <select
                className={`w-full border rounded-lg px-4 py-3 text-pink-700 bg-white border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400 ${errors.message ? "border-red-500" : ""
                  }`}
                value={
                  form.useCustomMessage ? "custom" : form.selectedMessageContent
                }
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    useCustomMessage: v === "custom",
                    selectedMessageContent: v !== "custom" ? v : "",
                  }));
                }}
                disabled={!form.selectedOccasionId}
              >
                <option value="">-- Choose message --</option>
                {messagesList.map((msg) => (
                  <option key={msg.id} value={msg.content}>
                    {msg.content}
                  </option>
                ))}
                <option value="custom">-- Write my own message --</option>
              </select>
            </div>

            {/* Custom message */}
            {form.useCustomMessage && (
              <textarea
                className={`form-textarea mt-3 ${errors.message ? "border-red-500" : ""
                  }`}
                name="customMessage"
                value={form.customMessage}
                rows="3"
                onChange={handleChange}
              />
            )}

            {errors.message && <p className="error-text">{errors.message}</p>}
          </div>
          {/* PAYPAL BUTTON */}
          <button
            className="btn-paypal mt-6"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? "Processing..." : "Pay with PayPal"}
          </button>
        </div>
      </div>
    </div>
  );
}
