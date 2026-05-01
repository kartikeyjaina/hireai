import validator from "validator";

// Roles that can be self-selected during public signup.
// Admin accounts must be created by an existing admin via the user management API.
const PUBLIC_SIGNUP_ROLES = ["candidate", "recruiter", "interviewer"];

function normalizeWhitespace(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateSignup(body) {
  const firstName = normalizeWhitespace(body.firstName);
  const lastName = normalizeWhitespace(body.lastName);
  const email = normalizeWhitespace(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const role = normalizeWhitespace(body.role).toLowerCase() || "candidate";
  const errors = [];

  if (firstName.length < 2) {
    errors.push("First name must be at least 2 characters");
  }

  if (lastName.length < 2) {
    errors.push("Last name must be at least 2 characters");
  }

  if (!validator.isEmail(email)) {
    errors.push("Enter a valid email address");
  }

  if (!validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 0
  })) {
    errors.push("Password must be at least 8 characters and include uppercase, lowercase, and a number");
  }

  if (!PUBLIC_SIGNUP_ROLES.includes(role)) {
    errors.push(`Role must be one of: ${PUBLIC_SIGNUP_ROLES.join(", ")}`);
  }

  return errors.length
    ? { success: false, errors }
    : {
        success: true,
        data: {
          firstName,
          lastName,
          email,
          password,
          role
        }
      };
}

export function validateLogin(body) {
  const email = normalizeWhitespace(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const errors = [];

  if (!validator.isEmail(email)) {
    errors.push("Enter a valid email address");
  }

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }

  return errors.length
    ? { success: false, errors }
    : {
        success: true,
        data: {
          email,
          password
        }
      };
}
