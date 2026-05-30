export const SESSION_COOKIE_NAME = "__engniter_session";
export const DEFAULT_REDIRECT_PATH = "/opportunities";

export function getAllowedEmailDomains(rawValue = process.env.AUTH_ALLOWED_EMAIL_DOMAINS ?? "") {
  return rawValue
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function hasAllowedEmailDomain(
  email: string | null | undefined,
  allowedDomains = getAllowedEmailDomains(),
) {
  if (!email) {
    return false;
  }

  if (allowedDomains.length === 0) {
    return false;
  }

  const domain = email.split("@")[1]?.toLowerCase();

  return Boolean(domain && allowedDomains.includes(domain));
}

export function getSafeRedirectPath(candidate?: string | null) {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return DEFAULT_REDIRECT_PATH;
  }

  return candidate;
}
