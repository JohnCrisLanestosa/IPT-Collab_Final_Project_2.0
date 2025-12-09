import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAdminProfile, updateAdminProfile } from "@/store/admin/profile-slice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { User, Mail, Calendar, ShieldCheck, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function AdminProfile() {
  const dispatch = useDispatch();
  const { profile, isLoading } = useSelector((state) => state.adminProfile);
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [imageLoadingState, setImageLoadingState] = useState(false);
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
  });

  useEffect(() => {
    dispatch(getAdminProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setFormData({
        userName: profile.userName || "",
        email: profile.email || "",
      });
      setUploadedImageUrl(profile.profilePicture || "");
    }
  }, [profile]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const updateData = {
      userName: formData.userName,
      email: formData.email,
      profilePicture: uploadedImageUrl,
    };

    dispatch(updateAdminProfile(updateData)).then((data) => {
      if (data?.payload?.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
          variant: "success",
        });
        setIsEditing(false);
        setImageFile(null);
        dispatch(getAdminProfile());
      } else {
        toast({
          title: "Error",
          description: data?.payload?.message || "Failed to update profile",
          variant: "destructive",
        });
      }
    });
  };

  const handleRemoveProfilePicture = () => {
    setUploadedImageUrl("");
    setImageFile(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold text-primary flex items-center gap-2">
          <User className="h-8 w-8" />
          My Profile
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Overview */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Profile Information</span>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="hover:bg-secondary/20"
              >
                Edit Profile
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="space-y-4">
              {/* Profile Picture Display */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="relative">
                  {profile?.profilePicture ? (
                    <img
                      src={profile.profilePicture}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-10 w-10 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profile Picture</p>
                  <p className="font-semibold">
                    {profile?.profilePicture ? "Uploaded" : "No picture set"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="font-semibold">{profile?.userName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">{profile?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Badge className="mt-1 bg-primary hover:bg-primary/80">
                    {profile?.role === "superadmin" ? "Super Admin" : "Admin"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-semibold text-sm">
                    {profile?.createdAt ? formatDate(profile.createdAt) : "N/A"}
                  </p>
                </div>
              </div>

              {profile?.lastLogin && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Last Login</p>
                    <p className="font-semibold text-sm">
                      {formatDate(profile.lastLogin)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Profile Picture Upload - Compact */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <Label className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Profile Picture
                </Label>
                
                <div className="flex items-center gap-4">
                  {/* Avatar Preview */}
                  <div className="relative">
                    {uploadedImageUrl ? (
                      <img
                        src={uploadedImageUrl}
                        alt="Profile Preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center">
                        <User className="h-8 w-8 text-primary/50" />
                      </div>
                    )}
                    {imageLoadingState && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <div className="text-white text-xs">...</div>
                      </div>
                    )}
                  </div>

                  {/* Upload/Remove Actions */}
                  <div className="flex-1">
                    <Input
                      id="profile-picture-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImageFile(file);
                          // Upload to Cloudinary
                          const formData = new FormData();
                          formData.append("my_file", file);
                          setImageLoadingState(true);
                          fetch("http://localhost:5000/api/admin/products/upload-image", {
                            method: "POST",
                            body: formData,
                          })
                            .then((res) => res.json())
                            .then((data) => {
                              if (data?.success) {
                                setUploadedImageUrl(data.result.url);
                                setImageLoadingState(false);
                                toast({
                                  title: "Image uploaded",
                                  description: "Profile picture uploaded successfully",
                                  variant: "success",
                                });
                              }
                            })
                            .catch((error) => {
                              setImageLoadingState(false);
                              toast({
                                title: "Upload failed",
                                description: "Failed to upload image",
                                variant: "destructive",
                              });
                            });
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => document.getElementById("profile-picture-upload").click()}
                        className="flex-1 bg-secondary/20 hover:bg-secondary/30 border-secondary/40"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadedImageUrl ? "Change" : "Upload"}
                      </Button>
                      {uploadedImageUrl && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleRemoveProfilePicture}
                          className="hover:bg-destructive hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      JPG, PNG or GIF. Max 5MB.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userName">Username</Label>
                <Input
                  id="userName"
                  value={formData.userName}
                  onChange={(e) =>
                    setFormData({ ...formData, userName: e.target.value })
                  }
                  placeholder="Enter username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  readOnly
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter email"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      userName: profile?.userName || "",
                      email: profile?.email || "",
                    });
                    setUploadedImageUrl(profile?.profilePicture || "");
                    setImageFile(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="border-2 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="text-lg">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="flex items-center gap-2">
            <span className="text-secondary">▸</span>
            <span className="text-muted-foreground">
              {profile?.authProvider === "google"
                ? "This account uses Google Sign-In"
                : "This account uses email/password authentication"}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-secondary">▸</span>
            <span className="text-muted-foreground">
              Profile pictures are stored securely
            </span>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-secondary">▸</span>
            <span className="text-muted-foreground">
              Keep your profile information up to date
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminProfile;

