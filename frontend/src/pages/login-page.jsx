import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthFormShell from "@/components/auth/auth-form-shell";
import AuthInput from "@/components/auth/auth-input";
import AuthLayout from "@/components/auth/auth-layout";
import { useAuth } from "@/context/auth-context";
import { getRoleHomePath } from "@/lib/roles";
import { validateLoginForm } from "@/lib/validation";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [values, setValues] = useState({
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;

    setValues((current) => ({
      ...current,
      [name]: value
    }));

    setErrors((current) => ({
      ...current,
      [name]: ""
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateLoginForm(values);
    setErrors(nextErrors);
    setServerError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await login(values);
      const redirectTo = getRoleHomePath(user?.role);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setServerError(error.details?.[0] || error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to review candidates, coordinate hiring loops, and manage recruiting workflows."
      form={
        <AuthFormShell
          error={serverError}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          submitLabel="Sign in to HireAI"
          footer={
            <>
              New to HireAI?{" "}
              <Link className="text-primary transition hover:text-primary/80" to="/signup">
                Create an account
              </Link>
            </>
          }
        >
          <AuthInput
            autoComplete="email"
            error={errors.email}
            label="Work email"
            name="email"
            onChange={updateField}
            placeholder="team@company.com"
            type="email"
            value={values.email}
          />
          <AuthInput
            autoComplete="current-password"
            error={errors.password}
            label="Password"
            name="password"
            onChange={updateField}
            placeholder="Enter your password"
            type="password"
            value={values.password}
          />
        </AuthFormShell>
      }
    />
  );
}

export default LoginPage;
