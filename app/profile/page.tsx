"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import {
  databases,
  DATABASE_ID,
  CUSTOMERS_TABLE_ID,
  account,
} from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Query } from "appwrite";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const { user, checkAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
  });
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const fetchCustomerData = async () => {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          CUSTOMERS_TABLE_ID,
          [Query.equal("user_id", user.$id)]
        );

        if (response.documents.length > 0) {
          const customerData = response.documents[0];
          setFormData({
            full_name: customerData.full_name || user.name || "",
            phone: customerData.phone || user.phone || "",
            email: customerData.email || user.email || "",
          });
        } else {
          setFormData({
            full_name: user.name || "",
            phone: user.phone || "",
            email: user.email || "",
          });
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
        toast.error("Failed to load profile data");
      }
    };

    fetchCustomerData();
  }, [user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    if (!password) {
      toast.error("Please enter your password to save changes");
      return;
    }

    setLoading(true);
    try {
      // Update user name in Appwrite Auth
      if (formData.full_name !== user.name) {
        await account.updateName(formData.full_name);
      }

      // Update email in Appwrite Auth
      if (formData.email !== user.email) {
        await account.updateEmail(formData.email, password);
      }

      // Update phone number in Appwrite Auth
      if (formData.phone && formData.phone !== user.phone) {
        const formattedPhone = formData.phone.startsWith("+")
          ? formData.phone
          : `+92${formData.phone}`;
        await account.updatePhone(formattedPhone, password);
      }

      // Find the customer document
      const response = await databases.listDocuments(
        DATABASE_ID,
        CUSTOMERS_TABLE_ID,
        [Query.equal("user_id", user.$id)]
      );

      if (response.documents.length === 0) {
        toast.error("Customer record not found");
        setLoading(false);
        return;
      }

      const customerId = response.documents[0].$id;

      // Update customer document
      await databases.updateDocument(
        DATABASE_ID,
        CUSTOMERS_TABLE_ID,
        customerId,
        {
          full_name: formData.full_name,
          phone: formData.phone.startsWith("+")
            ? formData.phone
            : `+92${formData.phone}`,
          email: formData.email,
        }
      );

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      setPassword("");
      await checkAuth();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-[#27247b]" />
          </button>
        </Link>
        <h1 className="text-3xl font-bold text-[#27247b]">My Profile</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <p className="text-lg text-gray-900">{formData.full_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-lg text-gray-900">{formData.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <p className="text-lg text-gray-900">
                  {formData.phone || "Not provided"}
                </p>
              </div>

              <Button
                onClick={() => setIsEditing(true)}
                className="w-full bg-[#27247b] hover:bg-[#27247b]/90 text-white"
              >
                Edit Profile
              </Button>
            </div>
          ) : (
            <form className="space-y-4">
              <Input
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
              />

              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
              />

              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
              />

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-3">
                  Enter your password to confirm changes
                </p>

                <div className="space-y-1">
                  <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />

                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-[#27247b] hover:underline block text-right"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent the form from submitting
                      setIsEditing(false); // Close the edit mode
                    }}
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-[#27247b] hover:bg-[#27247b]/90 text-white"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setPassword("");
                  }}
                  disabled={loading}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
