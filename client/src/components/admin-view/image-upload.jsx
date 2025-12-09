import { FileIcon, UploadCloudIcon, XIcon } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useEffect, useRef } from "react";
import { Button } from "../ui/button";
import axios from "axios";
import { Skeleton } from "../ui/skeleton";

function ProductImageUpload({
  imageFile,
  setImageFile,
  imageLoadingState,
  uploadedImageUrl,
  setUploadedImageUrl,
  setImageLoadingState,
  isEditMode,
  isCustomStyling = false,
}) {
  const inputRef = useRef(null);

  console.log(isEditMode, "isEditMode");

  function handleImageFileChange(event) {
    console.log(event.target.files, "event.target.files");
    const selectedFile = event.target.files?.[0];
    console.log(selectedFile);

    if (selectedFile) setImageFile(selectedFile);
  }

  function handleDragOver(event) {
    event.preventDefault();
  }

  function handleDrop(event) {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) setImageFile(droppedFile);
  }

  function handleRemoveImage() {
    setImageFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function uploadImageToCloudinary() {
    setImageLoadingState(true);
    const data = new FormData();
    data.append("my_file", imageFile);
    const response = await axios.post(
      "http://localhost:5000/api/admin/products/upload-image",
      data
    );
    console.log(response, "response");

    if (response?.data?.success) {
      setUploadedImageUrl(response.data.result.url);
      setImageLoadingState(false);
    }
  }

  useEffect(() => {
    if (imageFile !== null) uploadImageToCloudinary();
  }, [imageFile]);

  return (
    <div
      className={`w-full  mt-4 ${isCustomStyling ? "" : "max-w-md mx-auto"}`}
    >
      <Label className="text-lg font-semibold mb-2 block">Upload Image</Label>
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`${
          isEditMode ? "opacity-60" : ""
        } border-2 border-dashed rounded-lg p-4`}
      >
        <Input
          id="image-upload"
          type="file"
          className="hidden"
          ref={inputRef}
          onChange={handleImageFileChange}
          disabled={isEditMode}
        />
        {!imageFile ? (
          <Label
            htmlFor="image-upload"
            className={`${
              isEditMode ? "cursor-not-allowed" : ""
            } flex flex-col items-center justify-center h-32 cursor-pointer`}
          >
            <UploadCloudIcon className="w-10 h-10 text-muted-foreground mb-2" />
            <span>Drag & drop or click to upload image</span>
          </Label>
        ) : (
          <div className="space-y-2">
            {imageLoadingState && (
              <div className="bg-secondary/20 border border-secondary rounded-md p-2">
                <p className="text-sm text-primary font-medium">Uploading...</p>
              </div>
            )}
            <div className="flex items-center justify-between gap-3 bg-background border-2 border-primary/20 p-3 rounded-md">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="bg-primary rounded p-2">
                  <FileIcon className="w-6 h-6 text-white flex-shrink-0" />
                </div>
                <p className="text-sm font-semibold text-foreground truncate">{imageFile.name}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="bg-background text-foreground hover:text-white hover:bg-destructive transition-all duration-200 flex-shrink-0 border-2 border-border shadow-sm"
                onClick={handleRemoveImage}
              >
                <XIcon className="w-5 h-5 stroke-[3]" />
                <span className="sr-only">Remove File</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductImageUpload;
