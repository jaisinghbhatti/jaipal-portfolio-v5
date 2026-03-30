import { useState } from "react";
import axios from "axios";
import { 
  Target, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Search, 
  Building2, 
  Package, 
  Copy, 
  Check, 
  Loader2, 
  Crosshair,
  ExternalLink,
  AlertCircle,
  Download
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Slider } from "../components/ui/slider";
import { Switch } from "../components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Toaster, toast } from "sonner";

const API_URL = "";
const API = `${BACKEND_URL}/api`;

const LeadSniper = () => {
  // Form state with defaults
  const [formData, setFormData] = useState({
    user_business_name: "Jai Packaging Industries",
    user_location: "Sahibabad, Ghaziabad",
    user_core_offering: "Packaging Boxes, Paper Boxes, Corrugated Boxes, Paper Bags",
    target_industry: "Shoe manufacturers",
    search_radius_km: 10,
    use_ai_pitch: false,
  });

  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMeta, setSearchMeta] = useState(null);
  const [copiedPitch, setCopiedPitch] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = async () => {
    if (!formData.user_business_name || !formData.user_location || !formData.target_industry) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setLeads([]);
    setSearchMeta(null);

    try {
      const response = await axios.post(`/api/leads/search`, formData);
      
      if (response.data.success) {
        setLeads(response.data.leads);
        setSearchMeta({
          total: response.data.total_results,
          location: response.data.user_location,
          radius: response.data.search_radius_km,
          message: response.data.message,
        });
        
        if (response.data.leads.length > 0) {
          toast.success(`Found ${response.data.total_results} potential leads!`);
        } else {
          toast.info("No leads found. Try expanding your search radius.");
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      const errorMessage = error.response?.data?.detail || "Failed to search for leads";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const copyPitch = async (pitch, index) => {
    try {
      await navigator.clipboard.writeText(pitch);
      setCopiedPitch(index);
      toast.success("Pitch copied to clipboard!");
      setTimeout(() => setCopiedPitch(null), 2000);
    } catch (err) {
      toast.error("Failed to copy pitch");
    }
  };

  const exportToCSV = () => {
    if (leads.length === 0) return;

    const headers = ["Business Name", "Address", "Distance (KM)", "Phone", "Industry", "Power Pitch", "WhatsApp Link"];
    const csvContent = [
      headers.join(","),
      ...leads.map((lead) =>
        [
          `"${lead.name}"`,
          `"${lead.address}"`,
          lead.distance_km,
          `"${lead.phone}"`,
          `"${lead.industry}"`,
          `"${lead.power_pitch.replace(/"/g, '""')}"`,
          `"${lead.whatsapp_link}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${formData.target_industry.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("CSV exported successfully!");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Toaster position="top-right" richColors />
      
      {/* Hero Section */}
      <section 
        className="relative min-h-[45vh] flex items-center justify-center hero-pattern"
        style={{
          backgroundImage: `url(https://static.prod-images.emergentagent.com/jobs/8680fd6d-59ad-49a9-8136-85b3839c9183/images/8fac6a863a3b0d89169c258ca78926b129d974753819e97b82e1e93c13ea523f.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-[#0A0A0A]" />
        
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto stagger-children">
          <p className="overline mb-4" data-testid="hero-overline">Jaisingh.in / Leads</p>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tighter mb-6" data-testid="hero-title">
            THE UNIVERSAL<br />
            <span className="text-yellow-500">LEAD SNIPER</span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto" data-testid="hero-description">
            AI-powered lead generation tool. Identify active businesses, calculate proximity, 
            and draft high-conversion outreach messages in seconds.
          </p>
        </div>
      </section>

      {/* Main Tool Section */}
      <section className="px-6 md:px-8 lg:px-12 py-12 max-w-[1600px] mx-auto">
        
        {/* Control Room Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Discovery Form - 4 columns */}
          <div className="lg:col-span-4">
            <div className="form-card p-6" data-testid="discovery-form">
              <div className="flex items-center gap-3 mb-6">
                <Crosshair className="w-5 h-5 text-yellow-500" />
                <h2 className="font-heading text-xl font-bold text-white uppercase tracking-wide">
                  Discovery Parameters
                </h2>
              </div>

              <div className="space-y-5">
                {/* Business Name */}
                <div className="space-y-2">
                  <Label htmlFor="business-name" className="text-xs uppercase tracking-wider text-gray-400">
                    Your Business Name
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="business-name"
                      data-testid="business-name-input"
                      placeholder="Enter your business name"
                      value={formData.user_business_name}
                      onChange={(e) => handleInputChange("user_business_name", e.target.value)}
                      className="form-input pl-10"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-xs uppercase tracking-wider text-gray-400">
                    Your Location
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="location"
                      data-testid="location-input"
                      placeholder="City, Area or Address"
                      value={formData.user_location}
                      onChange={(e) => handleInputChange("user_location", e.target.value)}
                      className="form-input pl-10"
                    />
                  </div>
                </div>

                {/* Core Offering */}
                <div className="space-y-2">
                  <Label htmlFor="offering" className="text-xs uppercase tracking-wider text-gray-400">
                    Your Core Offering
                  </Label>
                  <div className="relative">
                    <Package className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <textarea
                      id="offering"
                      data-testid="offering-input"
                      placeholder="What do you sell/offer?"
                      value={formData.user_core_offering}
                      onChange={(e) => handleInputChange("user_core_offering", e.target.value)}
                      className="form-input pl-10 min-h-[80px] resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Target Industry */}
                <div className="space-y-2">
                  <Label htmlFor="target" className="text-xs uppercase tracking-wider text-gray-400">
                    Target Client Industry
                  </Label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="target"
                      data-testid="target-industry-input"
                      placeholder="e.g., Shoe manufacturers, E-commerce"
                      value={formData.target_industry}
                      onChange={(e) => handleInputChange("target_industry", e.target.value)}
                      className="form-input pl-10"
                    />
                  </div>
                </div>

                {/* Search Radius */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs uppercase tracking-wider text-gray-400">
                      Search Radius
                    </Label>
                    <span className="text-yellow-500 font-bold text-sm" data-testid="radius-value">
                      {formData.search_radius_km} KM
                    </span>
                  </div>
                  <Slider
                    data-testid="radius-slider"
                    value={[formData.search_radius_km]}
                    onValueChange={(value) => handleInputChange("search_radius_km", value[0])}
                    min={1}
                    max={50}
                    step={1}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1 KM</span>
                    <span>50 KM</span>
                  </div>
                </div>

                {/* AI Pitch Toggle */}
                <div className="flex items-center justify-between p-4 bg-black/50 border border-white/5">
                  <div>
                    <p className="text-sm font-medium text-white">AI-Enhanced Pitches</p>
                    <p className="text-xs text-gray-500">Use Gemini AI for personalized messages</p>
                  </div>
                  <Switch
                    data-testid="ai-pitch-toggle"
                    checked={formData.use_ai_pitch}
                    onCheckedChange={(checked) => handleInputChange("use_ai_pitch", checked)}
                  />
                </div>

                {/* Search Button */}
                <Button
                  data-testid="search-leads-button"
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="btn-primary-yellow w-full h-12 text-sm flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 loading-spinner" />
                      SNIPING LEADS...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      RUN SNIPE
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Results Table - 8 columns */}
          <div className="lg:col-span-8">
            <div className="results-table-container" data-testid="results-container">
              {/* Table Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-yellow-500" />
                  <h2 className="font-heading text-xl font-bold text-white uppercase tracking-wide">
                    Lead Results
                  </h2>
                  {searchMeta && (
                    <span className="text-xs text-gray-500 ml-2" data-testid="results-count">
                      {searchMeta.total} found within {searchMeta.radius}km
                    </span>
                  )}
                </div>
                {leads.length > 0 && (
                  <Button
                    data-testid="export-csv-button"
                    onClick={exportToCSV}
                    variant="outline"
                    size="sm"
                    className="btn-copy flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                )}
              </div>

              {/* Table Content */}
              {isLoading ? (
                <div className="p-12 text-center" data-testid="loading-state">
                  <Loader2 className="w-12 h-12 text-yellow-500 mx-auto loading-spinner mb-4" />
                  <p className="text-gray-400">Scanning for leads...</p>
                </div>
              ) : leads.length === 0 ? (
                <div className="empty-state" data-testid="empty-state">
                  <Crosshair className="empty-state-icon text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">No leads yet</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    Configure your discovery parameters and click "Run Snipe" to find potential business leads.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="results-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Business Name</TableHead>
                        <TableHead className="w-[80px]">Distance</TableHead>
                        <TableHead className="w-[120px]">Phone</TableHead>
                        <TableHead className="w-[100px]">Industry</TableHead>
                        <TableHead>Power Pitch</TableHead>
                        <TableHead className="w-[150px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead, index) => (
                        <TableRow key={index} data-testid={`lead-row-${index}`}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-white text-sm" data-testid={`lead-name-${index}`}>
                                {lead.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate max-w-[180px]" title={lead.address}>
                                {lead.address}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-yellow-500 font-medium" data-testid={`lead-distance-${index}`}>
                              {lead.distance_km} km
                            </span>
                          </TableCell>
                          <TableCell>
                            {lead.phone ? (
                              <a 
                                href={`tel:${lead.phone}`}
                                className="flex items-center gap-1 text-gray-300 hover:text-white text-sm"
                                data-testid={`lead-phone-${index}`}
                              >
                                <Phone className="w-3 h-3" />
                                {lead.phone}
                              </a>
                            ) : (
                              <span className="text-gray-600 text-sm">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="industry-badge" data-testid={`lead-industry-${index}`}>
                              {lead.industry}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start gap-2">
                              <p className="text-xs text-gray-400 line-clamp-2 flex-1" title={lead.power_pitch}>
                                {lead.power_pitch}
                              </p>
                              <button
                                data-testid={`copy-pitch-${index}`}
                                onClick={() => copyPitch(lead.power_pitch, index)}
                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                title="Copy pitch"
                              >
                                {copiedPitch === index ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4 text-gray-500" />
                                )}
                              </button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {lead.whatsapp_link ? (
                              <a
                                href={lead.whatsapp_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                data-testid={`whatsapp-link-${index}`}
                                className="btn-whatsapp-green inline-flex"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                WhatsApp
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-gray-600 text-xs flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                No phone
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Footer Note */}
              {leads.length > 0 && (
                <div className="p-4 border-t border-white/5 bg-black/30">
                  <p className="text-xs text-gray-500" data-testid="export-note">
                    <strong className="text-gray-400">Data Export:</strong> This table is optimized for Excel/Google Sheets. 
                    Use the Export CSV button or copy rows directly into your tracker. 
                    Use the WhatsApp Link column to initiate contact instantly.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-text text-center px-6">
        <p>
          Built by <a href="https://jaisingh.in" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:underline">Jaisingh.in</a> | 
          Lead Sniper V7 | Powered by AI
        </p>
      </footer>
    </div>
  );
};

export default LeadSniper;
