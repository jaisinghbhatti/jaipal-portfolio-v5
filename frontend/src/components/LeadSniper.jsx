Go to: https://github.com/jaisinghbhatti/jaipal-portfolio-v5/blob/main/frontend/src/components/LeadSniper.jsx
Click the pencil icon (Edit)
Select ALL and DELETE everything
Then paste this clean code:
import { useState } from "react";
import axios from "axios";
import { Target, MapPin, Phone, MessageCircle, Search, Building2, Package, Copy, Check, Loader2, Crosshair, ExternalLink, AlertCircle, Download, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Slider } from "../components/ui/slider";
import { Switch } from "../components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Toaster, toast } from "sonner";
import { Link } from "react-router-dom";

const LeadSniper = () => {
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
      const response = await axios.post("/api/leads/search", formData);
      if (response.data.success) {
        setLeads(response.data.leads);
        setSearchMeta({
          total: response.data.total_results,
          location: response.data.user_location,
          radius: response.data.search_radius_km,
          message: response.data.message,
        });
        if (response.data.leads.length > 0) {
          toast.success("Found " + response.data.total_results + " potential leads!");
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
          '"' + lead.name + '"',
          '"' + lead.address + '"',
          lead.distance_km,
          '"' + lead.phone + '"',
          '"' + lead.industry + '"',
          '"' + lead.power_pitch.replace(/"/g, '""') + '"',
          '"' + lead.whatsapp_link + '"',
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "leads_" + formData.target_industry.replace(/\s+/g, "_") + "_" + new Date().toISOString().split("T")[0] + ".csv";
    link.click();
    toast.success("CSV exported successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Toaster position="top-right" richColors />
      
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Jaisingh.in</span>
            </Link>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Lead Sniper
            </h1>
          </div>
        </div>
      </header>

      <section className="py-12 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-purple-600 uppercase tracking-wider mb-2">AI-Powered Lead Generation</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 mb-4">
            The Universal <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Lead Sniper</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Identify active businesses, calculate proximity, and draft high-conversion outreach messages in seconds.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 pb-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <Crosshair className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Discovery Parameters</h2>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="business-name" className="text-sm font-medium text-slate-700">Your Business Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="business-name" placeholder="Enter your business name" value={formData.user_business_name} onChange={(e) => handleInputChange("user_business_name", e.target.value)} className="pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium text-slate-700">Your Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="location" placeholder="City, Area or Address" value={formData.user_location} onChange={(e) => handleInputChange("user_location", e.target.value)} className="pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offering" className="text-sm font-medium text-slate-700">Your Core Offering</Label>
                  <div className="relative">
                    <Package className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <textarea id="offering" placeholder="What do you sell/offer?" value={formData.user_core_offering} onChange={(e) => handleInputChange("user_core_offering", e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[80px] resize-none text-sm" rows={3} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target" className="text-sm font-medium text-slate-700">Target Client Industry</Label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="target" placeholder="e.g., Shoe manufacturers, E-commerce" value={formData.target_industry} onChange={(e) => handleInputChange("target_industry", e.target.value)} className="pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium text-slate-700">Search Radius</Label>
                    <span className="text-sm font-bold text-purple-600">{formData.search_radius_km} KM</span>
                  </div>
                  <Slider value={[formData.search_radius_km]} onValueChange={(value) => handleInputChange("search_radius_km", value[0])} min={1} max={50} step={1} className="py-2" />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>1 KM</span>
                    <span>50 KM</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                  <div>
                    <p className="text-sm font-medium text-slate-800">AI-Enhanced Pitches</p>
                    <p className="text-xs text-slate-500">Use Gemini AI for personalized messages</p>
                  </div>
                  <Switch checked={formData.use_ai_pitch} onCheckedChange={(checked) => handleInputChange("use_ai_pitch", checked)} />
                </div>

                <Button onClick={handleSearch} disabled={isLoading} className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200">
                  {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sniping Leads...</>) : (<><Search className="w-4 h-4 mr-2" />Run Snipe</>)}
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Lead Results</h2>
                    {searchMeta && <p className="text-xs text-slate-500">{searchMeta.total} found within {searchMeta.radius}km</p>}
                  </div>
                </div>
                {leads.length > 0 && (
                  <Button onClick={exportToCSV} variant="outline" size="sm" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                    <Download className="w-4 h-4 mr-2" />Export CSV
                  </Button>
                )}
              </div>

              {isLoading ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-12 h-12 text-purple-600 mx-auto animate-spin mb-4" />
                  <p className="text-slate-600">Scanning for leads...</p>
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center p-16">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crosshair className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-700 mb-2">No leads yet</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">Configure your discovery parameters and click "Run Snipe" to find potential business leads.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-slate-700 font-semibold">Business Name</TableHead>
                        <TableHead className="text-slate-700 font-semibold">Distance</TableHead>
                        <TableHead className="text-slate-700 font-semibold">Phone</TableHead>
                        <TableHead className="text-slate-700 font-semibold">Industry</TableHead>
                        <TableHead className="text-slate-700 font-semibold">Power Pitch</TableHead>
                        <TableHead className="text-slate-700 font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead, index) => (
                        <TableRow key={index} className="hover:bg-blue-50/50">
                          <TableCell>
                            <div>
                              <p className="font-medium text-slate-800 text-sm">{lead.name}</p>
                              <p className="text-xs text-slate-500 truncate max-w-[180px]" title={lead.address}>{lead.address}</p>
                            </div>
                          </TableCell>
                          <TableCell><span className="font-semibold text-purple-600">{lead.distance_km} km</span></TableCell>
                          <TableCell>
                            {lead.phone ? (
                              <a href={"tel:" + lead.phone} className="flex items-center gap-1 text-slate-600 hover:text-blue-600 text-sm">
                                <Phone className="w-3 h-3" />{lead.phone}
                              </a>
                            ) : (<span className="text-slate-400 text-sm">N/A</span>)}
                          </TableCell>
                          <TableCell>
                            <span className="inline-block px-2 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-purple-700 rounded-full text-xs font-medium">{lead.industry}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start gap-2">
                              <p className="text-xs text-slate-600 line-clamp-2 flex-1" title={lead.power_pitch}>{lead.power_pitch}</p>
                              <button onClick={() => copyPitch(lead.power_pitch, index)} className="p-1 hover:bg-slate-100 rounded transition-colors" title="Copy pitch">
                                {copiedPitch === index ? (<Check className="w-4 h-4 text-green-500" />) : (<Copy className="w-4 h-4 text-slate-400" />)}
                              </button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {lead.whatsapp_link ? (
                              <a href={lead.whatsapp_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition-colors">
                                <MessageCircle className="w-3.5 h-3.5" />WhatsApp<ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (<span className="text-slate-400 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />No phone</span>)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {leads.length > 0 && (
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                  <p className="text-xs text-slate-500"><strong className="text-slate-600">Data Export:</strong> This table is optimized for Excel/Google Sheets. Use the Export CSV button or copy rows directly into your tracker.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center py-8 border-t border-blue-100 bg-white/50">
        <p className="text-sm text-slate-500">
          Built by <a href="https://jaisingh.in" className="text-blue-600 hover:underline font-medium">Jaisingh.in</a> | Lead Sniper V7 | Powered by AI
        </p>
      </footer>
    </div>
  );
};

export default LeadSniper;
