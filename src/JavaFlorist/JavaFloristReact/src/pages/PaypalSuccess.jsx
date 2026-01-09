import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { completeCheckout } from '../api/checkout';
import { useCart } from '../context/CartContext';

export default function PaypalSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { clearCart } = useCart();
    const [status, setStatus] = useState("Verifying payment...");
    
   
    const isCalled = useRef(false);

    useEffect(() => {
        if (isCalled.current) return; 
        isCalled.current = true;      

        const finalizeOrder = async () => {
            const paypalToken = searchParams.get('token');
            const localOrderId = localStorage.getItem("pendingLocalOrderId");

            if (!paypalToken || !localOrderId) {
                setStatus("Error: Missing order information.");
                return;
            }

            try {
                console.log("Capturing order...", paypalToken);
                await completeCheckout({
                    PayPalOrderId: paypalToken,
                    LocalOrderId: parseInt(localOrderId)
                });

                setStatus("Payment Successful! Order Placed.");
                clearCart();
                localStorage.removeItem("pendingLocalOrderId");
                
                setTimeout(() => navigate('/my-orders'), 2000);

            } catch (error) {
                console.error("Checkout Error:", error);
                
                const msg = error.response?.data || "Payment verification failed.";
                setStatus(`Status: ${msg}`);
            }
        };

        finalizeOrder();
    }, []); 

    return (
        <div style={{textAlign: 'center', padding: '50px'}}>
            <h1 style={{color: status.includes("Success") ? 'green' : '#db2777', fontSize: '2rem'}}>
                {status}
            </h1>
            <p>Please wait while we process your order...</p>
        </div>
    );
}