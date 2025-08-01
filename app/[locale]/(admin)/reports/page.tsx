"use client";

import { useState, useEffect, useRef, use } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download, Printer, ChevronLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTranslations, Locale as SupportedLocale } from "@/lib/translations";
import { useMemo, useCallback } from "react";
import useSWR from "swr";
import { fetchPaymentTrends } from "@/lib/server/reports";
import { fetchMemberByEmail } from "@/lib/server/members";
import { useRouter } from "next/navigation";

interface Payment {
  id: string;
  member_id: string;
  amount: number;
  paid_on: string;
  active_until: string;
  member?: {
    name: string;
  };
}

interface Member {
  id: string;
  name: string;
  status: "Active" | "Inactive" | "Suspended";
  join_date: string;
}

interface MonthlyPayment {
  month: string;
  totalAmount: number;
  paymentCount: number;
  members: {
    name: string;
    amount: number;
    paid_on: string;
  }[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

type ReportType = "overview" | "monthly" | "member" | "payment";

export default function ReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = use(params);
  const locale: SupportedLocale = ["en", "ps"].includes(resolvedParams.locale)
    ? (resolvedParams.locale as SupportedLocale)
    : "en";

  const [t, setT] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [monthlyPayments, setMonthlyPayments] = useState<MonthlyPayment[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportType>("overview");
  const supabase = createClient();
  const reportRef = useRef<HTMLDivElement>(null);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  // Load translations on mount or locale change
  useEffect(() => {
    getTranslations(locale).then(setT);
  }, [locale]);

  // SWR data fetching for payment trends
  const {
    data: paymentTrends,
    error: paymentTrendsError,
    isValidating: paymentTrendsLoading,
  } = useSWR(
    ["paymentTrends", timeRange],
    () => fetchPaymentTrends({ timeRange }),
    {
      keepPreviousData: true,
    }
  );

  useEffect(() => {
    // Only run if translations are loaded
    if (!t) return;

    async function loadData() {
      try {
        setLoading(true);

        // Fetch payments with member information
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select(
            `
            *,
            member:members(name)
          `
          )
          .order("paid_on", { ascending: false });

        if (paymentsError) {
          console.error("Error fetching payments:", paymentsError);
          toast.error(t?.failedToLoadPayments || "Failed to load payments");
          return;
        }

        // Fetch members
        const { data: membersData, error: membersError } = await supabase
          .from("members")
          .select("id, name, status, join_date")
          .order("join_date", { ascending: false });

        if (membersError) {
          console.error("Error fetching members:", membersError);
          toast.error(t?.failedToLoadMembers || "Failed to load members");
          return;
        }

        if (!paymentsData || !membersData) {
          toast.error(t?.noDataReceived || "No data received");
          return;
        }

        // Process payments for monthly report
        const monthlyData = processMonthlyPayments(paymentsData);
        setMonthlyPayments(monthlyData);

        setPayments(paymentsData);
        setMembers(membersData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : (t?.failedToLoadData || "Failed to load data")
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase, t]);

  useEffect(() => {
    async function getUserId() {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) setUserId(data.user.id);
    }
    getUserId();
  }, [supabase.auth]);
  useEffect(() => {
    async function getUserEmail() {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) setUserEmail(data.user.email);
    }
    getUserEmail();
  }, [supabase.auth]);
  const { data: member, isLoading } = useSWR(
    userEmail ? ["member", userEmail] : null,
    () => fetchMemberByEmail(userEmail!)
  );
  useEffect(() => {
    if (!isLoading && member && member.role !== "admin") {
      router.replace("/profile");
    }
  }, [isLoading, member, router]);

  // Memoized calculations
  const totalRevenue = useMemo(
    () => payments.reduce((sum, payment) => sum + payment.amount, 0),
    [payments]
  );
  const averagePayment = useMemo(
    () => (payments.length > 0 ? totalRevenue / payments.length : 0),
    [payments, totalRevenue]
  );
  const activeMembers = useMemo(
    () => members.filter((m) => m.status === "Active").length,
    [members]
  );
  const inactiveMembers = useMemo(
    () => members.filter((m) => m.status === "Inactive").length,
    [members]
  );
  const suspendedMembers = useMemo(
    () => members.filter((m) => m.status === "Suspended").length,
    [members]
  );
  const memberStatusData = useMemo(
    () => [
      { name: t?.Active || "Active", value: activeMembers },
      { name: t?.Inactive || "Inactive", value: inactiveMembers },
      { name: t?.Suspended || "Suspended", value: suspendedMembers },
    ],
    [activeMembers, inactiveMembers, suspendedMembers, t]
  );
  const topPayingMembers = useMemo(
    () =>
      Object.entries(
        payments.reduce((acc: { [key: string]: number }, payment) => {
          const memberName = payment.member?.name || t?.Unknown || "Unknown";
          acc[memberName] = (acc[memberName] || 0) + payment.amount;
          return acc;
        }, {})
      )
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5),
    [payments, t]
  );
  const handlePrint = useCallback(() => {
    window.print();
  }, []);
  const handleDownloadPDF = useCallback(async () => {
    try {
      toast.info(
        "PDF download functionality will be available after installing required packages"
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report");
    }
  }, []);
  const handleDownloadCSV = useCallback(() => {
    try {
      const csvData = [
        ["Report Type", "Value"],
        [
          "Total Revenue",
          new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(totalRevenue),
        ],
        [
          "Average Payment",
          new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(averagePayment),
        ],
        ["Active Members", activeMembers.toString()],
        ["Total Members", members.length.toString()],
        [],
        ["Top Paying Members"],
        ...topPayingMembers.map((member) => [
          member.name,
          new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(member.amount),
        ]),
      ];
      const csvContent = csvData.map((row) => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `reports_${format(new Date(), "yyyy-MM-dd")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating CSV:", error);
      toast.error("Failed to generate CSV report");
    }
  }, [
    totalRevenue,
    averagePayment,
    activeMembers,
    members.length,
    topPayingMembers,
  ]);
  const processMonthlyPayments = useCallback(
    (payments: Payment[]): MonthlyPayment[] => {
      const monthlyMap = new Map<string, MonthlyPayment>();
      payments.forEach((payment) => {
        const month = format(new Date(payment.paid_on), "MMMM yyyy");
        if (!monthlyMap.has(month)) {
          monthlyMap.set(month, {
            month,
            totalAmount: 0,
            paymentCount: 0,
            members: [],
          });
        }
        const monthData = monthlyMap.get(month)!;
        monthData.totalAmount += payment.amount;
        monthData.paymentCount += 1;
        monthData.members.push({
          name: payment.member?.name || "Unknown",
          amount: payment.amount,
          paid_on: payment.paid_on,
        });
      });
      return Array.from(monthlyMap.values()).sort(
        (a, b) => new Date(b.month).getTime() - new Date(a.month).getTime()
      );
    },
    []
  );
  const renderReportContent = useCallback(() => {
    if (!t) return <div />;
    switch (selectedReport) {
      case "overview":
        return (
          <>
            {/* Stats Cards Grid - Responsive for desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t.totalRevenue}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl lg:text-3xl font-bold">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(totalRevenue)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t.allTime}</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t.averagePayment}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl lg:text-3xl font-bold">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(averagePayment)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.perPayment}
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t.activeMembers}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl lg:text-3xl font-bold text-green-600">{activeMembers}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.currentActiveMembers}
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t.totalMembers}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl lg:text-3xl font-bold">{members.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">{t.allTime}</p>
                </CardContent>
              </Card>
            </div>
            {/* Charts Section - Improved Desktop Layout */}
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {/* Payment Trends Chart - Takes more space on desktop */}
              <Card className="lg:col-span-2 xl:col-span-2">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg lg:text-xl">
                    {t.paymentTrends}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {t.paymentAmountsOverTime}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="h-[300px] lg:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={paymentTrends}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          className="text-muted-foreground"
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          className="text-muted-foreground"
                        />
                        <Tooltip
                          formatter={(value: number) =>
                            new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(value)
                          }
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Member Status Distribution - Compact on desktop */}
              <Card className="lg:col-span-1 xl:col-span-1">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg">{t.memberStatusDistribution}</CardTitle>
                  <CardDescription className="text-sm">
                    {t.currentMemberStatusBreakdown}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="h-[300px] lg:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={memberStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={"80%"}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {memberStatusData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top Paying Members - New section for desktop */}
              <Card className="lg:col-span-2 xl:col-span-3">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg">{t?.topPayingMembers || "Top Paying Members"}</CardTitle>
                  <CardDescription className="text-sm">
                    {t?.topMembersDescription || "Members with highest total payments"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="h-[250px] lg:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topPayingMembers} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          type="number" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => 
                            new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                              notation: "compact"
                            }).format(value)
                          }
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          tick={{ fontSize: 12 }}
                          width={120}
                        />
                        <Tooltip
                          formatter={(value: number) =>
                            new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(value)
                          }
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                        />
                        <Bar 
                          dataKey="amount" 
                          fill="#10b981" 
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        );

      case "monthly":
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t.monthlyPaymentHistory}</CardTitle>
                  <CardDescription>
                    {t.detailedPaymentHistoryByMonth}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const element = document.getElementById(
                      "monthly-payment-table"
                    );
                    if (element) {
                      const printWindow = window.open("", "_blank");
                      if (printWindow) {
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>${t.monthlyPaymentHistory}</title>
                              <style>
                                body { font-family: Arial, sans-serif; }
                                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                                th { background-color: #f5f5f5; }
                                .month-header { background-color: #f0f0f0; font-weight: bold; }
                                .total-row { font-weight: bold; }
                              </style>
                            </head>
                            <body>
                              <h1>${t.monthlyPaymentHistory}</h1>
                              <h3>Generated on ${format(
                                new Date(),
                                "MMMM d, yyyy"
                              )}</h3>
                              ${element.outerHTML}
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                        printWindow.print();
                      }
                    }
                  }}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  {t.printMonthlyReport}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto -mx-3 sm:mx-0">
                <div className="min-w-[600px] px-3 sm:px-0">
                  <Table id="monthly-payment-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">
                          {t.month}
                        </TableHead>
                        <TableHead>{t.member}</TableHead>
                        <TableHead>{t.amount}</TableHead>
                        <TableHead>{t.paymentDate}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyPayments.map((monthData) => (
                        <>
                          <TableRow
                            key={monthData.month}
                            className="month-header"
                          >
                            <TableCell colSpan={4}>
                              {monthData.month} - {t.total}:{" "}
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                              }).format(monthData.totalAmount)}{" "}
                              ({monthData.paymentCount} {t.payments})
                            </TableCell>
                          </TableRow>
                          {monthData.members.map((member, index) => (
                            <TableRow key={`${monthData.month}-${index}`}>
                              <TableCell></TableCell>
                              <TableCell>{member.name}</TableCell>
                              <TableCell>
                                {new Intl.NumberFormat("en-US", {
                                  style: "currency",
                                  currency: "USD",
                                }).format(member.amount)}
                              </TableCell>
                              <TableCell>
                                {format(
                                  new Date(member.paid_on),
                                  "MMM d, yyyy"
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "member":
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t.memberPaymentHistory}</CardTitle>
                  <CardDescription>{t.paymentHistoryByMember}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const element = document.getElementById(
                      "member-payment-table"
                    );
                    if (element) {
                      const printWindow = window.open("", "_blank");
                      if (printWindow) {
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>${t.memberPaymentHistory}</title>
                              <style>
                                body { font-family: Arial, sans-serif; }
                                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                                th { background-color: #f5f5f5; }
                                .member-header { background-color: #f0f0f0; font-weight: bold; }
                              </style>
                            </head>
                            <body>
                              <h1>${t.memberPaymentHistory}</h1>
                              <h3>Generated on ${format(
                                new Date(),
                                "MMMM d, yyyy"
                              )}</h3>
                              ${element.outerHTML}
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                        printWindow.print();
                      }
                    }
                  }}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  {t.printMemberReport}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table id="member-payment-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.member}</TableHead>
                      <TableHead>{t.status}</TableHead>
                      <TableHead>{t.totalPayments}</TableHead>
                      <TableHead>{t.lastPayment}</TableHead>
                      <TableHead>{t.totalAmount}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => {
                      const memberPayments = payments.filter(
                        (p) => p.member_id === member.id
                      );
                      const totalAmount = memberPayments.reduce(
                        (sum, p) => sum + p.amount,
                        0
                      );
                      const lastPayment = memberPayments.sort(
                        (a, b) =>
                          new Date(b.paid_on).getTime() -
                          new Date(a.paid_on).getTime()
                      )[0];

                      return (
                        <TableRow key={member.id}>
                          <TableCell>{member.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                member.status === "Active"
                                  ? "default"
                                  : member.status === "Suspended"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {member.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{memberPayments.length}</TableCell>
                          <TableCell>
                            {lastPayment
                              ? format(
                                  new Date(lastPayment.paid_on),
                                  "MMM d, yyyy"
                                )
                              : t.noPayments}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(totalAmount)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );

      case "payment":
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t.paymentDetails}</CardTitle>
                  <CardDescription>{t.detailedPaymentRecords}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const element = document.getElementById(
                      "payment-details-table"
                    );
                    if (element) {
                      const printWindow = window.open("", "_blank");
                      if (printWindow) {
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>${t.paymentDetails}</title>
                              <style>
                                body { font-family: Arial, sans-serif; }
                                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                                th { background-color: #f5f5f5; }
                              </style>
                            </head>
                            <body>
                              <h1>${t.paymentDetails}</h1>
                              <h3>Generated on ${format(
                                new Date(),
                                "MMMM d, yyyy"
                              )}</h3>
                              ${element.outerHTML}
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                        printWindow.print();
                      }
                    }
                  }}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  {t.printPaymentReport}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table id="payment-details-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.date}</TableHead>
                      <TableHead>{t.member}</TableHead>
                      <TableHead>{t.amount}</TableHead>
                      <TableHead>{t.validUntil}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments
                      .sort(
                        (a, b) =>
                          new Date(b.paid_on).getTime() -
                          new Date(a.paid_on).getTime()
                      )
                      .map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {format(new Date(payment.paid_on), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>{payment.member?.name}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(payment.amount)}
                          </TableCell>
                          <TableCell>
                            {format(
                              new Date(payment.active_until),
                              "MMM d, yyyy"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );
    }
  }, [
    selectedReport,
    t,
    payments,
    members,
    monthlyPayments,
    memberStatusData,
    paymentTrends,
  ]);

  if (!t) {
    return (
      <div className="flex justify-center items-center h-96">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 xl:p-10 max-w-7xl mx-auto w-full">
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

          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            <Card className="lg:col-span-2 xl:col-span-2">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[400px] w-full" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[400px] w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return isLoading ||
    !userEmail ||
    (member && member.role !== "admin") ? null : (
    <div className="flex flex-col min-h-screen bg-background">
      <div
        className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 xl:p-10 max-w-7xl mx-auto w-full"
        ref={reportRef}
        id="report-content"
      >
        {/* Header Section - Improved for Desktop */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6 pb-4 border-b">
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
              {t?.reportsTitle || "Reports & Analytics"}
            </h1>
            <p className="text-muted-foreground text-sm lg:text-base">
              {t?.reportsDescription || "Comprehensive insights into your organization's performance"}
            </p>
          </div>
          
          {/* Controls Section - Better organized for desktop */}
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Select
                value={selectedReport}
                onValueChange={(value: ReportType) => setSelectedReport(value)}
              >
                <SelectTrigger className="w-full sm:w-[200px] lg:w-[220px]">
                  <SelectValue placeholder={t.selectReportType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">{t.overviewDashboard}</SelectItem>
                  <SelectItem value="monthly">{t.monthlyReport}</SelectItem>
                  <SelectItem value="member">{t.memberReport}</SelectItem>
                  <SelectItem value="payment">
                    {t.paymentDetailsReport}
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={timeRange}
                onValueChange={(value) =>
                  setTimeRange(value as "week" | "month" | "year")
                }
              >
                <SelectTrigger className="w-full sm:w-[180px] lg:w-[200px]">
                  <SelectValue placeholder={t.selectTimeRange} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">{t.last7Days}</SelectItem>
                  <SelectItem value="month">{t.last30Days}</SelectItem>
                  <SelectItem value="year">{t.last12Months}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 px-3">
                    <Download className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">{t?.export || "Export"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDownloadCSV}>
                    {t.downloadAsCSV}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadPDF}>
                    {t.downloadAsPDF}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t?.print || "Print"}</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="space-y-6">
          {renderReportContent()}
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #report-content,
          #report-content * {
            visibility: visible;
          }
          #report-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 20mm;
          }
        }
      `}</style>
    </div>
  );
}
