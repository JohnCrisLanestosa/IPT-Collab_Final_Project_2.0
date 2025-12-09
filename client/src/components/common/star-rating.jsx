import { StarIcon } from "lucide-react";
import { Button } from "../ui/button";

function StarRatingComponent({ rating, handleRatingChange }) {
  return [1, 2, 3, 4, 5].map((star) => (
    <Button
      key={star}
      className={`p-2 rounded-full transition-colors ${
        star <= rating
          ? "text-yellow-500 dark:text-yellow-400 hover:bg-yellow-500/20 dark:hover:bg-yellow-400/20"
          : "text-muted-foreground hover:bg-primary hover:text-primary-foreground dark:text-muted hover:bg-primary/20"
      }`}
      variant="outline"
      size="icon"
      onClick={handleRatingChange ? () => handleRatingChange(star) : null}
    >
      <StarIcon
        className={`w-6 h-6 ${
          star <= rating
            ? "fill-yellow-500 dark:fill-yellow-400"
            : "fill-transparent"
        }`}
      />
    </Button>
  ));
}

export default StarRatingComponent;
