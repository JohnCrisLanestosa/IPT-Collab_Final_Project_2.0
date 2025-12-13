import CustomerInfo from "@/components/shopping-view/customer-info";
import { useDispatch, useSelector } from "react-redux";
import UserCartItemsContent from "@/components/shopping-view/cart-items-content";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createNewOrder } from "@/store/shop/order-slice";
import { fetchCartItems } from "@/store/shop/cart-slice";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";
import BackButton from "@/components/common/back-button";

function ShoppingCheckout() {
  const { cartItems } = useSelector((state) => state.shopCart);
  const { user } = useSelector((state) => state.auth);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [isPaymentStart, setIsPaymemntStart] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [buttonClicked, setButtonClicked] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  console.log(customerInfo, "cartItems");

  const totalCartAmount =
    cartItems && cartItems.length > 0
      ? cartItems.reduce(
          (sum, currentItem) =>
            sum + currentItem?.price * currentItem?.quantity,
          0
        )
      : 0;

  function handlePlaceOrder() {
    if (cartItems.length === 0) {
      toast({
        title: "Your cart is empty. Please add items to proceed",
        variant: "destructive",
      });

      return;
    }
    if (customerInfo === null || !customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      toast({
        title: "Please fill in all required customer information (Name, Email, and Phone Number) to proceed.",
        variant: "destructive",
      });

      return;
    }

    // Validate phone number format
    const phoneRegex = /^[0-9]{10,}$/;
    const cleanedPhone = customerInfo.phone.replace(/\D/g, ''); // Remove non-digits
    if (!cleanedPhone || cleanedPhone.length < 10) {
      toast({
        title: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      userId: user?.id,
      cartId: cartItems?._id,
      cartItems: cartItems.map((singleCartItem) => ({
        productId: singleCartItem?.productId,
        title: singleCartItem?.title,
        image: singleCartItem?.image,
        price: singleCartItem?.price,
        quantity: singleCartItem?.quantity,
      })),
      addressInfo: {
        address: customerInfo.name, // Store name in address field for compatibility
        city: "", // Not needed for customer info
        pincode: "", // Not needed for customer info
        phone: cleanedPhone, // Use cleaned phone number (digits only)
        notes: customerInfo.email, // Store email in notes field for compatibility
      },
      orderStatus: "pending",
      paymentMethod: "cash",
      paymentStatus: "pending",
      totalAmount: totalCartAmount,
      orderDate: new Date(),
      orderUpdateDate: new Date(),
    };

    setButtonClicked(true);
    setIsPaymemntStart(true);

    dispatch(createNewOrder(orderData)).then((data) => {
      if (data?.payload?.success) {
        setIsSuccess(true);
        setIsPaymemntStart(false);
        
        // Show success animation briefly before navigating
        setTimeout(() => {
          // Clear cart by refetching (backend already cleared it)
          dispatch(fetchCartItems()).then(() => {
            navigate("/shop/payment-success", { state: { orderId: data?.payload?.orderId } });
          });
        }, 800);
      } else {
        setIsPaymemntStart(false);
        setButtonClicked(false);
        setIsSuccess(false);
        toast({
          title: "Failed to create order. Please try again.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="flex flex-col">
      <div className="p-5 pt-6">
        <BackButton fallbackPath="/shop/home" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5 p-5">
        <CustomerInfo
          customerInfo={customerInfo}
          setCustomerInfo={setCustomerInfo}
          onFormDataChange={(formData) => {
            // Auto-save customer info whenever form data changes
            setCustomerInfo(formData);
          }}
        />
        <div className="flex flex-col gap-4">
          {cartItems && cartItems.length > 0
            ? cartItems.map((item) => (
                <UserCartItemsContent cartItem={item} />
              ))
            : null}
          <div className="mt-8 space-y-4">
            <div className="flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold">₱{totalCartAmount}</span>
            </div>
          </div>
          <div className="mt-4 w-full">
            <Button 
              onClick={handlePlaceOrder} 
              className={`w-full transition-all duration-300 ${
                buttonClicked && !isSuccess
                  ? "animate-pulse scale-95"
                  : isSuccess
                  ? "bg-green-500 hover:bg-green-600 scale-105"
                  : "hover:scale-105 active:scale-95"
              }`}
              disabled={isPaymentStart || isSuccess}
            >
              {isPaymentStart ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Placing Order...
                </span>
              ) : isSuccess ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 animate-in zoom-in duration-300" />
                  Order Placed Successfully!
                </span>
              ) : (
                "Place Order"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShoppingCheckout;
