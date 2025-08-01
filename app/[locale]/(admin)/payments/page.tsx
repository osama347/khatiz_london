"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { use } from "react";
import debounce from "lodash.debounce";
import useSWR, { mutate } from "swr";

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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  Printer,
  CalendarIcon,
  ChevronLeft
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { getTranslations } from "@/lib/translations";
import { fetchPayments, fetchMembersForPayments } from "@/lib/server/payments";
import { fetchMemberByEmail } from "@/lib/server/members";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";

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
  translations,
}: {
  payment: Payment;
  onClose: () => void;
  translations: any;
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

  const status = getPaymentStatus(payment);

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{translations.paymentReceipt}</DialogTitle>
        <DialogDescription>
          {translations.reviewPaymentDetails}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>{translations.receiptNo}</Label>
            <p className="text-sm text-muted-foreground">{payment.id}</p>
          </div>
          <div>
            <Label>{translations.date}</Label>
            <p className="text-sm text-muted-foreground">
              {formatDate(payment.paid_on)}
            </p>
          </div>
          <div>
            <Label>{translations.member}</Label>
            <p className="text-sm text-muted-foreground">
              {payment.member?.name}
            </p>
          </div>
          <div>
            <Label>{translations.amount}</Label>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(payment.amount)}
            </p>
          </div>
          <div>
            <Label>{translations.status}</Label>
            <p className="text-sm text-muted-foreground">{status.en}</p>
          </div>
          <div>
            <Label>{translations.validUntil}</Label>
            <p className="text-sm text-muted-foreground">
              {formatDate(payment.active_until)}
            </p>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          {translations.cancel}
        </Button>
        <Button
          onClick={() => {
            const printWindow = window.open("", "_blank");
            if (printWindow) {
              const slipContent = `
              <!DOCTYPE html>
              <html>
                <head>
                  <title>${translations.paymentReceipt}</title>
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
                          <h1>${translations.en.paymentReceipt}</h1>
                          <p>${translations.en.community}</p>
                        </div>
                        <div class="language ps">
                          <h1>${translations.ps.paymentReceipt}</h1>
                          <p>${translations.ps.community}</p>
                        </div>
                      </div>
                    </div>
                    <div class="details">
                      <div class="row">
                        <div class="language">
                          <strong>${translations.en.receiptNo}:</strong>
                          <span>${payment.id}</span>
                        </div>
                        <div class="language ps">
                          <strong>${translations.ps.receiptNo}:</strong>
                          <span>${payment.id}</span>
                        </div>
                      </div>
                      <div class="row">
                        <div class="language">
                          <strong>${translations.en.date}:</strong>
                          <span>${formatDate(payment.paid_on)}</span>
                        </div>
                        <div class="language ps">
                          <strong>${translations.ps.date}:</strong>
                          <span>${formatDate(payment.paid_on)}</span>
                        </div>
                      </div>
                      <div class="row">
                        <div class="language">
                          <strong>${translations.en.member}:</strong>
                          <span>${payment.member?.name}</span>
                        </div>
                        <div class="language ps">
                          <strong>${translations.ps.member}:</strong>
                          <span>${payment.member?.name}</span>
                        </div>
                      </div>
                      <div class="row">
                        <div class="language">
                          <strong>${translations.en.amount}:</strong>
                          <span>${formatCurrency(payment.amount)}</span>
                        </div>
                        <div class="language ps">
                          <strong>${translations.ps.amount}:</strong>
                          <span>${formatCurrency(payment.amount)}</span>
                        </div>
                      </div>
                      <div class="row">
                        <div class="language">
                          <strong>${translations.en.status}:</strong>
                          <span>${status.en}</span>
                        </div>
                        <div class="language ps">
                          <strong>${translations.ps.status}:</strong>
                          <span>${status.ps}</span>
                        </div>
                      </div>
                      <div class="row">
                        <div class="language">
                          <strong>${translations.en.validUntil}:</strong>
                          <span>${formatDate(payment.active_until)}</span>
                        </div>
                        <div class="language ps">
                          <strong>${translations.ps.validUntil}:</strong>
                          <span>${formatDate(payment.active_until)}</span>
                        </div>
                      </div>
                    </div>
                    <div class="footer">
                      <div class="bilingual">
                        <div class="language">
                          <p>${translations.en.thankYou}</p>
                          <p>${translations.en.computerGenerated}</p>
                        </div>
                        <div class="language ps">
                          <p>${translations.ps.thankYou}</p>
                          <p>${translations.ps.computerGenerated}</p>
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
            }
          }}
        >
          <Printer className="mr-2 h-4 w-4" />
          {translations.printReceipt}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default function PaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = use(params);
  const [translations, setTranslations] = useState<any>({});
  const supabase = createClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSlipDialog, setShowSlipDialog] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newPayment, setNewPayment] = useState({
    userId: "",
    memberName: "",
    amount: "",
    paidOn: new Date().toISOString().split("T")[0],
  });
  const [memberSearch, setMemberSearch] = useState("");
  const [showMemberList, setShowMemberList] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function getUserId() {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) setUserId(data.user.id);
    }
    getUserId();
  }, []);
  useEffect(() => {
    async function getUserEmail() {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) setUserEmail(data.user.email);
    }
    getUserEmail();
  }, []);
  const { data: member, isLoading } = useSWR(
    userEmail ? ["member", userEmail] : null,
    () => fetchMemberByEmail(userEmail!)
  );
  const {
    data: paymentsData,
    error,
    isValidating,
  } = useSWR(
    ["payments", searchTerm, currentPage, pageSize],
    () => fetchPayments({ searchTerm, page: currentPage, pageSize }),
    {
      keepPreviousData: true,
    }
  );
  const { data: members = [] } = useSWR(
    ["members-for-payments", memberSearch],
    () => fetchMembersForPayments({ search: memberSearch, limit: 10 }),
    {
      keepPreviousData: true,
    }
  );
  useEffect(() => {
    if (!isLoading && member && member.role !== "admin") {
      router.replace("/profile");
    }
  }, [isLoading, member, router]);
  const payments = paymentsData?.data || [];
  const totalPayments = paymentsData?.count || 0;
  const loading = isValidating && !paymentsData;
  const filteredPayments = useMemo(
    () =>
      payments.filter(
        (payment: Payment) =>
          (payment.member?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
            payment.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
          payment.member?.name
      ),
    [payments, searchTerm]
  );
  const totalPages = useMemo(
    () => Math.ceil(filteredPayments.length / pageSize),
    [filteredPayments.length, pageSize]
  );
  const getCurrentPageItems = useCallback(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredPayments.slice(startIndex, endIndex);
  }, [filteredPayments, currentPage, pageSize]);
  const debouncedSetSearchTerm = useMemo(
    () => debounce(setSearchTerm, 300),
    []
  );
  const handleSearchInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      debouncedSetSearchTerm(e.target.value);
    },
    [debouncedSetSearchTerm]
  );
  const debouncedSetMemberSearch = useMemo(
    () => debounce(setMemberSearch, 300),
    []
  );
  const handleMemberSearchInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      debouncedSetMemberSearch(e.target.value);
      setShowMemberList(true);
    },
    [debouncedSetMemberSearch]
  );
  const getPageNumbers = useCallback(() => {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 2) {
        end = 4;
      }
      if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }
      if (start > 2) {
        pages.push(-1);
      }
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (end < totalPages - 1) {
        pages.push(-2);
      }
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);
  useEffect(() => {
    getTranslations(resolvedParams.locale).then(setTranslations);
  }, [resolvedParams.locale]);

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
      // setPayments([data[0], ...payments]); // This line is removed as payments is now managed by SWR

      // Reset form
      setNewPayment({
        userId: "",
        memberName: "",
        amount: "",
        paidOn: new Date().toISOString().split("T")[0],
      });

      setIsAddDialogOpen(false);
      toast.success("Payment recorded successfully");
      mutate(["payments", searchTerm, currentPage, pageSize]);
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
    setMemberSearch(member.name);
    setShowMemberList(false);
  };

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
      // setPayments(payments.filter((p) => p.id !== paymentToDelete.id)); // This line is removed as payments is now managed by SWR
      setShowDeleteDialog(false);
      setPaymentToDelete(null);
      toast.success("Payment deleted successfully");
      mutate(["payments", searchTerm, currentPage, pageSize]);
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
    setMemberSearch(payment.member?.name || "");
    // setShowEditDialog(true); // This line is removed as showEditDialog is no longer used
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
      // setPayments(
      //   payments.map((p) => (p.id === editingPayment.id ? data[0] : p))
      // ); // This line is removed as payments is now managed by SWR

      // Reset form and state
      setNewPayment({
        userId: "",
        memberName: "",
        amount: "",
        paidOn: new Date().toISOString().split("T")[0],
      });
      setMemberSearch("");
      setEditingPayment(null);
      // setShowEditDialog(false); // This line is removed as showEditDialog is no longer used
      toast.success("Payment updated successfully");
      mutate(["payments", searchTerm, currentPage, pageSize]);
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

  return isLoading ||
    !userEmail ||
    (member && member.role !== "admin") ? null : (
      <div className="flex flex-col max-w-[100vw] overflow-x-hidden">
        
        <div className="flex-1 space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-8">
          <div className="flex-1 space-y-4 p-4 md:p-8">
  <div className="flex items-center justify-between gap-4 mb-4">
    <Button
      variant="ghost"
      size="sm"
      className="md:hidden"
      onClick={() => window.history.back()}
    >
      <ChevronLeft className="h-4 w-4 mr-1" />
      {translations.back || "Back"}
    </Button>
  </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            
          {/* Total Collected Card */}
          <Card className="col-span-2 sm:col-span-1 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
              <CardTitle className="text-sm font-medium">
                {translations.totalCollected}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3">
              <div className="text-xl sm:text-2xl font-bold">
                {payments
                  .filter((p: Payment) => getPaymentStatus(p) === "Paid")
                  .reduce((sum: number, p: Payment) => sum + p.amount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {translations.thisMonth}
              </p>
            </CardContent>
          </Card>

          {/* Other stat cards in a scrollable container on mobile */}
          <div className="col-span-2 sm:col-span-1 flex sm:block gap-2 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0">
            {/* Pending Payments Card */}
            <Card className="flex-shrink-0 w-[180px] sm:w-auto">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
                <CardTitle className="text-sm font-medium">
                  {translations.pendingPayments}
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3">
                <div className="text-xl sm:text-2xl font-bold">
                  {
                    payments.filter(
                      (p: Payment) => getPaymentStatus(p) === "Pending"
                    ).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {translations.awaitingPayment}
                </p>
              </CardContent>
            </Card>

            {/* Overdue Card */}
            <Card className="flex-shrink-0 w-[180px] sm:w-auto">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
                <CardTitle className="text-sm font-medium">
                  {translations.overdue}
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3">
                <div className="text-xl sm:text-2xl font-bold">
                  {
                    payments.filter(
                      (p: Payment) => getPaymentStatus(p) === "Overdue"
                    ).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {translations.requireAttention}
                </p>
              </CardContent>
            </Card>

            {/* Average Payment Card */}
            <Card className="flex-shrink-0 w-[180px] sm:w-auto">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
                <CardTitle className="text-sm font-medium">
                  {translations.averagePayment}
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3">
                <div className="text-xl sm:text-2xl font-bold">
                  {payments.length > 0
                    ? (
                        payments.reduce(
                          (sum: number, p: Payment) => sum + p.amount,
                          0
                        ) / payments.length
                      ).toFixed(2)
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {translations.perMember}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={translations.searchPayments}
                value={searchTerm}
                onChange={handleSearchInput}
                className="pl-8 w-full sm:w-[300px]"
              />
            </div>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {translations.recordPayment}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[400px] sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{translations.recordNewPayment}</DialogTitle>
                <DialogDescription>
                  {translations.enterPaymentDetails}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="member" className="text-right">
                    {translations.memberRequired}
                  </Label>
                  <div className="col-span-3 relative member-search-container">
                    <Input
                      id="member"
                      value={memberSearch}
                      onChange={handleMemberSearchInput}
                      placeholder={translations.searchMember}
                      className="w-full"
                    />
                    {showMemberList && memberSearch && (
                      <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border">
                        <div className="max-h-60 overflow-auto">
                          {members.map((member: Member) => (
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
                          ))}
                          {members.length === 0 && (
                            <div className="px-4 py-2 text-gray-500">
                              {translations.noMembersFound}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    {translations.amountRequired}
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
                    placeholder={translations.enterAmount}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="paidOn" className="text-right">
                    {translations.paidOnRequired}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "col-span-3 justify-start text-left font-normal",
                          !newPayment.paidOn && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newPayment.paidOn ? (
                          formatDate(newPayment.paidOn)
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          newPayment.paidOn
                            ? new Date(newPayment.paidOn)
                            : undefined
                        }
                        onSelect={(date) =>
                          setNewPayment({
                            ...newPayment,
                            paidOn: date
                              ? date.toISOString().split("T")[0]
                              : "",
                          })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                      {translations.recordingPayment}
                    </>
                  ) : (
                    translations.recordPayment
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{translations.paymentRecords}</CardTitle>
            <CardDescription>{translations.trackPayments}</CardDescription>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="min-w-[800px] px-3 sm:px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">
                        {translations.member}
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        {translations.amount}
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        {translations.paidOn}
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Active Until
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Status
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getCurrentPageItems().length > 0 ? (
                      getCurrentPageItems().map((payment: Payment) => (
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
                          <TableCell>
                            ${formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            {payment.paid_on
                              ? formatDate(payment.paid_on)
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {formatDate(payment.active_until)}
                          </TableCell>
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
                            <p className="text-sm font-medium">
                              {translations.noPaymentsFound}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {translations.getStartedByRecording}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsAddDialogOpen(true)}
                              className="mt-2"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              {translations.recordPayment}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">
                  {translations.showing}{" "}
                  {Math.min(
                    (currentPage - 1) * pageSize + 1,
                    filteredPayments.length
                  )}{" "}
                  {translations.to}{" "}
                  {Math.min(currentPage * pageSize, filteredPayments.length)}{" "}
                  {translations.of} {filteredPayments.length}{" "}
                  {translations.entries}
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
                  {translations.first}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  {translations.previous}
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
                  {translations.next}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  {translations.last}
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
            <DialogTitle>{translations.deletePayment}</DialogTitle>
            <DialogDescription>
              {translations.deletePaymentWarning}
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
              {translations.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {translations.deleting}
                </>
              ) : (
                translations.delete
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{translations.editPayment}</DialogTitle>
            <DialogDescription>
              {translations.updatePaymentDetails}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="member" className="text-right">
                {translations.memberRequired}
              </Label>
              <div className="col-span-3 relative member-search-container">
                <Input
                  id="member"
                  value={memberSearch}
                  onChange={handleMemberSearchInput}
                  placeholder={translations.searchMember}
                  className="w-full"
                />
                {showMemberList && memberSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border">
                    <div className="max-h-60 overflow-auto">
                      {members.map((member: Member) => (
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
                      ))}
                      {members.length === 0 && (
                        <div className="px-4 py-2 text-gray-500">
                          {translations.noMembersFound}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                {translations.amountRequired}
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
                placeholder={translations.enterAmount}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paidOn" className="text-right">
                {translations.paidOnRequired}
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
                setMemberSearch("");
              }}
              disabled={isSubmitting}
            >
              {translations.cancel}
            </Button>
            <Button
              type="submit"
              onClick={handleUpdatePayment}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {translations.updatingPayment}
                </>
              ) : (
                translations.updatePayment
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
            translations={translations}
          />
        )}
      </Dialog>
        </div>
      </div>
        
  );
}
