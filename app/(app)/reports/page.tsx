"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
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
import { Download, Printer } from "lucide-react";
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

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [timeRange, setTimeRange] = useState("month");
  const [monthlyPayments, setMonthlyPayments] = useState<MonthlyPayment[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportType>("overview");
  const supabase = createClient();
  const reportRef = useRef<HTMLDivElement>(null);

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
            member:members(name)
          `
          )
          .order("paid_on", { ascending: false });

        if (paymentsError) {
          console.error("Payments error:", paymentsError);
          toast.error(`Failed to load payments: ${paymentsError.message}`);
          return;
        }

        // Fetch members
        const { data: membersData, error: membersError } = await supabase
          .from("members")
          .select("id, name, status, join_date")
          .order("join_date", { ascending: false });

        if (membersError) {
          console.error("Members error:", membersError);
          toast.error(`Failed to load members: ${membersError.message}`);
          return;
        }

        if (!paymentsData || !membersData) {
          toast.error("No data received from the server");
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
          error instanceof Error ? error.message : "Failed to load data"
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  // Calculate total revenue
  const totalRevenue = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  // Calculate average payment amount
  const averagePayment =
    payments.length > 0 ? totalRevenue / payments.length : 0;

  // Calculate member statistics
  const activeMembers = members.filter((m) => m.status === "Active").length;
  const inactiveMembers = members.filter((m) => m.status === "Inactive").length;
  const suspendedMembers = members.filter(
    (m) => m.status === "Suspended"
  ).length;

  // Prepare data for payment trends chart
  const getPaymentTrendsData = () => {
    const now = new Date();
    const data = [];
    let startDate: Date;

    switch (timeRange) {
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        for (let i = 0; i < 7; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          const dayPayments = payments.filter(
            (p) =>
              format(new Date(p.paid_on), "yyyy-MM-dd") ===
              format(date, "yyyy-MM-dd")
          );
          data.push({
            date: format(date, "EEE"),
            amount: dayPayments.reduce((sum, p) => sum + p.amount, 0),
          });
        }
        break;
      case "month":
        startDate = new Date(now.setDate(now.getDate() - 30));
        for (let i = 0; i < 30; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          const dayPayments = payments.filter(
            (p) =>
              format(new Date(p.paid_on), "yyyy-MM-dd") ===
              format(date, "yyyy-MM-dd")
          );
          data.push({
            date: format(date, "MMM dd"),
            amount: dayPayments.reduce((sum, p) => sum + p.amount, 0),
          });
        }
        break;
      case "year":
        startDate = new Date(now.setMonth(now.getMonth() - 12));
        for (let i = 0; i < 12; i++) {
          const date = new Date(startDate);
          date.setMonth(date.getMonth() + i);
          const monthPayments = payments.filter(
            (p) =>
              format(new Date(p.paid_on), "yyyy-MM") === format(date, "yyyy-MM")
          );
          data.push({
            date: format(date, "MMM yyyy"),
            amount: monthPayments.reduce((sum, p) => sum + p.amount, 0),
          });
        }
        break;
    }

    return data;
  };

  // Prepare data for member status pie chart
  const memberStatusData = [
    { name: "Active", value: activeMembers },
    { name: "Inactive", value: inactiveMembers },
    { name: "Suspended", value: suspendedMembers },
  ];

  // Prepare data for top paying members
  const topPayingMembers = Object.entries(
    payments.reduce((acc: { [key: string]: number }, payment) => {
      const memberName = payment.member?.name || "Unknown";
      acc[memberName] = (acc[memberName] || 0) + payment.amount;
      return acc;
    }, {})
  )
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      // This will be implemented once react-to-pdf is installed
      toast.info(
        "PDF download functionality will be available after installing required packages"
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report");
    }
  };

  const handleDownloadCSV = () => {
    try {
      // Prepare data for CSV
      const csvData = [
        // Header row
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
        [], // Empty row
        ["Top Paying Members"],
        ...topPayingMembers.map((member) => [
          member.name,
          new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(member.amount),
        ]),
      ];

      // Convert to CSV string
      const csvContent = csvData.map((row) => row.join(",")).join("\n");

      // Create and trigger download
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
  };

  // Function to process payments into monthly data
  const processMonthlyPayments = (payments: Payment[]): MonthlyPayment[] => {
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
  };

  const renderReportContent = () => {
    switch (selectedReport) {
      case "overview":
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(totalRevenue)}
                  </div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Average Payment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(averagePayment)}
                  </div>
                  <p className="text-xs text-muted-foreground">Per payment</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeMembers}</div>
                  <p className="text-xs text-muted-foreground">
                    Current active members
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{members.length}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Trends</CardTitle>
                  <CardDescription>Payment amounts over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getPaymentTrendsData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip
                          formatter={(value: number) =>
                            new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(value)
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="#8884d8"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Member Status Distribution</CardTitle>
                  <CardDescription>
                    Current member status breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
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
                          outerRadius={80}
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
                        <Tooltip />
                      </PieChart>
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
                  <CardTitle>Monthly Payment History</CardTitle>
                  <CardDescription>
                    Detailed payment history by month
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
                              <title>Monthly Payment History</title>
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
                              <h1>Monthly Payment History</h1>
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
                  Print Monthly Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table id="monthly-payment-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Date</TableHead>
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
                            {monthData.month} - Total:{" "}
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(monthData.totalAmount)}{" "}
                            ({monthData.paymentCount} payments)
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
                              {format(new Date(member.paid_on), "MMM d, yyyy")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    ))}
                  </TableBody>
                </Table>
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
                  <CardTitle>Member Payment History</CardTitle>
                  <CardDescription>Payment history by member</CardDescription>
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
                              <title>Member Payment History</title>
                              <style>
                                body { font-family: Arial, sans-serif; }
                                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                                th { background-color: #f5f5f5; }
                                .member-header { background-color: #f0f0f0; font-weight: bold; }
                              </style>
                            </head>
                            <body>
                              <h1>Member Payment History</h1>
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
                  Print Member Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table id="member-payment-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total Payments</TableHead>
                      <TableHead>Last Payment</TableHead>
                      <TableHead>Total Amount</TableHead>
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
                              : "No payments"}
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
                  <CardTitle>Payment Details</CardTitle>
                  <CardDescription>Detailed payment records</CardDescription>
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
                              <title>Payment Details</title>
                              <style>
                                body { font-family: Arial, sans-serif; }
                                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                                th { background-color: #f5f5f5; }
                              </style>
                            </head>
                            <body>
                              <h1>Payment Details</h1>
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
                  Print Payment Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table id="payment-details-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Valid Until</TableHead>
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
  };

  if (loading) {
    return (
      <div className="flex flex-col">
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

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div
        className="flex-1 space-y-4 p-4 md:p-8"
        ref={reportRef}
        id="report-content"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Select
              value={selectedReport}
              onValueChange={(value: ReportType) => setSelectedReport(value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview Dashboard</SelectItem>
                <SelectItem value="monthly">Monthly Report</SelectItem>
                <SelectItem value="member">Member Report</SelectItem>
                <SelectItem value="payment">Payment Details</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="year">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleDownloadCSV}>
                  Download as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadPDF}>
                  Download as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {renderReportContent()}
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
