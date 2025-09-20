import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { mockData } from "../data/mockData";

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Mock form submission - replace with actual backend integration later
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Message sent successfully!",
        description: "Thank you for reaching out. I'll get back to you soon.",
      });
      
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      toast({
        title: "Error sending message",
        description: "Please try again or contact me directly via email.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Let's Connect</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Ready to collaborate or discuss opportunities? I'd love to hear from you.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-900">Get In Touch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Email</div>
                    <div className="text-slate-600">{mockData.personalInfo.email}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                    <Phone className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Phone</div>
                    <div className="text-slate-600">{mockData.personalInfo.phone}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Location</div>
                    <div className="text-slate-600">{mockData.personalInfo.location}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg border-0 bg-slate-50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Available For</h3>
                <ul className="space-y-2 text-slate-600">
                  <li>• Marketing Strategy Consulting</li>
                  <li>• Team Leadership & Management</li>
                  <li>• Digital Marketing Projects</li>
                  <li>• Speaking Engagements</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-900">Send a Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell me about your project or inquiry..."
                    rows={5}
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white"
                  size="lg"
                >
                  {isSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;