"use client";

import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { databases, DATABASE_ID, ORDERS_TABLE_ID } from "@/lib/appwrite";
import { LoyaltyService } from "@/lib/services/loyalty-service";
import { OrderService } from "@/lib/services/order-service";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface DeleteOrderDialogProps {
    orderId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function DeleteOrderDialog({
    orderId,
    open,
    onOpenChange,
    onSuccess,
}: DeleteOrderDialogProps) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            // Use OrderService to delete order and all related items
            await OrderService.deleteOrder(orderId);
            toast.success("Order deleted successfully");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Error deleting order:", error);
            toast.error("Failed to delete order");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the order
                        <span className="font-mono font-bold mx-1">{orderId}</span>
                        and remove it from the database.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            "Delete Order"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
