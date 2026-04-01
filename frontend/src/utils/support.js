const SUPPORT_EMAIL = "wedguestadmin26@gmail.com";

export function getSupportEmail() {
  return SUPPORT_EMAIL;
}

export function getSupportMailto(subject = "WedGuest Support Request") {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent("Hi WedGuest Support,\n\nPlease help me with:");
  return `mailto:${SUPPORT_EMAIL}?subject=${encodedSubject}&body=${encodedBody}`;
}
