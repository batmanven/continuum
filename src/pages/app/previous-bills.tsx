import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Calendar, 
  Building, 
  User, 
  IndianRupee, 
  Search,
  Eye,
  Trash2,
  Loader2
} from "lucide-react";
import { billService, BillRecord } from "@/services/billService";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { toast } from "sonner";

const PreviousBills = () => {
  const { user } = useSupabaseAuth();
  const { activeProfile } = useProfile();
  const navigate = useNavigate();
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadBills();
    }
  }, [user, activeProfile.id]);

  const loadBills = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await billService.getUserBills(user.id, 50, 0, activeProfile.id);
      if (error) {
        toast.error("Failed to load bills: " + error);
      } else if (data) {
        setBills(data);
      }
    } catch (error) {
      toast.error("Error loading bills");
      console.error("Error loading bills:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewBill = (bill: BillRecord) => {
    
    navigate("/app/bill-explainer", { 
      state: { 
        billData: bill,
        isViewMode: true 
      } 
    });
  };

  const handleDeleteBill = async (billId: string) => {
    setDeletingId(billId);
    try {
      const { error } = await billService.deleteBill(billId);
      if (error) {
        toast.error("Failed to delete bill: " + error);
      } else {
        toast.success("Bill deleted successfully");
        setBills(bills.filter(bill => bill.id !== billId));
      }
    } catch (error) {
      toast.error("Error deleting bill");
      console.error("Error deleting bill:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredBills = bills.filter(bill => {
    const searchLower = searchTerm.toLowerCase();
    const structuredData = bill.structured_data;
    
    return (
      bill.raw_text.toLowerCase().includes(searchLower) ||
      (structuredData.patientName?.toLowerCase().includes(searchLower) || false) ||
      (structuredData.hospitalName?.toLowerCase().includes(searchLower) || false) ||
      (structuredData.lineItems?.some(item => 
        item.item.toLowerCase().includes(searchLower)
      ) || false)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading bills...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="opacity-0 animate-fade-in">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Previous Bills
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage your processed medical bills
        </p>
      </div>

      {/* Search Bar */}
      <div className="opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bills by patient, hospital, or items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Bills Grid */}
      {filteredBills.length === 0 ? (
        <div className="text-center py-12 opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {searchTerm ? "No bills found" : "No bills yet"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchTerm 
              ? "Try adjusting your search terms"
              : "Process your first medical bill to see it here"
            }
          </p>
          {!searchTerm && (
            <Button onClick={() => navigate("/app/bill-explainer")}>
              Process Your First Bill
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
          {filteredBills.map((bill, index) => {
            const data = bill.structured_data;
            return (
              <Card 
                key={bill.id} 
                className="cursor-pointer hover:shadow-md transition-all duration-200 group"
                style={{ animationDelay: `${200 + index * 50}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        {data.hospitalName || "Unknown Hospital"}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {bill.created_at ? formatDate(bill.created_at) : "Unknown date"}
                        </div>
                        {data.patientName && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {data.patientName}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {data.lineItems?.length || 0} items
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewBill(bill);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBill(bill.id!);
                        }}
                        disabled={deletingId === bill.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      >
                        {deletingId === bill.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Total Amount */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Amount</span>
                      <div className="flex items-center gap-1 font-semibold">
                        <IndianRupee className="h-4 w-4" />
                        {data.totalAmount?.toLocaleString() || "N/A"}
                      </div>
                    </div>

                    {/* Line Items Preview */}
                    {data.lineItems && data.lineItems.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs text-muted-foreground">Recent Items</span>
                        <div className="space-y-1">
                          {data.lineItems.slice(0, 3).map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground truncate flex-1 mr-2">
                                {item.item}
                              </span>
                              <span className="font-medium">₹{item.cost.toLocaleString()}</span>
                            </div>
                          ))}
                          {data.lineItems.length > 3 && (
                            <div className="text-xs text-muted-foreground text-center">
                              +{data.lineItems.length - 3} more items
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Confidence Score */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Processing Confidence</span>
                      <Badge 
                        variant={data.confidence && data.confidence > 0.7 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {Math.round((data.confidence || 0.7) * 100)}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PreviousBills;
