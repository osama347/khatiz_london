"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  Calendar,
  MapPin,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  User,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PaymentRecord {
  month: number;
  year: number;
  status: "paid" | "pending" | "overdue" | "not_due";
  amount?: number;
  paidDate?: string;
  dueDate?: string;
}

interface MemberData {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  dateOfJoining: string;
  address: string;
  status: "Active" | "Inactive" | "Suspended";
  profilePicture?: string;
  membershipType: string;
  monthlyFee: number;
  totalPaid: number;
  paymentHistory: PaymentRecord[];
}

export default function MemberDetailPage() {
  const params = useParams();
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const supabase = createClient();

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  useEffect(() => {
    async function loadMember() {
      try {
        const { data, error } = await supabase
          .from("members")
          .select("*")
          .eq("id", params.id)
          .single();

        if (error) throw error;

        // Transform the data to match our interface
        const transformedData: MemberData = {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          dateOfBirth: data.date_of_birth || "",
          dateOfJoining: data.join_date,
          address: data.address || "",
          status: data.status,
          profilePicture: data.avatar,
          membershipType: data.membership_type || "Standard",
          monthlyFee: data.monthly_fee || 0,
          totalPaid: data.total_paid || 0,
          paymentHistory: data.payment_history || [],
        };

        setMemberData(transformedData);
      } catch (error) {
        console.error("Error loading member:", error);
      } finally {
        setLoading(false);
      }
    }

    loadMember();
  }, [params.id, supabase]);

  const getPaymentForMonth = (
    month: number,
    year: number
  ): PaymentRecord | null => {
    if (!memberData) return null;
    return (
      memberData.paymentHistory.find(
        (payment) => payment.month === month && payment.year === year
      ) || null
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "overdue":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return (
          <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "Inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "Suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStats = () => {
    if (!memberData)
      return { paidCount: 0, pendingCount: 0, overdueCount: 0, total: 0 };

    const currentYearPayments = memberData.paymentHistory.filter(
      (p) => p.year === selectedYear
    );
    const paidCount = currentYearPayments.filter(
      (p) => p.status === "paid"
    ).length;
    const pendingCount = currentYearPayments.filter(
      (p) => p.status === "pending"
    ).length;
    const overdueCount = currentYearPayments.filter(
      (p) => p.status === "overdue"
    ).length;

    return {
      paidCount,
      pendingCount,
      overdueCount,
      total: currentYearPayments.length,
    };
  };

  const stats = getPaymentStats();

  if (loading) {
    return (
      <div className="flex flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center gap-2">
            <Skeleton className="h-8 w-32" />
            <div className="h-4 w-px bg-border" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-9 w-32" />
        </header>

        <div className="flex-1 space-y-6 p-4 md:p-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="flex flex-col items-center space-y-4">
                  <Skeleton className="h-32 w-32 rounded-full" />
                  <div className="space-y-2 text-center">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-6 w-40" />
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-6 w-40" />
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-9 w-48" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {months.map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="flex flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center gap-2">
            <Link href="/members">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Members
              </Button>
            </Link>
            <div className="h-4 w-px bg-border" />
            <h1 className="text-lg font-semibold">Member Details</h1>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Member not found</h2>
            <p className="mt-2 text-muted-foreground">
              The member you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center gap-2">
          <Link href="/members">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Members
            </Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-lg font-semibold">Member Details</h1>
        </div>
        <Button className="gap-2">
          <Edit className="h-4 w-4" />
          Edit Member
        </Button>
      </header>

      <div className="flex-1 space-y-6 p-4 md:p-8">
        {/* Member Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Member Profile</CardTitle>
            <CardDescription>
              Personal information and membership details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Profile Picture and Basic Info */}
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage
                    src={memberData.profilePicture || "/placeholder.svg"}
                    alt={memberData.name}
                  />
                  <AvatarFallback className="text-2xl">
                    {memberData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h2 className="text-xl font-semibold">{memberData.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    Member ID: {memberData.id}
                  </p>
                  <div className="mt-2">
                    {getStatusBadge(memberData.status)}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{memberData.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{memberData.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{memberData.address}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Born:{" "}
                      {new Date(memberData.dateOfBirth).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Membership Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Membership Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {memberData.membershipType} Member
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Joined:{" "}
                      {new Date(memberData.dateOfJoining).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Monthly Fee: ${memberData.monthlyFee}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Total Paid: ${memberData.totalPaid}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment History Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  Monthly payment status and records
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Year:</span>
                <div className="flex gap-1">
                  {Array.from(
                    new Set(
                      memberData.paymentHistory.map((payment) => payment.year)
                    )
                  )
                    .sort((a, b) => b - a)
                    .map((year) => (
                      <Button
                        key={year}
                        variant={selectedYear === year ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedYear(year)}
                      >
                        {year}
                      </Button>
                    ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Payment Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {stats.paidCount}
                </div>
                <div className="text-xs text-green-700">Paid</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pendingCount}
                </div>
                <div className="text-xs text-yellow-700">Pending</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="text-2xl font-bold text-red-600">
                  {stats.overdueCount}
                </div>
                <div className="text-xs text-red-700">Overdue</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total}
                </div>
                <div className="text-xs text-blue-700">Total</div>
              </div>
            </div>

            {/* Monthly Payment Grid */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium">
                {selectedYear} Payment Status
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {months.map((month, index) => {
                  const monthNumber = index + 1;
                  const payment = getPaymentForMonth(monthNumber, selectedYear);
                  const hasPayment = payment !== null;

                  return (
                    <div
                      key={month}
                      className={cn(
                        "relative p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md",
                        hasPayment
                          ? payment.status === "paid"
                            ? "border-green-200 bg-green-50 hover:border-green-300"
                            : payment.status === "pending"
                            ? "border-yellow-200 bg-yellow-50 hover:border-yellow-300"
                            : "border-red-200 bg-red-50 hover:border-red-300"
                          : "border-gray-200 bg-gray-50 hover:border-gray-300"
                      )}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className="text-sm font-medium text-gray-700">
                          {month}
                        </div>
                        <div className="flex items-center justify-center">
                          {hasPayment ? (
                            getStatusIcon(payment.status)
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                        {hasPayment && payment.amount && (
                          <div className="text-xs text-center">
                            <div className="font-medium">${payment.amount}</div>
                            {payment.paidDate && (
                              <div className="text-gray-500">
                                {new Date(payment.paidDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {hasPayment &&
                          payment.status === "pending" &&
                          payment.dueDate && (
                            <div className="text-xs text-center text-yellow-600">
                              Due:{" "}
                              {new Date(payment.dueDate).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" }
                              )}
                            </div>
                          )}
                        {hasPayment &&
                          payment.status === "overdue" &&
                          payment.dueDate && (
                            <div className="text-xs text-center text-red-600">
                              Overdue:{" "}
                              {new Date(payment.dueDate).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" }
                              )}
                            </div>
                          )}
                      </div>

                      {/* Status indicator dot */}
                      {hasPayment && (
                        <div
                          className={cn(
                            "absolute top-2 right-2 w-2 h-2 rounded-full",
                            payment.status === "paid"
                              ? "bg-green-500"
                              : payment.status === "pending"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-600">Paid</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-600">Overdue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                  <span className="text-sm text-gray-600">No Payment Due</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Record Payment
          </Button>
          <Button variant="outline" className="gap-2">
            <Mail className="h-4 w-4" />
            Send Reminder
          </Button>
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            View Calendar
          </Button>
        </div>
      </div>
    </div>
  );
}
