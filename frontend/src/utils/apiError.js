// DRF returns errors in a few different shapes depending on where they come from:
//   { detail: "..." }                      -> auth/permission errors
//   { field_name: ["msg1", "msg2"] }        -> serializer validation errors
//   { non_field_errors: ["msg"] }           -> serializer-level validate() errors
// Previously every api/*.js file only ever read error.response?.data?.detail,
// so field-level validation errors (like the register password mismatch) were
// silently swallowed and the user just saw a generic fallback message.
export function extractErrorMessage(error, fallback = 'Something went wrong') {
  const data = error?.response?.data;

  if (!data) return error?.message || fallback;
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;

  const messages = [];
  Object.entries(data).forEach(([field, value]) => {
    const text = Array.isArray(value) ? value.join(' ') : String(value);
    if (field === 'non_field_errors') {
      messages.push(text);
    } else {
      messages.push(`${field}: ${text}`);
    }
  });

  return messages.length > 0 ? messages.join(' | ') : fallback;
}
