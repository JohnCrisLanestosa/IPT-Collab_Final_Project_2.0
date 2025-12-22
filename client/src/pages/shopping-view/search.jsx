import ProductDetailsDialog from "@/components/shopping-view/product-details";
import ShoppingProductTile from "@/components/shopping-view/product-tile";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { showSuccess } from "@/components/ui/use-success-indicator";
import { addToCart, fetchCartItems } from "@/store/shop/cart-slice";
import { fetchProductDetails } from "@/store/shop/products-slice";
import {
  getSearchResults,
  resetSearchResults,
} from "@/store/shop/search-slice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/common/back-button";

function SearchProducts() {
  const [keyword, setKeyword] = useState("");
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { searchResults, isLoading } = useSelector((state) => state.shopSearch);
  const { productDetails } = useSelector((state) => state.shopProducts);

  const { user } = useSelector((state) => state.auth);

  const { cartItems } = useSelector((state) => state.shopCart);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (keyword && keyword.trim() !== "" && keyword.trim().length > 2) {
      const timer = setTimeout(() => {
        setSearchParams(new URLSearchParams(`?keyword=${keyword}`));
        dispatch(getSearchResults(keyword));
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setSearchParams(new URLSearchParams(`?keyword=${keyword}`));
      dispatch(resetSearchResults());
    }
  }, [keyword, dispatch, setSearchParams]);

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
            showSuccess("Product is added to cart");
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

  function handleGetProductDetails(getCurrentProductId) {
    console.log(getCurrentProductId);
    dispatch(fetchProductDetails(getCurrentProductId));
  }

  useEffect(() => {
    if (productDetails !== null) setOpenDetailsDialog(true);
  }, [productDetails]);

  function handleClearSearch() {
    setKeyword("");
    setSearchParams(new URLSearchParams());
    dispatch(resetSearchResults());
  }

  console.log(searchResults, "searchResults");

  return (
    <div className="container mx-auto md:px-6 px-4 py-8">
      <div className="mb-4">
        <BackButton fallbackPath="/shop/home" />
      </div>
      <div className="flex justify-start mb-8">
        <div className="w-full max-w-2xl flex items-center relative">
          <Input
            value={keyword}
            name="keyword"
            onChange={(event) => setKeyword(event.target.value)}
            className="h-12 px-4 pr-12 text-base"
            placeholder="Search Products..."
          />
          {keyword && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClearSearch}
              className="absolute right-2 h-8 w-8 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <h1 className="text-2xl font-semibold">Searching...</h1>
        </div>
      ) : null}
      
      {!isLoading && keyword.length > 2 && searchResults && searchResults.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <h1 className="text-3xl font-extrabold text-gray-400">No results found for "{keyword}"</h1>
        </div>
      ) : null}
      
      {!isLoading && keyword.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <h1 className="text-2xl font-semibold text-gray-400">Start typing to search for products...</h1>
        </div>
      ) : null}
      
      {!isLoading && keyword.length > 0 && keyword.length <= 2 ? (
        <div className="flex justify-center items-center py-20">
          <h1 className="text-2xl font-semibold text-gray-400">Type at least 3 characters to search...</h1>
        </div>
      ) : null}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {!isLoading && searchResults && searchResults.length > 0
          ? searchResults.map((item) => (
              <ShoppingProductTile
                key={item._id}
                handleAddtoCart={handleAddtoCart}
                product={item}
                handleBuyNow={handleBuyNow}
                handleGetProductDetails={handleGetProductDetails}
              />
            ))
          : null}
      </div>
      <ProductDetailsDialog
        open={openDetailsDialog}
        setOpen={setOpenDetailsDialog}
        productDetails={productDetails}
      />
    </div>
  );
}

export default SearchProducts;
