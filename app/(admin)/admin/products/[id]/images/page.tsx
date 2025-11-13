'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { databases, storage, DATABASE_ID, PRODUCT_IMAGES_TABLE_ID, PRODUCTS_TABLE_ID, STORAGE_BUCKET_ID } from '@/lib/appwrite';
import { Product, ProductImage } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Star, ArrowLeft } from 'lucide-react';
import { ID, Query } from 'appwrite';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';

export default function ProductImagesPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { isAdmin, checkAuth } = useAuthStore();
  const [productId, setProductId] = useState<string>('');
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    checkAuth();
    params.then(p => setProductId(p.id));
  }, [checkAuth, params]);

  useEffect(() => {
    if (productId) {
      fetchProductAndImages();
    }
  }, [productId]);

  const fetchProductAndImages = async () => {
    try {
      // Fetch product
      const productData = await databases.getDocument(DATABASE_ID, PRODUCTS_TABLE_ID, productId);
      setProduct(productData as unknown as Product);

      // Fetch images for this product
      const imagesResponse = await databases.listDocuments(
        DATABASE_ID,
        PRODUCT_IMAGES_TABLE_ID,
        [Query.equal('product_id', productId), Query.orderDesc('$createdAt')]
      );
      setImages(imagesResponse.documents as unknown as ProductImage[]);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      // Upload all selected files
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = ID.unique();
        
        // Upload to storage
        await storage.createFile(STORAGE_BUCKET_ID, fileId, file);
        
        // Create database entry
        await databases.createDocument(
          DATABASE_ID,
          PRODUCT_IMAGES_TABLE_ID,
          ID.unique(),
          {
            product_id: productId,
            file_id: fileId,
            is_primary: images.length === 0 && i === 0 // First image is primary if no images exist
          }
        );
      }

      toast.success(`Uploaded ${files.length} image(s) successfully!`);
      fetchProductAndImages();
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      // First, set all images to non-primary
      for (const img of images) {
        if (img.is_primary) {
          await databases.updateDocument(
            DATABASE_ID,
            PRODUCT_IMAGES_TABLE_ID,
            img.$id,
            { is_primary: false }
          );
        }
      }

      // Then set the selected image as primary
      await databases.updateDocument(
        DATABASE_ID,
        PRODUCT_IMAGES_TABLE_ID,
        imageId,
        { is_primary: true }
      );

      toast.success('Primary image updated!');
      fetchProductAndImages();
    } catch (error) {
      console.error('Error setting primary image:', error);
      toast.error('Failed to set primary image');
    }
  };

  const handleDeleteImage = async (imageId: string, fileId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      // Delete from storage
      await storage.deleteFile(STORAGE_BUCKET_ID, fileId);
      
      // Delete from database
      await databases.deleteDocument(DATABASE_ID, PRODUCT_IMAGES_TABLE_ID, imageId);
      
      toast.success('Image deleted successfully!');
      fetchProductAndImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-red-900 mb-2">Access Denied</h2>
          <p className="text-red-700">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-center text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-center text-gray-600">Product not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link href="/admin/products">
          <Button variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Images</h1>
        <p className="text-lg text-gray-600">{product.name}</p>
      </div>

      {/* Upload Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upload Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Images (Multiple allowed)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPG, PNG, WebP. Max 5MB per image.
              </p>
            </div>
            {uploading && (
              <p className="text-sm text-blue-600">Uploading images...</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Images Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Product Images ({images.length})
        </h2>

        {images.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No images uploaded yet</p>
              <p className="text-sm text-gray-500 mt-2">Upload images using the form above</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => {
              const imageUrl = storage.getFileView(STORAGE_BUCKET_ID, image.file_id).toString();
              
              return (
                <Card key={image.$id} className={image.is_primary ? 'ring-2 ring-green-500' : ''}>
                  <CardContent className="p-3">
                    <div className="relative aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt="Product image"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      />
                      {image.is_primary && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Primary
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {!image.is_primary && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => handleSetPrimary(image.$id)}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Set as Primary
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteImage(image.$id, image.file_id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Tips:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Upload multiple images at once by selecting multiple files</li>
          <li>• The first image uploaded will automatically be set as primary</li>
          <li>• Click "Set as Primary" to change which image is shown on product listings</li>
          <li>• Primary images are marked with a green star</li>
        </ul>
      </div>
    </div>
  );
}
