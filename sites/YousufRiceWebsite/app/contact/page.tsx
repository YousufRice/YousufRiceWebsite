'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/send-contact-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Message sent successfully! We\'ll get back to you soon.');
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: '',
        });
      } else {
        toast.error(data.error || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-[#27247b] mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have a question or need assistance? We're here to help!
          </p>
        </div>

        {/* Get in Touch Section - Full Width */}
        <Card className="border-2 border-gray-200 shadow-xl rounded-2xl overflow-hidden mb-8">
          <CardHeader className="bg-linear-to-r from-[#ffff03] to-[#ffff03]/90 p-6">
            <CardTitle className="text-2xl font-bold text-[#27247b] text-center">
              Get in Touch
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Email */}
              <div className="flex flex-col items-center text-center">
                <div className="bg-[#27247b] p-3 rounded-lg mb-3">
                  <Mail className="w-6 h-6 text-[#ffff03]" />
                </div>
                <h3 className="font-bold text-[#27247b] mb-1">Email</h3>
                <a
                  href="mailto:support@yousufrice.com"
                  className="text-gray-600 hover:text-[#27247b] transition-colors"
                >
                  support@yousufrice.com
                </a>
              </div>

              {/* Phone */}
              <div className="flex flex-col items-center text-center">
                <div className="bg-[#27247b] p-3 rounded-lg mb-3">
                  <Phone className="w-6 h-6 text-[#ffff03]" />
                </div>
                <h3 className="font-bold text-[#27247b] mb-1">Phone</h3>
                <a
                  href="tel:03098619358"
                  className="text-gray-600 hover:text-[#27247b] transition-colors"
                >
                  03098619358
                </a>
              </div>

              {/* Location */}
              <div className="flex flex-col items-center text-center">
                <div className="bg-[#27247b] p-3 rounded-lg mb-3">
                  <MapPin className="w-6 h-6 text-[#ffff03]" />
                </div>
                <h3 className="font-bold text-[#27247b] mb-1">Location</h3>
                <p className="text-gray-600">Karachi, Pakistan</p>
                <p className="mt-1 text-sm font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full inline-block">
                  Free delivery in Karachi only
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Main Content - Two Sections */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Section - Contact Form */}
          <div className="flex-1">
            {/* Contact Form */}
            <Card className="border-2 border-gray-200 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-linear-to-r from-[#27247b] to-[#27247b]/90 text-white p-6">
                <CardTitle className="text-2xl text-white font-bold flex items-center">
                  <Send className="w-6 h-6 mr-3" />
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-[#27247b] mb-2">
                      Full Name *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="border-2 border-gray-300 focus:border-[#ffff03] focus:ring-2 focus:ring-[#ffff03]/20 rounded-lg p-3 text-base"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[#27247b] mb-2">
                        Email *
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="border-2 border-gray-300 focus:border-[#ffff03] focus:ring-2 focus:ring-[#ffff03]/20 rounded-lg p-3 text-base"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#27247b] mb-2">
                        Phone (Optional)
                      </label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="border-2 border-gray-300 focus:border-[#ffff03] focus:ring-2 focus:ring-[#ffff03]/20 rounded-lg p-3 text-base"
                        placeholder="03XX XXXXXXX"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#27247b] mb-2">
                      Message *
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      rows={5}
                      className="w-full border-2 border-gray-300 focus:border-[#ffff03] focus:ring-2 focus:ring-[#ffff03]/20 rounded-lg p-3 text-base resize-none"
                      placeholder="Tell us how we can help you..."
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-linear-to-r from-[#27247b] to-[#27247b]/90 hover:from-[#27247b]/90 hover:to-[#27247b] text-white font-bold py-6 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-[#ffff03]"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

          </div>

          {/* Right Section - Business Hours and Direct Support */}
          <div className="flex-1 space-y-6">
            {/* Business Hours Card */}
            <Card className="border-2 border-gray-200 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-[#27247b] p-6">
                <CardTitle className="text-xl font-bold text-white">
                  Business Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#27247b]">Monday - Friday</span>
                    <span className="text-gray-600">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#27247b]">Saturday</span>
                    <span className="text-gray-600">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#27247b]">Sunday</span>
                    <span className="text-gray-600">Closed</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Direct Support Card */}
            <Card className="border-2 border-[#ffff03] shadow-xl rounded-2xl overflow-hidden bg-linear-to-br from-[#ffff03]/10 to-white">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-[#27247b] mb-4">
                  Direct Support
                </h3>
                <div className="mb-4">
                  <p className="text-gray-700 mb-2">
                    While our AI agent handles most inquiries, you may still need to contact us directly for:
                  </p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-[#ffff03] mr-2 text-xl">✓</span>
                    <span className="text-gray-700">Business partnership opportunities</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#ffff03] mr-2 text-xl">✓</span>
                    <span className="text-gray-700">Special delivery arrangements</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#ffff03] mr-2 text-xl">✓</span>
                    <span className="text-gray-700">Large wholesale inquiries</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#ffff03] mr-2 text-xl">✓</span>
                    <span className="text-gray-700">Website technical issues</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-[#27247b] text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-bold text-[#27247b] mb-2 text-lg">
                  Where do you deliver?
                </h3>
                <p className="text-gray-600">
                  We currently offer <strong>free delivery in Karachi only</strong>. Our delivery team ensures your order reaches you fresh and on time.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-bold text-[#27247b] mb-2 text-lg">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-600">
                  We currently accept Cash on Delivery (COD). Pay when you receive your order.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-bold text-[#27247b] mb-2 text-lg">
                  How can I get quick answers?
                </h3>
                <p className="text-gray-600">
                  Our AI assistant can instantly answer most questions about products, pricing, delivery, and orders. Look for the chat icon on our website!
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-bold text-[#27247b] mb-2 text-lg">
                  Do you offer bulk discounts?
                </h3>
                <p className="text-gray-600">
                  Yes! We offer tiered pricing with better rates for 2-4kg, 5-9kg, and 10kg+ orders. Our AI assistant can calculate exact savings for you.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
