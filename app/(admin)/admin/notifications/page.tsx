"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import {
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaigns,
  uploadNotificationImage,
} from "@/app/actions/notification-campaigns";
// No direct Appwrite imports needed - using server actions
import { NotificationCampaign } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  Send,
  Bell,
  Search,
  BarChart3,
  Megaphone,
  Image as ImageIcon,
  Link as LinkIcon,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
  ExternalLink,
  Activity,
  Smartphone,
} from "lucide-react";
// ID not needed - server actions handle unique IDs
import toast from "react-hot-toast";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";
import ReadOnlyGuard from "@/components/admin/ReadOnlyGuard";
import Image from "next/image";

type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "failed" | "cancelled";
type CampaignType = "push" | "in-app" | "both";
type TargetSegment = "all" | "active_users" | "inactive_users" | "custom";

interface CampaignFormData {
  title: string;
  body: string;
  image_url: string;
  target_url: string;
  icon_url: string;
  tag: string;
  campaign_type: CampaignType;
  target_segment: TargetSegment;
  target_tags: string;
  require_interaction: boolean;
  scheduled_at: string;
}

const defaultFormData: CampaignFormData = {
  title: "",
  body: "",
  image_url: "",
  target_url: "",
  icon_url: "",
  tag: "general",
  campaign_type: "push",
  target_segment: "all",
  target_tags: "",
  require_interaction: false,
  scheduled_at: "",
};

export default function AdminNotificationsPage() {
  const { hasWritePermission } = useAuthStore();
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<CampaignStatus | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CampaignFormData>(defaultFormData);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalNotifications: 0,
    totalClicked: 0,
    clickRate: 0,
  });
  const [activeTab, setActiveTab] = useState("campaigns");
  const [analyticsCampaign, setAnalyticsCampaign] = useState<NotificationCampaign | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getCampaigns();
      if (result.success) {
        setCampaigns(result.campaigns as unknown as NotificationCampaign[]);
      } else {
        toast.error(result.error || "Failed to load campaigns");
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      // Fetch stats using server actions
      const [campaignsResult, subscriptionsRes] = await Promise.all([
        getCampaigns(),
        fetch(`/api/push/stats`).then(r => r.json()).catch(() => ({ totalSubscriptions: 0 })),
      ]);

      const allCampaigns = campaignsResult.success ? (campaignsResult.campaigns as unknown as NotificationCampaign[]) : [];
      const totalCampaigns = allCampaigns.length;
      const activeCampaigns = allCampaigns.filter((c) => c.is_active).length;
      const totalSubscriptions = subscriptionsRes.totalSubscriptions || 0;

      setStats({
        totalCampaigns,
        activeCampaigns,
        totalSubscriptions,
        activeSubscriptions: totalSubscriptions,
        totalNotifications: subscriptionsRes.totalNotifications || 0,
        totalClicked: subscriptionsRes.totalClicked || 0,
        clickRate: subscriptionsRes.clickRate || 0,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
    fetchStats();
  }, [fetchCampaigns, fetchStats]);

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.tag && c.tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadNotificationImage(formData);
      if (result.success) {
        setFormData((prev) => ({ ...prev, image_url: result.imageUrl || "" }));
        toast.success("Image uploaded!");
      } else {
        toast.error(result.error || "Failed to upload image");
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(error?.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
      setFileInputKey((k) => k + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasWritePermission()) {
      toast.error("Write permission required");
      return;
    }
    setIsSubmitting(true);
    try {
      const campaignData = {
        title: formData.title,
        body: formData.body,
        image_url: formData.image_url || null,
        target_url: formData.target_url || "/",
        icon_url: formData.icon_url || "/logo.png",
        tag: formData.tag || "general",
        campaign_type: formData.campaign_type,
        target_segment: formData.target_segment,
        target_tags: formData.target_tags ? formData.target_tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        require_interaction: formData.require_interaction,
        scheduled_at: formData.scheduled_at || null,
      };

      if (editingId) {
        const result = await updateCampaign(editingId, campaignData);
        if (result.success) {
          toast.success("Campaign updated!");
        } else {
          toast.error(result.error || "Failed to update");
        }
      } else {
        const result = await createCampaign({
          ...campaignData,
          status: "draft",
          is_active: true,
        });
        if (result.success) {
          toast.success("Campaign created!");
        } else {
          toast.error(result.error || "Failed to create");
        }
      }
      resetForm();
      fetchCampaigns();
    } catch (error: any) {
      console.error("Error saving campaign:", error);
      toast.error(error.message || "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (campaign: NotificationCampaign) => {
    setEditingId(campaign.$id);
    setFormData({
      title: campaign.title,
      body: campaign.body,
      image_url: campaign.image_url || "",
      target_url: campaign.target_url || "",
      icon_url: campaign.icon_url || "",
      tag: campaign.tag || "general",
      campaign_type: campaign.campaign_type || "push",
      target_segment: campaign.target_segment || "all",
      target_tags: Array.isArray(campaign.target_tags) ? campaign.target_tags.join(", ") : "",
      require_interaction: campaign.require_interaction || false,
      scheduled_at: campaign.scheduled_at || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!hasWritePermission()) {
      toast.error("Write permission required");
      return;
    }
    if (!confirm("Delete this campaign?")) return;
    try {
      const result = await deleteCampaign(id);
      if (result.success) {
        toast.success("Deleted!");
      } else {
        toast.error(result.error || "Failed to delete");
      }
      fetchCampaigns();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    }
  };

  const handleToggleActive = async (campaign: NotificationCampaign) => {
    try {
      const result = await updateCampaign(campaign.$id, { is_active: !campaign.is_active });
      if (result.success) {
        toast.success(campaign.is_active ? "Deactivated" : "Activated");
      } else {
        toast.error(result.error || "Failed to toggle status");
      }
      fetchCampaigns();
    } catch (error) {
      toast.error("Failed to toggle status");
    }
  };

  const handleSendCampaign = async (campaign: NotificationCampaign) => {
    if (!hasWritePermission()) {
      toast.error("Write permission required");
      return;
    }
    if (!confirm(`Send "${campaign.title}" to subscribers?`)) return;
    setSendingId(campaign.$id);
    try {
      const res = await fetch("/api/notifications/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", campaignId: campaign.$id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(data.message || "Sent!");
      fetchCampaigns();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || "Failed to send");
    } finally {
      setSendingId(null);
    }
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingId(null);
    setShowForm(false);
  };

  const getStatusBadge = (status: CampaignStatus) => {
    const map: Record<CampaignStatus, { cls: string; icon: any }> = {
      draft: { cls: "bg-gray-100 text-gray-800", icon: Clock },
      scheduled: { cls: "bg-blue-100 text-blue-800", icon: Clock },
      sending: { cls: "bg-amber-100 text-amber-800", icon: Loader2 },
      sent: { cls: "bg-green-100 text-green-800", icon: CheckCircle2 },
      failed: { cls: "bg-red-100 text-red-800", icon: XCircle },
      cancelled: { cls: "bg-gray-100 text-gray-800", icon: XCircle },
    };
    const { cls, icon: Icon } = map[status] || map.draft;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cls}`}>
        <Icon className="w-3 h-3" />
        {status.replace("_", " ")}
      </span>
    );
  };

  const deliveryRate = (c: NotificationCampaign) => {
    const total = c.sent_count + c.failed_count;
    return total > 0 ? Math.round((c.sent_count / total) * 100) : 0;
  };

  const clickRate = (c: NotificationCampaign) => {
    return c.sent_count > 0 ? Math.round((c.clicked_count / c.sent_count) * 100) : 0;
  };

  return (
    <AdminAuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Notification Campaigns</h1>
              <p className="text-lg text-gray-600 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Create, manage, and send push notification campaigns
              </p>
            </div>
            <ReadOnlyGuard>
              <Button onClick={() => setShowForm(!showForm)} size="lg">
                <Plus className="w-4 h-4 mr-2" />
                {showForm ? "Cancel" : "New Campaign"}
              </Button>
            </ReadOnlyGuard>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="campaigns">
                <Megaphone className="w-4 h-4 mr-2" /> Campaigns
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="w-4 h-4 mr-2" /> Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card><CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Total Campaigns</p><p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</p></div>
                    <Megaphone className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Active</p><p className="text-2xl font-bold text-green-600">{stats.activeCampaigns}</p></div>
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Subscribers</p><p className="text-2xl font-bold text-purple-600">{stats.activeSubscriptions}</p></div>
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Click Rate</p><p className="text-2xl font-bold text-amber-600">{stats.clickRate.toFixed(1)}%</p></div>
                    <Activity className="w-8 h-8 text-amber-600" />
                  </div>
                </CardContent></Card>
              </div>

              {/* Search & Filters */}
              <Card className="mb-6"><CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Search campaigns..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                  </div>
                  <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as CampaignStatus | "all")}>
                    <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="sending">Sending</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent></Card>

              {/* Campaign Form */}
              {showForm && (
                <Card className="mb-8"><CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">{editingId ? "Edit Campaign" : "Create New Campaign"}</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Title *</label>
                          <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Ramadan Special Offer!" required maxLength={100} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Message Body *</label>
                          <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]" value={formData.body} onChange={(e) => setFormData({ ...formData, body: e.target.value })} placeholder="Enter your notification message..." required maxLength={300} />
                          <p className="text-xs text-gray-500 mt-1">{formData.body.length}/300</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Target URL</label>
                          <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input value={formData.target_url} onChange={(e) => setFormData({ ...formData, target_url: e.target.value })} placeholder="/offers or https://..." className="pl-10" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
                          <Input value={formData.tag} onChange={(e) => setFormData({ ...formData, tag: e.target.value })} placeholder="promotion, order, general" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Type</label>
                          <Select value={formData.campaign_type} onValueChange={(v: string) => setFormData({ ...formData, campaign_type: v as CampaignType })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="push">Push Notification</SelectItem>
                              <SelectItem value="in-app">In-App</SelectItem>
                              <SelectItem value="both">Both</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Segment</label>
                        <Select value={formData.target_segment} onValueChange={(v) => setFormData({ ...formData, target_segment: v as TargetSegment })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Subscribers</SelectItem>
                            <SelectItem value="active_users">Active Users</SelectItem>
                            <SelectItem value="inactive_users">Inactive Users</SelectItem>
                            <SelectItem value="custom">Custom Tags</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Tags (comma separated)</label>
                        <Input value={formData.target_tags} onChange={(e) => setFormData({ ...formData, target_tags: e.target.value })} placeholder="promotions, orders, deals" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Schedule (optional)</label>
                        <Input type="datetime-local" value={formData.scheduled_at} onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })} />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="require_interaction" checked={formData.require_interaction} onChange={(e) => setFormData({ ...formData, require_interaction: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
                      <label htmlFor="require_interaction" className="text-sm font-medium text-gray-700">Require user interaction (stays visible until clicked)</label>
                    </div>

                    {/* Image Upload */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notification Image</label>
                      <div className="flex items-center gap-4">
                        <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                          <ImageIcon className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-sm">{uploadingImage ? "Uploading..." : "Upload Image"}</span>
                          <input key={fileInputKey} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                        </label>
                        {formData.image_url && (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                            <Image src={formData.image_url} alt="Preview" fill className="object-cover" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Upload an image to make your notification more engaging. Recommended: 512x256px.</p>
                    </div>

                    <div className="flex space-x-3">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {editingId ? "Updating..." : "Creating..."}</>
                        ) : (
                          editingId ? "Update Campaign" : "Create Campaign"
                        )}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>Cancel</Button>
                    </div>
                  </form>
                </CardContent></Card>
              )}

              {/* Campaigns Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    All Campaigns
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" /><p className="text-gray-500">Loading campaigns...</p></div>
                  ) : filteredCampaigns.length === 0 ? (
                    <div className="p-12 text-center">
                      <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No campaigns found</p>
                      <p className="text-gray-400 text-sm mt-1">Create your first notification campaign to get started</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Campaign</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Delivery</TableHead>
                            <TableHead>Clicks</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCampaigns.map((campaign) => (
                            <TableRow key={campaign.$id}>
                              <TableCell>
                                <div className="flex items-start gap-3">
                                  {campaign.image_url ? (
                                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border shrink-0">
                                      <Image src={campaign.image_url} alt="" fill className="object-cover" />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                      <Bell className="w-5 h-5 text-gray-400" />
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-medium text-gray-900">{campaign.title}</p>
                                    <p className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">{campaign.body}</p>
                                    {campaign.tag && <Badge variant="outline" className="mt-1 text-xs">{campaign.tag}</Badge>}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="capitalize">{campaign.campaign_type}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <span className="font-medium text-green-600">{campaign.sent_count}</span>
                                  <span className="text-gray-400"> / </span>
                                  <span className="text-gray-500">{campaign.sent_count + campaign.failed_count}</span>
                                  {campaign.sent_count + campaign.failed_count > 0 && (
                                    <span className="text-xs text-gray-400 ml-1">({deliveryRate(campaign)}%)</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <span className="font-medium text-blue-600">{campaign.clicked_count}</span>
                                  {campaign.sent_count > 0 && (
                                    <span className="text-xs text-gray-400 ml-1">({clickRate(campaign)}%)</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {new Date(campaign.$createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  {/* View Analytics */}
                                  <Button size="sm" variant="ghost" onClick={() => setAnalyticsCampaign(campaign)} title="View Analytics">
                                    <BarChart3 className="w-4 h-4 text-blue-600" />
                                  </Button>

                                  {/* Send */}
                                  {campaign.status !== "sent" && campaign.status !== "sending" && (
                                    <ReadOnlyGuard>
                                      <Button size="sm" variant="ghost" onClick={() => handleSendCampaign(campaign)} disabled={sendingId === campaign.$id} title="Send Now">
                                        {sendingId === campaign.$id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-green-600" />}
                                      </Button>
                                    </ReadOnlyGuard>
                                  )}

                                  {/* Toggle Active */}
                                  <ReadOnlyGuard>
                                    <Button size="sm" variant="ghost" onClick={() => handleToggleActive(campaign)} title={campaign.is_active ? "Deactivate" : "Activate"}>
                                      {campaign.is_active ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-gray-400" />}
                                    </Button>
                                  </ReadOnlyGuard>

                                  {/* Edit */}
                                  <ReadOnlyGuard>
                                    <Button size="sm" variant="ghost" onClick={() => handleEdit(campaign)} title="Edit">
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </ReadOnlyGuard>

                                  {/* Delete */}
                                  <ReadOnlyGuard>
                                    <Button size="sm" variant="ghost" onClick={() => handleDelete(campaign.$id)} title="Delete">
                                      <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                  </ReadOnlyGuard>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card><CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Total Notifications Sent</p><p className="text-2xl font-bold text-gray-900">{stats.totalNotifications}</p></div>
                    <Send className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Total Clicks</p><p className="text-2xl font-bold text-green-600">{stats.totalClicked}</p></div>
                    <ArrowRight className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Click-Through Rate</p><p className="text-2xl font-bold text-amber-600">{stats.clickRate.toFixed(1)}%</p></div>
                    <Activity className="w-8 h-8 text-amber-600" />
                  </div>
                </CardContent></Card>
              </div>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" />Campaign Performance</CardTitle></CardHeader>
                <CardContent>
                  {campaigns.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No campaign data available yet</div>
                  ) : (
                    <div className="space-y-4">
                      {campaigns.filter(c => c.status === "sent" || c.sent_count > 0).map((campaign) => {
                        const total = campaign.sent_count + campaign.failed_count;
                        const delivery = total > 0 ? (campaign.sent_count / total) * 100 : 0;
                        const click = campaign.sent_count > 0 ? (campaign.clicked_count / campaign.sent_count) * 100 : 0;
                        return (
                          <div key={campaign.$id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-medium text-gray-900">{campaign.title}</h3>
                                <p className="text-sm text-gray-500">{campaign.tag} • {new Date(campaign.$createdAt).toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">{campaign.sent_count} sent</p>
                                <p className="text-xs text-gray-500">{campaign.clicked_count} clicks</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <div className="flex justify-between text-xs mb-1"><span>Delivery Rate</span><span>{Math.round(delivery)}%</span></div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${delivery}%` }} /></div>
                              </div>
                              <div>
                                <div className="flex justify-between text-xs mb-1"><span>Click Rate</span><span>{Math.round(click)}%</span></div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${click}%` }} /></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Analytics Dialog */}
        <Dialog open={!!analyticsCampaign} onOpenChange={(open) => !open && setAnalyticsCampaign(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" />Campaign Analytics</DialogTitle></DialogHeader>
            {analyticsCampaign && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  {analyticsCampaign.image_url ? (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border shrink-0">
                      <Image src={analyticsCampaign.image_url} alt="" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"><Bell className="w-8 h-8 text-gray-400" /></div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg">{analyticsCampaign.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{analyticsCampaign.body}</p>
                    <div className="flex gap-2 mt-1">{getStatusBadge(analyticsCampaign.status)}<Badge variant="outline">{analyticsCampaign.campaign_type}</Badge></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{analyticsCampaign.sent_count}</p>
                    <p className="text-xs text-gray-500">Sent</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{analyticsCampaign.delivered_count}</p>
                    <p className="text-xs text-gray-500">Delivered</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{analyticsCampaign.clicked_count}</p>
                    <p className="text-xs text-gray-500">Clicks</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{analyticsCampaign.failed_count}</p>
                    <p className="text-xs text-gray-500">Failed</p>
                  </div>
                </div>

                {analyticsCampaign.target_url && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <ExternalLink className="w-4 h-4" />
                    <span className="truncate">{analyticsCampaign.target_url}</span>
                  </div>
                )}

                {analyticsCampaign.sent_at && (
                  <p className="text-sm text-gray-500">Sent on {new Date(analyticsCampaign.sent_at).toLocaleString()}</p>
                )}
              </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setAnalyticsCampaign(null)}>Close</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminAuthGuard>
  );
}
