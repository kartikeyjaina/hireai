import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthFormShell from "@/components/auth/auth-form-shell";
import AuthInput from "@/components/auth/auth-input";
import AuthLayout from "@/components/auth/auth-layout";
import { useAuth } from "@/context/auth-context";
import { getRoleHomePath } from "@/lib/roles";
import { validateSignupForm } from "@/lib/validation";

function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "candidate",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;

    setValues((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateSignupForm(values);
    setErrors(nextErrors);
    setServerError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await signup(values);
      navigate(getRoleHomePath(user?.role), { replace: true });
    } catch (error) {
      setServerError(error.details?.[0] || error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your candidate account"
      subtitle="Set up a secure profile so you can browse published roles and submit applications."
      form={
        <AuthFormShell
          error={serverError}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          submitLabel="Create candidate account"
          footer={
            <>
              Already have access?{" "}
              <Link
                className="text-primary transition hover:text-primary/80"
                to="/login"
              >
                Sign in
              </Link>
            </>
          }
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <AuthInput
              autoComplete="given-name"
              error={errors.firstName}
              label="First name"
              name="firstName"
              onChange={updateField}
              placeholder="Ava"
              type="text"
              value={values.firstName}
            />
            <AuthInput
              autoComplete="family-name"
              error={errors.lastName}
              label="Last name"
              name="lastName"
              onChange={updateField}
              placeholder="Thompson"
              type="text"
              value={values.lastName}
            />
          </div>
          <AuthInput
            autoComplete="email"
            error={errors.email}
            label="Email"
            name="email"
            onChange={updateField}
            placeholder="you@example.com"
            type="email"
            value={values.email}
          />
          <AuthInput
            autoComplete="new-password"
            error={errors.password}
            label="Password"
            name="password"
            onChange={updateField}
            placeholder="At least 8 characters"
            type="password"
            value={values.password}
          />
        </AuthFormShell>
      }
    />
  );
}

export default SignupPage;
