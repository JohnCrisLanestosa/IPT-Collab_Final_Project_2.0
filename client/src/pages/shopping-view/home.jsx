import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ShirtIcon,
  Shirt,
  WatchIcon,
  Gift,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllFilteredProducts,
  fetchProductDetails,
} from "@/store/shop/products-slice";
import ShoppingProductTile from "@/components/shopping-view/product-tile";
import { useNavigate, useSearchParams } from "react-router-dom";
import { addToCart, fetchCartItems } from "@/store/shop/cart-slice";
import { useToast } from "@/components/ui/use-toast";
import ProductDetailsDialog from "@/components/shopping-view/product-details";

const categoriesWithIcon = [
  { id: "pe-uniform", label: "P.E Uniform", icon: ShirtIcon },
  { id: "souvenirs", label: "Souvenirs", icon: Gift },
  { id: "books", label: "Books", icon: BookOpen },
  { id: "clothing", label: "Clothing", icon: Shirt },
  { id: "accessories", label: "Accessories", icon: WatchIcon },
];

function ShoppingHome() {
  const { productList, productDetails } = useSelector(
    (state) => state.shopProducts
  );

  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);

  const { user } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.shopCart);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  function handleNavigateToListingPage(getCurrentItem, section) {
    sessionStorage.removeItem("filters");
    const currentFilter = {
      [section]: [getCurrentItem.id],
    };

    sessionStorage.setItem("filters", JSON.stringify(currentFilter));
    navigate(`/shop/listing`);
  }

  function handleGetProductDetails(getCurrentProductId) {
    dispatch(fetchProductDetails(getCurrentProductId));
  }

  function getCartItemsList() {
    if (Array.isArray(cartItems)) return cartItems;
    if (Array.isArray(cartItems?.items)) return cartItems.items;
    return [];
  }

  function attemptAddToCart(getCurrentProductId, getTotalStock, shouldNavigate) {
    if (!user?.id) {
      navigate("/auth/login");
      return;
    }

    const existingCartItems = getCartItemsList();
    const hasStockLimit = typeof getTotalStock === "number";

    if (existingCartItems.length && hasStockLimit) {
      const indexOfCurrentItem = existingCartItems.findIndex(
        (item) => item.productId === getCurrentProductId
      );
      if (indexOfCurrentItem > -1) {
        const getQuantity = existingCartItems[indexOfCurrentItem].quantity;
        if (getQuantity + 1 > getTotalStock) {
          toast({
            title: `Only ${getQuantity} quantity can be added for this item`,
            variant: "destructive",
          });

          return;
        }
      }
    }

    dispatch(
      addToCart({
        userId: user?.id,
        productId: getCurrentProductId,
        quantity: 1,
      })
    ).then((data) => {
      if (data?.payload?.success) {
        dispatch(fetchCartItems(user?.id)).then(() => {
          if (shouldNavigate) {
            navigate("/shop/checkout");
          } else {
            toast({
              title: "Product is added to cart",
              variant: "success",
            });
          }
        });
      }
    });
  }

  function handleAddtoCart(getCurrentProductId, getTotalStock) {
    attemptAddToCart(getCurrentProductId, getTotalStock, false);
  }

  function handleBuyNow(getCurrentProductId, getTotalStock) {
    attemptAddToCart(getCurrentProductId, getTotalStock, true);
  }

  useEffect(() => {
    if (productDetails !== null) setOpenDetailsDialog(true);
  }, [productDetails]);

  useEffect(() => {
    dispatch(
      fetchAllFilteredProducts({
        filterParams: {},
        sortParams: "price-lowtohigh",
      })
    );
  }, [dispatch]);

  console.log(productList, "productList");

  // Check for Google OAuth success messages
  useEffect(() => {
    const successType = searchParams.get("success");
    const message = searchParams.get("message");

    if (successType && message) {
      toast({
        title: decodeURIComponent(message),
        variant: "success",
      });

      // Clean up URL parameters after showing the message
      setSearchParams({});
    }
  }, [searchParams, toast, setSearchParams]);

  return (
    <div className="flex flex-col min-h-screen">
      <section className="py-6 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-4 text-[#041b3a] dark:text-blue-100">
            Shop by category
          </h2>
          <div className="overflow-x-auto">
            <div className="grid grid-flow-col auto-cols-[minmax(70px,1fr)] gap-2">
              {categoriesWithIcon.map((categoryItem) => (
                <Card
                  onClick={() =>
                    handleNavigateToListingPage(categoryItem, "category")
                  }
                  key={categoryItem.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <CardContent className="flex flex-col items-center justify-center p-2">
                    <categoryItem.icon className="w-3 h-3 mb-0.5 text-primary" />
                    <span className="text-[11px] font-semibold text-center">
                      {categoryItem.label}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-6">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-6 text-[#041b3a] dark:text-blue-100">
            Feature Products
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {productList && productList.length > 0
              ? productList.map((productItem) => (
                  <ShoppingProductTile
                    handleGetProductDetails={handleGetProductDetails}
                    product={productItem}
                    handleAddtoCart={handleAddtoCart}
                    handleBuyNow={handleBuyNow}
                  />
                ))
              : null}
          </div>
        </div>
      </section>
      <ProductDetailsDialog
        open={openDetailsDialog}
        setOpen={setOpenDetailsDialog}
        productDetails={productDetails}
      />
    </div>
  );
}

export default ShoppingHome;
