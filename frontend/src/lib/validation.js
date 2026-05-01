const VALID_ROLES = ["admin", "recruiter", "interviewer"];

export function validateLoginForm(values) {
  const errors = {};

  if (!values.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address";
  }

  if (!values.password) {
    errors.password = "Password is required";
  } else if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  return errors;
}

export function validateSignupForm(values) {
  const errors = validateLoginForm(values);

  if (!values.firstName.trim() || values.firstName.trim().length < 2) {
    errors.firstName = "First name must be at least 2 characters";
  }

  if (!values.lastName.trim() || values.lastName.trim().length < 2) {
    errors.lastName = "Last name must be at least 2 characters";
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(values.password)) {
    errors.password =
      "Password must include uppercase, lowercase, and a number";
  }

  if (!VALID_ROLES.includes(values.role)) {
    errors.role = "Select a valid role";
  }

  return errors;
}
