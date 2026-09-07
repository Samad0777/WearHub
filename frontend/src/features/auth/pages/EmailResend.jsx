import { useState } from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { ArrowLeft, Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const EmailResend = () => {
  const { state } = useLocation();
  const email = state?.email || "your email address";
  const [submitted, setSubmitted] = useState(false);

  const handleResend = () => {
    setSubmitted(true);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-auth-bg px-4 py-8">
      <section className="w-full max-w-md border-2 bg-white p-6 text-center sm:p-10">
        <div className="mx-auto mb-7 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">
          {submitted ? (
            <Check size={24} aria-hidden="true" />
          ) : (
            <Mail size={24} aria-hidden="true" />
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Check your email</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          We sent a verification email to
        </p>
        <p className="mt-1 wrap-break font-semibold">{email}</p>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Click the link in the email to verify your account and finish signing
          up.
        </p>

        {submitted && (
          <p role="status" className="mt-6 text-sm text-green-700">
            A new verification email has been sent.
          </p>
        )}

        <p className="mt-8 text-sm text-muted-foreground">
          Didn&apos;t receive it?{" "}
          <Button
            type="button"
            variant="link"
            onClick={handleResend}
            className="h-auto cursor-pointer p-0 font-semibold text-foreground underline underline-offset-4"
          >
            Resend email
          </Button>
        </p>

        <Link
          to="/auth"
          className="mt-7 inline-flex items-center gap-2 text-sm underline underline-offset-4"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to sign in
        </Link>
      </section>
    </main>
  );
};

export default EmailResend;
