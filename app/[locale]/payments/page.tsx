"use client";

import { useState, useEffect } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, DollarSign, Printer } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

interface Payment {
  id: string;
  member_id: string;
  amount: number;
  paid_on: string;
  active_until: string;
  member?: {
    name: string;
    avatar?: string;
    email?: string;
  };
}

interface Member {
  id: string;
  name: string;
  avatar?: string;
}

// Add this new component for the payment slip
const PaymentSlip = ({
  payment,
  onClose,
}: {
  payment: Payment;
  onClose: () => void;
}) => {
  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getPaymentStatus = (payment: Payment) => {
    const now = new Date();
    const activeUntil = new Date(payment.active_until);
    const paidOn = new Date(payment.paid_on);

    if (paidOn > now) {
      return { en: "Invalid", ps: "ناسم" };
    }

    if (activeUntil < now) {
      return { en: "Overdue", ps: "ورکړل شوی" };
    } else if (
      activeUntil.getTime() - now.getTime() <
      7 * 24 * 60 * 60 * 1000
    ) {
      return { en: "Pending", ps: "په تمه کې" };
    } else {
      return { en: "Paid", ps: "ورکړل شوی" };
    }
  };

  const translations = {
    receipt: {
      en: "Payment Receipt",
      ps: "د پیسو رسید",
    },
    community: {
      en: "East London Community",
      ps: "د ختیځ لندن ټولنه",
    },
    receiptNo: {
      en: "Receipt No",
      ps: "د رسید شمیره",
    },
    date: {
      en: "Date",
      ps: "نیټه",
    },
    member: {
      en: "Member",
      ps: "غړی",
    },
    amount: {
      en: "Amount",
      ps: "مبلغ",
    },
    status: {
      en: "Status",
      ps: "حالت",
    },
    validUntil: {
      en: "Valid Until",
      ps: "تر کومه نیټه معتبر دی",
    },
    thankYou: {
      en: "Thank you for your payment!",
      ps: "ستاسو د پیسو د ورکړې مننه!",
    },
    computerGenerated: {
      en: "This is a computer-generated receipt.",
      ps: "دا د کمپیوټر له خوا جوړ شوی رسید دی.",
    },
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const status = getPaymentStatus(payment);

    const slipContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .receipt {
              max-width: 800px;
              margin: 0 auto;
              border: 1px solid #ddd;
              padding: 20px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .details {
              margin-bottom: 20px;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
            .bilingual {
              display: flex;
              justify-content: space-between;
            }
            .language {
              flex: 1;
              padding: 0 10px;
            }
            .language:first-child {
              border-right: 1px solid #ddd;
            }
            .ps {
              direction: rtl;
              text-align: right;
            }
            @media print {
              body {
                padding: 0;
              }
              .receipt {
                box-shadow: none;
                border: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="bilingual">
                <div class="language">
                  <h1>${translations.receipt.en}</h1>
                  <p>${translations.community.en}</p>
                </div>
                <div class="language ps">
                  <h1>${translations.receipt.ps}</h1>
                  <p>${translations.community.ps}</p>
                </div>
              </div>
            </div>
            <div class="details">
              <div class="row">
                <div class="language">
                  <strong>${translations.receiptNo.en}:</strong>
                  <span>${payment.id}</span>
                </div>
                <div class="language ps">
                  <strong>${translations.receiptNo.ps}:</strong>
                  <span>${payment.id}</span>
                </div>
              </div>
              <div class="row">
                <div class="language">
                  <strong>${translations.date.en}:</strong>
                  <span>${formatDate(payment.paid_on)}</span>
                </div>
                <div class="language ps">
                  <strong>${translations.date.ps}:</strong>
                  <span>${formatDate(payment.paid_on)}</span>
                </div>
              </div>
              <div class="row">
                <div class="language">
                  <strong>${translations.member.en}:</strong>
                  <span>${payment.member?.name}</span>
                </div>
                <div class="language ps">
                  <strong>${translations.member.ps}:</strong>
                  <span>${payment.member?.name}</span>
                </div>
              </div>
              <div class="row">
                <div class="language">
                  <strong>${translations.amount.en}:</strong>
                  <span>${formatCurrency(payment.amount)}</span>
                </div>
                <div class="language ps">
                  <strong>${translations.amount.ps}:</strong>
                  <span>${formatCurrency(payment.amount)}</span>
                </div>
              </div>
              <div class="row">
                <div class="language">
                  <strong>${translations.status.en}:</strong>
                  <span>${status.en}</span>
                </div>
                <div class="language ps">
                  <strong>${translations.status.ps}:</strong>
                  <span>${status.ps}</span>
                </div>
              </div>
              <div class="row">
                <div class="language">
                  <strong>${translations.validUntil.en}:</strong>
                  <span>${formatDate(payment.active_until)}</span>
                </div>
                <div class="language ps">
                  <strong>${translations.validUntil.ps}:</strong>
                  <span>${formatDate(payment.active_until)}</span>
                </div>
              </div>
            </div>
            <div class="footer">
              <div class="bilingual">
                <div class="language">
                  <p>${translations.thankYou.en}</p>
                  <p>${translations.computerGenerated.en}</p>
                </div>
                <div class="language ps">
                  <p>${translations.thankYou.ps}</p>
                  <p>${translations.computerGenerated.ps}</p>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(slipContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const status = getPaymentStatus(payment);

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Payment Receipt</DialogTitle>
        <DialogDescription>
          Review the payment details before printing
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Receipt No</Label>
            <p className="text-sm text-muted-foreground">{payment.id}</p>
          </div>
          <div>
            <Label>Date</Label>
            <p className="text-sm text-muted-foreground">
              {formatDate(payment.paid_on)}
            </p>
          </div>
          <div>
            <Label>Member</Label>
            <p className="text-sm text-muted-foreground">
              {payment.member?.name}
            </p>
          </div>
          <div>
            <Label>Amount</Label>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(payment.amount)}
            </p>
          </div>
          <div>
            <Label>Status</Label>
            <p className="text-sm text-muted-foreground">{status.en}</p>
          </div>
          <div>
            <Label>Valid Until</Label>
            <p className="text-sm text-muted-foreground">
              {formatDate(payment.active_until)}
            </p>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const [newPayment, setNewPayment] = useState({
    userId: "",
    memberName: "",
    amount: "",
    paidOn: new Date().toISOString().split("T")[0],
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showMemberList, setShowMemberList] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Add this state for the payment slip dialog
  const [showSlipDialog, setShowSlipDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Derived values
  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPayments = payments.filter(
    (payment) =>
      (payment.member?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
      payment.member?.name
  );

  const totalPages = Math.ceil(filteredPayments.length / pageSize);

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredPayments.slice(startIndex, endIndex);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages are less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate start and end of visible pages
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if at the start
      if (currentPage <= 2) {
        end = 4;
      }
      // Adjust if at the end
      if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }

      // Add ellipsis if needed
      if (start > 2) {
        pages.push(-1); // -1 represents ellipsis
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push(-2); // -2 represents ellipsis
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Fetch payments with member information
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select(
            `
            *,
            member:members(name, avatar, email)
          `
          )
          .order("paid_on", { ascending: false });

        if (paymentsError) {
          console.error("Payments error:", paymentsError);
          toast.error(`Failed to load payments: ${paymentsError.message}`);
          return;
        }

        // Fetch members for the dropdown
        const { data: membersData, error: membersError } = await supabase
          .from("members")
          .select("id, name, avatar")
          .order("name");

        if (membersError) {
          console.error("Members error:", membersError);
          toast.error(`Failed to load members: ${membersError.message}`);
          return;
        }

        if (!paymentsData || !membersData) {
          toast.error("No data received from the server");
          return;
        }

        setPayments(paymentsData);
        setMembers(membersData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to load data"
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  const handleAddPayment = async () => {
    // Validate required fields
    if (!newPayment.userId || !newPayment.amount || !newPayment.paidOn) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate amount
    const amount = Number.parseFloat(newPayment.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    // Validate dates
    const paidOn = new Date(newPayment.paidOn);
    if (isNaN(paidOn.getTime())) {
      toast.error("Please enter a valid payment date");
      return;
    }

    try {
      setIsSubmitting(true);
      // Format date to ISO string and remove time component
      const formattedPaidOn = paidOn.toISOString().split("T")[0];

      const { data, error } = await supabase.from("payments").insert([
        {
          member_id: newPayment.userId,
          amount: amount,
          paid_on: formattedPaidOn,
        },
      ]).select(`
          *,
          member:members(name, avatar)
        `);

      if (error) {
        console.error("Error adding payment:", error);
        toast.error(`Failed to record payment: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        toast.error("No data returned after adding payment");
        return;
      }

      // Add the new payment to the beginning of the list
      setPayments([data[0], ...payments]);

      // Reset form
      setNewPayment({
        userId: "",
        memberName: "",
        amount: "",
        paidOn: new Date().toISOString().split("T")[0],
      });

      setIsAddDialogOpen(false);
      toast.success("Payment recorded successfully");
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to record payment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getPaymentStatus = (payment: Payment) => {
    const now = new Date();
    const activeUntil = new Date(payment.active_until);
    const paidOn = new Date(payment.paid_on);

    // If payment date is in the future, mark as invalid
    if (paidOn > now) {
      return "Invalid";
    }

    if (activeUntil < now) {
      return "Overdue";
    } else if (
      activeUntil.getTime() - now.getTime() <
      7 * 24 * 60 * 60 * 1000
    ) {
      return "Pending";
    } else {
      return "Paid";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case "Pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "Overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      case "Invalid":
        return <Badge className="bg-gray-100 text-gray-800">Invalid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleMemberSelect = (member: Member) => {
    setNewPayment({
      ...newPayment,
      userId: member.id,
      memberName: member.name,
    });
    setSearchQuery(member.name);
    setShowMemberList(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowMemberList(true);
    if (!value) {
      setNewPayment({
        ...newPayment,
        userId: "",
        memberName: "",
      });
    }
  };

  // Close member list when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".member-search-container")) {
        setShowMemberList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDeletePayment = async (payment: Payment) => {
    setPaymentToDelete(payment);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!paymentToDelete) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", paymentToDelete.id);

      if (error) {
        console.error("Error deleting payment:", error);
        toast.error(`Failed to delete payment: ${error.message}`);
        return;
      }

      // Remove the payment from the list
      setPayments(payments.filter((p) => p.id !== paymentToDelete.id));
      setShowDeleteDialog(false);
      setPaymentToDelete(null);
      toast.success("Payment deleted successfully");
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete payment"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setNewPayment({
      userId: payment.member_id,
      memberName: payment.member?.name || "",
      amount: payment.amount.toString(),
      paidOn: new Date(payment.paid_on).toISOString().split("T")[0],
    });
    setSearchQuery(payment.member?.name || "");
    setShowEditDialog(true);
  };

  const handleUpdatePayment = async () => {
    if (!editingPayment) return;

    // Validate required fields
    if (!newPayment.userId || !newPayment.amount || !newPayment.paidOn) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate amount
    const amount = Number.parseFloat(newPayment.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    // Validate dates
    const paidOn = new Date(newPayment.paidOn);
    if (isNaN(paidOn.getTime())) {
      toast.error("Please enter a valid payment date");
      return;
    }

    try {
      setIsSubmitting(true);
      const formattedPaidOn = paidOn.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("payments")
        .update({
          member_id: newPayment.userId,
          amount: amount,
          paid_on: formattedPaidOn,
        })
        .eq("id", editingPayment.id).select(`
          *,
          member:members(name, avatar)
        `);

      if (error) {
        console.error("Error updating payment:", error);
        toast.error(`Failed to update payment: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        toast.error("No data returned after updating payment");
        return;
      }

      // Update the payment in the list
      setPayments(
        payments.map((p) => (p.id === editingPayment.id ? data[0] : p))
      );

      // Reset form and state
      setNewPayment({
        userId: "",
        memberName: "",
        amount: "",
        paidOn: new Date().toISOString().split("T")[0],
      });
      setSearchQuery("");
      setEditingPayment(null);
      setShowEditDialog(false);
      toast.success("Payment updated successfully");
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update payment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add this function to handle opening the slip dialog
  const handlePrintSlip = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowSlipDialog(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col">
        {/* <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center gap-2">
            <Skeleton className="h-6 w-48" />
          </div>
        </header> */}

        <div className="flex-1 space-y-4 p-4 md:p-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-[300px]" />
            <Skeleton className="h-10 w-32" />
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-4 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Collected
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  payments
                    .filter((p) => getPaymentStatus(p) === "Paid")
                    .reduce((sum, p) => sum + p.amount, 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Payments
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  payments.filter((p) => getPaymentStatus(p) === "Pending")
                    .length
                }
              </div>
              <p className="text-xs text-muted-foreground">Awaiting payment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  payments.filter((p) => getPaymentStatus(p) === "Overdue")
                    .length
                }
              </div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Payment
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  payments.length > 0
                    ? payments.reduce((sum, p) => sum + p.amount, 0) /
                        payments.length
                    : 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">Per member</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[300px]"
              />
            </div>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Record New Payment</DialogTitle>
                <DialogDescription>
                  Enter the payment details for a community member.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="member" className="text-right">
                    Member *
                  </Label>
                  <div className="col-span-3 relative member-search-container">
                    <Input
                      id="member"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search member..."
                      className="w-full"
                    />
                    {showMemberList && searchQuery && (
                      <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border">
                        <div className="max-h-60 overflow-auto">
                          {filteredMembers.length > 0 ? (
                            filteredMembers.map((member) => (
                              <div
                                key={member.id}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                                onClick={() => handleMemberSelect(member)}
                              >
                                <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                                  {member.avatar ? (
                                    <img
                                      src={member.avatar}
                                      alt={member.name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs font-medium">
                                      {member.name.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <span className="truncate">{member.name}</span>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-gray-500">
                              No members found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Amount *
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newPayment.amount}
                    onChange={(e) =>
                      setNewPayment({ ...newPayment, amount: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="Enter amount"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="paidOn" className="text-right">
                    Paid On *
                  </Label>
                  <Input
                    id="paidOn"
                    type="date"
                    value={newPayment.paidOn}
                    onChange={(e) =>
                      setNewPayment({ ...newPayment, paidOn: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  onClick={handleAddPayment}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Recording Payment...
                    </>
                  ) : (
                    "Record Payment"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Records</CardTitle>
            <CardDescription>
              Track all member payments and subscription status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid On</TableHead>
                  <TableHead>Active Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getCurrentPageItems().length > 0 ? (
                  getCurrentPageItems().map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full overflow-hidden">
                            {payment.member?.avatar ? (
                              <img
                                src={payment.member.avatar}
                                alt={payment.member.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-muted flex items-center justify-center">
                                <span className="text-xs font-medium">
                                  {payment.member?.name
                                    ?.charAt(0)
                                    .toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <span>{payment.member?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>${formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        {payment.paid_on ? formatDate(payment.paid_on) : "-"}
                      </TableCell>
                      <TableCell>{formatDate(payment.active_until)}</TableCell>
                      <TableCell>
                        {getStatusBadge(getPaymentStatus(payment))}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrintSlip(payment)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPayment(payment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePayment(payment)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <DollarSign className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-medium">No payments found</p>
                        <p className="text-sm text-muted-foreground">
                          Get started by recording your first payment
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddDialogOpen(true)}
                          className="mt-2"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Record Payment
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  {Math.min(
                    (currentPage - 1) * pageSize + 1,
                    filteredPayments.length
                  )}{" "}
                  to {Math.min(currentPage * pageSize, filteredPayments.length)}{" "}
                  of {filteredPayments.length} entries
                </p>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => handlePageSizeChange(Number(value))}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={pageSize} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {getPageNumbers().map((page, index) =>
                    page < 0 ? (
                      <span key={`ellipsis-${index}`} className="px-2">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="w-8 h-8"
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setPaymentToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>
              Update the payment details for this member.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="member" className="text-right">
                Member *
              </Label>
              <div className="col-span-3 relative member-search-container">
                <Input
                  id="member"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search member..."
                  className="w-full"
                />
                {showMemberList && searchQuery && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border">
                    <div className="max-h-60 overflow-auto">
                      {filteredMembers.length > 0 ? (
                        filteredMembers.map((member) => (
                          <div
                            key={member.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                            onClick={() => handleMemberSelect(member)}
                          >
                            <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                              {member.avatar ? (
                                <img
                                  src={member.avatar}
                                  alt={member.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-medium">
                                  {member.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <span className="truncate">{member.name}</span>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500">
                          No members found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount *
              </Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={newPayment.amount}
                onChange={(e) =>
                  setNewPayment({ ...newPayment, amount: e.target.value })
                }
                className="col-span-3"
                placeholder="Enter amount"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paidOn" className="text-right">
                Paid On *
              </Label>
              <Input
                id="paidOn"
                type="date"
                value={newPayment.paidOn}
                onChange={(e) =>
                  setNewPayment({ ...newPayment, paidOn: e.target.value })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setEditingPayment(null);
                setNewPayment({
                  userId: "",
                  memberName: "",
                  amount: "",
                  paidOn: new Date().toISOString().split("T")[0],
                });
                setSearchQuery("");
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleUpdatePayment}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Updating Payment...
                </>
              ) : (
                "Update Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Slip Dialog */}
      <Dialog open={showSlipDialog} onOpenChange={setShowSlipDialog}>
        {selectedPayment && (
          <PaymentSlip
            payment={selectedPayment}
            onClose={() => {
              setShowSlipDialog(false);
              setSelectedPayment(null);
            }}
          />
        )}
      </Dialog>
    </div>
  );
}
