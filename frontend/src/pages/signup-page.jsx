import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthFormShell from "@/components/auth/auth-form-shell";
import AuthInput from "@/components/auth/auth-input";
import AuthLayout from "@/components/auth/auth-layout";
import RoleSelector from "@/components/auth/role-selector";
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

  function updateRole(role) {
    setValues((current) => ({ ...current, role }));
    setErrors((current) => ({ ...current, role: "" }));
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

  const roleLabels = {
    candidate: "Create account",
    recruiter: "Create recruiter account",
    interviewer: "Create interviewer account",
  };

  const roleSubtitles = {
    candidate: "Browse published roles and submit applications.",
    recruiter: "Manage job postings, candidates, and hiring pipelines.",
    interviewer: "Access your assigned interviews and candidate profiles.",
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle={roleSubtitles[values.role] || roleSubtitles.candidate}
      form={
        <AuthFormShell
          error={serverError}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          submitLabel={roleLabels[values.role] || "Create account"}
          footer={
            <>
              Already have an account?{" "}
              <Link
                className="text-primary transition hover:text-primary/80"
                to="/login"
              >
                Sign in
              </Link>
            </>
          }
        >
          <RoleSelector value={values.role} onChange={updateRole} />
          {errors.role ? (
            <p className="text-sm text-destructive">{errors.role}</p>
          ) : null}

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
