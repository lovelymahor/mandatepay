const colors: Record<string, string> = { PAID: "#16a34a", AWAITING_BUYER: "#2563eb", NEEDS_APPROVAL: "#d97706", BLOCKED: "#dc2626", REJECTED: "#6b7280" };
export default function StatusBadge({ value }: { value: string }) {
  return <span style={{ background: colors[value] ?? "#6b7280", color: "#fff", borderRadius: 12, padding: "2px 10px", fontSize: 12 }}>{value}</span>;
}
