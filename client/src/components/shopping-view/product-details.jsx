import { StarIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, fetchCartItems } from "@/store/shop/cart-slice";
import { useToast } from "../ui/use-toast";
import { setProductDetails } from "@/store/shop/products-slice";
import { Label } from "../ui/label";
import StarRatingComponent from "../common/star-rating";
import { useEffect, useState } from "react";
import { addReview, getReviews } from "@/store/shop/review-slice";
import { useNavigate } from "react-router-dom";

function ProductDetailsDialog({ open, setOpen, productDetails }) {
  const [reviewMsg, setReviewMsg] = useState("");
  const [rating, setRating] = useState(0);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.shopCart);
  const { reviews } = useSelector((state) => state.shopReview);

  const { toast } = useToast();

  function handleRatingChange(getRating) {
    console.log(getRating, "getRating");

    setRating(getRating);
  }

  function handleAddToCart(getCurrentProductId, getTotalStock, shouldNavigateToCheckout = false) {
    let getCartItems = cartItems || [];

    if (getCartItems.length) {
      const indexOfCurrentItem = getCartItems.findIndex(
        (item) => item.productId === getCurrentProductId
      );
      if (indexOfCurrentItem > -1) {
        const getQuantity = getCartItems[indexOfCurrentItem].quantity;
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
          if (shouldNavigateToCheckout) {
            handleDialogClose();
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

  function handleBuyNow(getCurrentProductId, getTotalStock) {
    handleAddToCart(getCurrentProductId, getTotalStock, true);
  }

  function handleDialogClose() {
    setOpen(false);
    dispatch(setProductDetails());
    setRating(0);
    setReviewMsg("");
  }

  function handleAddReview() {
    dispatch(
      addReview({
        productId: productDetails?._id,
        userId: user?.id,
        userName: user?.userName,
        reviewMessage: reviewMsg,
        reviewValue: rating,
      })
    ).then((data) => {
      if (data.payload.success) {
        setRating(0);
        setReviewMsg("");
        dispatch(getReviews(productDetails?._id));
        toast({
          title: "Review added successfully!",
          variant: "success",
        });
      }
    });
  }

  useEffect(() => {
    if (productDetails !== null) dispatch(getReviews(productDetails?._id));
  }, [productDetails]);

  console.log(reviews, "reviews");

  const averageReview =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, reviewItem) => sum + reviewItem.reviewValue, 0) /
        reviews.length
      : 0;

  const isOutOfStock = productDetails?.totalStock === 0;

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 p-4 sm:p-6 max-w-[95vw] sm:max-w-[90vw] lg:max-w-[80vw] max-h-[90vh] overflow-y-auto">
        <div className={`relative rounded-lg bg-muted/30 flex items-center justify-center p-4 max-h-[40vh] lg:max-h-[600px] ${isOutOfStock ? 'grayscale opacity-75' : ''}`}>
          <img
            src={productDetails?.image}
            alt={productDetails?.title}
            className={`max-w-full max-h-full object-contain rounded ${isOutOfStock ? 'grayscale' : ''}`}
          />
        </div>
        <div className="flex flex-col">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold ${isOutOfStock ? 'text-gray-600' : ''}`}>{productDetails?.title}</h1>
            <p className="text-muted-foreground text-base sm:text-lg mb-4 mt-2 sm:mb-5 sm:mt-4">
              {productDetails?.description}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className={`text-2xl sm:text-3xl font-bold ${isOutOfStock ? 'text-gray-600' : 'text-primary'}`}>
              ₱{productDetails?.price}
            </p>
            <div className={`text-sm font-semibold px-3 py-1 rounded ${
              productDetails?.totalStock === 0 
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                : productDetails?.totalStock < 10 
                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            }`}>
              {productDetails?.totalStock === 0 
                ? "Out of Stock" 
                : `${productDetails?.totalStock} available`}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-0.5">
              <StarRatingComponent rating={averageReview} />
            </div>
            <span className="text-muted-foreground">
              ({averageReview.toFixed(2)})
            </span>
          </div>
          <div className="mt-4 mb-4 sm:mt-5 sm:mb-5 flex gap-3">
            {productDetails?.totalStock === 0 ? (
              <Button className="w-full opacity-60 cursor-not-allowed">
                Out of Stock
              </Button>
            ) : (
              <>
                <Button
                  className="flex-1"
                  onClick={() =>
                    handleAddToCart(
                      productDetails?._id,
                      productDetails?.totalStock
                    )
                  }
                >
                  Add to Cart
                </Button>
                <Button
                  className="flex-1"
                  onClick={() =>
                    handleBuyNow(
                      productDetails?._id,
                      productDetails?.totalStock
                    )
                  }
                >
                  Buy Now
                </Button>
              </>
            )}
          </div>
          <Separator />
          <div className="max-h-[250px] sm:max-h-[300px] overflow-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Reviews</h2>
            <div className="grid gap-4 sm:gap-6">
              {reviews && reviews.length > 0 ? (
                reviews.map((reviewItem, index) => (
                  <div key={index} className="flex gap-3 sm:gap-4">
                    <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border">
                      <AvatarFallback>
                        {reviewItem?.userName[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm sm:text-base">{reviewItem?.userName}</h3>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <StarRatingComponent rating={reviewItem?.reviewValue} />
                      </div>
                      <p className="text-muted-foreground text-sm break-words">
                        {reviewItem.reviewMessage}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <h1>No Reviews</h1>
              )}
            </div>
            <div className="mt-6 sm:mt-10 flex-col flex gap-2">
              <Label className="text-sm sm:text-base">Write a review</Label>
              <div className="flex gap-1">
                <StarRatingComponent
                  rating={rating}
                  handleRatingChange={handleRatingChange}
                />
              </div>
              <Input
                name="reviewMsg"
                value={reviewMsg}
                onChange={(event) => setReviewMsg(event.target.value)}
                placeholder="Write a review..."
              />
              <Button
                onClick={handleAddReview}
                disabled={reviewMsg.trim() === ""}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ProductDetailsDialog;
