"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { signIn, recoverPassword, updatePassword } from "@/lib/auth-actions";
export function AuthForm({
  recovery = false,
  notice,
}: {
  recovery?: boolean;
  notice?: string;
}) {
  const [forgot, setForgot] = useState(false),
    [pending, start] = useTransition(),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [show, setShow] = useState(false);
  return (
    <>
      <div className="auth-heading">
        <h1>
          {recovery
            ? "Reset password"
            : forgot
              ? "Recover your account"
              : "Sign in to Personal OS"}
        </h1>
        <p>
          {recovery
            ? "Choose a new password for your owner account."
            : forgot
              ? "We’ll send a recovery link to your owner email."
              : "Enter your owner credentials to open your workspace."}
        </p>
      </div>
      {notice && (
        <p className="auth-notice" role="status">
          {notice}
        </p>
      )}
      {message ? (
        <div className="auth-success" role="status">
          <CheckCircle2 size={24} />
          <p>{message}</p>
          <Link
            href="/login"
            data-slot="button"
            className={buttonVariants({ variant: "outline" })}
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const email = String(data.get("email") || ""),
              password = String(data.get("password") || "");
            if (recovery && password !== data.get("confirm")) {
              setError("The passwords do not match.");
              return;
            }
            setError("");
            start(async () => {
              try {
                const result = recovery
                  ? await updatePassword(password)
                  : forgot
                    ? await recoverPassword(email)
                    : await signIn({ email, password });
                if (result?.error) setError(result.error);
                if (result && "message" in result && result.message)
                  setMessage(result.message);
              } catch (e) {
                if (e instanceof Error && e.message === "NEXT_REDIRECT")
                  throw e;
                setError("The connection was interrupted. Please try again.");
              }
            });
          }}
          className="auth-form"
        >
          <FieldSet disabled={pending}>
            <FieldLegend className="sr-only">Owner account details</FieldLegend>
            <FieldGroup>
              {!recovery && (
                <Field>
                  <FieldLabel htmlFor="email">Owner email</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />
                </Field>
              )}
              {!forgot && (
                <Field>
                  <div className="password-label">
                    <FieldLabel htmlFor="password">
                      {recovery ? "New password" : "Password"}
                    </FieldLabel>
                    {!recovery && (
                      <Button
                        variant="link"
                        size="xs"
                        className="forgot-password"
                        type="button"
                        onClick={() => {
                          setForgot(true);
                          setError("");
                        }}
                      >
                        Forgot password?
                      </Button>
                    )}
                  </div>
                  <div className="password-input">
                    <Input
                      id="password"
                      name="password"
                      type={show ? "text" : "password"}
                      autoComplete={
                        recovery ? "new-password" : "current-password"
                      }
                      minLength={recovery ? 12 : 1}
                      maxLength={128}
                      placeholder={
                        recovery
                          ? "At least 12 characters"
                          : "Enter your password"
                      }
                      required
                      aria-describedby={
                        recovery ? "password-requirements" : undefined
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      type="button"
                      onClick={() => setShow((v) => !v)}
                      aria-label={show ? "Hide password" : "Show password"}
                    >
                      {show ? <EyeOff size={17} /> : <Eye size={17} />}
                    </Button>
                  </div>
                  {recovery && (
                    <FieldDescription id="password-requirements">
                      Use at least 12 characters for your new password.
                    </FieldDescription>
                  )}
                </Field>
              )}
              {recovery && (
                <Field>
                  <FieldLabel htmlFor="confirm">
                    Confirm new password
                  </FieldLabel>
                  <Input
                    id="confirm"
                    name="confirm"
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    required
                  />
                </Field>
              )}
            </FieldGroup>
          </FieldSet>
          {error && <FieldError className="form-error">{error}</FieldError>}
          <Button
            size="lg"
            className="auth-submit"
            type="submit"
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : null}
            {pending
              ? "One moment…"
              : recovery
                ? "Update password"
                : forgot
                  ? "Send recovery link"
                  : "Sign in"}
            {!pending && <ArrowRight data-icon="inline-end" />}
          </Button>
          {forgot && (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="auth-back"
              onClick={() => {
                setForgot(false);
                setError("");
              }}
            >
              <ArrowLeft data-icon="inline-start" />
              Back to sign in
            </Button>
          )}
        </form>
      )}
    </>
  );
}
