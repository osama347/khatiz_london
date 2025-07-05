import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // Always show a message to check email for confirmation
  return new Response(
    `
    <html>
      <head><title>Check your email</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 2rem;">
        <h2>Check your email</h2>
        <p>We've sent you a confirmation link. Please check your email to confirm your account.</p>
        <p>If you received a code, you can enter it manually on the confirmation page.</p>
      </body>
    </html>
  `,
    {
      headers: { "Content-Type": "text/html" },
      status: 200,
    }
  );
}
