"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Users, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    sent: number;
    failed: number;
    total: number;
  } | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required");
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, url }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to send");
      }

      setResult(data);
      toast.success(`Sent to ${data.sent} subscribers!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminAuthGuard>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Send Push Notification
          </h1>
          <p className="text-gray-600">
            Send a notification to all subscribed users instantly.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Ramadan Special Offer!"
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message Body *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Enter your notification message..."
                  maxLength={300}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{body.length}/300</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target URL
                </label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="/offers or https://..."
                />
              </div>

              <Button
                type="submit"
                disabled={sending || !title.trim() || !body.trim()}
                size="lg"
                className="w-full"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Notification
                  </>
                )}
              </Button>
            </form>

            {result && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    Notification sent successfully
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {result.total}
                    </p>
                    <p className="text-xs text-gray-500">Subscribers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {result.sent}
                    </p>
                    <p className="text-xs text-gray-500">Sent</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {result.failed}
                    </p>
                    <p className="text-xs text-gray-500">Failed</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminAuthGuard>
  );
}
