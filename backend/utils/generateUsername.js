function generateFromEmail(email) {
  if (!email || typeof email !== "string") return null;

  return email
    .trim()
    .toLowerCase()
    .split("@")[0]
    .replace(/[^a-z0-9._-]/g, "");
}

module.exports = {
  generateFromEmail,
};
