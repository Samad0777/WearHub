import { useSearchParams } from "react-router-dom";
import { UseVerifyEmail } from "../hook/UseVerifyEmail";
import { useEffect } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

const EmailVerify = () => {
  const { mutate, isError, error, isSuccess, isPending } = UseVerifyEmail();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      mutate(token);
    }
  }, [token, mutate]);

  const state = isSuccess
    ? "success"
    : isError
      ? "error"
      : token
        ? "loading"
        : "missing";
  const content = {
    success: {
      icon: CheckCircle2,
      title: "Email verified",
      message:
        "Your email has been verified successfully. Your WearHub account is ready to use.",
      iconClass: "bg-emerald-600",
    },
    error: {
      icon: AlertCircle,
      title: "Verification failed",
      message:
        error?.message || "This verification link is invalid or has expired.",
      iconClass: "bg-red-600",
    },
    loading: {
      icon: LoaderCircle,
      title: "Verifying your email",
      message: "Please wait while we confirm your email address.",
      iconClass: "bg-black",
    },
    missing: {
      icon: AlertCircle,
      title: "Invalid verification link",
      message:
        "This link is missing the verification token. Please request a new email.",
      iconClass: "bg-red-600",
    },
  }[state];
  const Icon = content.icon;

  return (
    <main className="flex min-h-screen items-center justify-center bg-auth-bg px-4 py-8">
      <section className="w-full max-w-md border-2 bg-white p-6 text-center sm:p-10">
        <div
          className={`mx-auto mb-7 flex h-14 w-14 items-center justify-center rounded-full text-white ${content.iconClass}`}
        >
          <Icon
            size={28}
            aria-hidden="true"
            className={isPending ? "animate-spin" : ""}
          />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{content.title}</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
          {content.message}
        </p>

        {!isPending && (
          <Link
            to={state === "success" ? "/auth" : "/email-resend"}
            className="mt-8 inline-flex items-center gap-2 bg-black px-5 py-3 text-sm font-medium text-white"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            {state === "success" ? "Continue to sign in" : "Request a new link"}
          </Link>
        )}
      </section>
    </main>
  );
};

export default EmailVerify;
