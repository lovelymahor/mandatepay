import { useEffect, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { api } from "../lib/api";
import StatusBadge from "../components/StatusBadge";

export default function App() {
  const [mandates, setMandates] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [mandateText, setMandateText] = useState("Buy office snacks, max $80 total, nothing over $25, only snacks and beverages, no ShadyDeals.");
  const [request, setRequest] = useState("Order snacks for the team.");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [mandateId, setMandateId] = useState("");

  const refresh = async () => { const [m, o] = await Promise.all([api.mandates(), api.orders()]); setMandates(m); setOrders(o); if (!mandateId && m[0]) setMandateId(m[0].id); };
  useEffect(() => { refresh(); }, []);
  const run = async (fn: () => Promise<any>) => { setBusy(true); try { const r = await fn(); if (r?.reply) setReply(r.reply); } catch (e) { setReply("Error: " + (e as Error).message); } finally { setBusy(false); refresh(); } };

  const pending = orders.filter((o) => o.status === "NEEDS_APPROVAL");
  const payable = orders.filter((o) => o.status === "AWAITING_BUYER");

  return (
    <div style={{ fontFamily: "system-ui", maxWidth: 1000, margin: "0 auto", padding: 24 }}>
      <h1>MandatePay</h1>
      <p>Give your AI agent a spending mandate, not your wallet.</p>

      <h3>1. Mandate</h3>
      <textarea rows={3} style={{ width: "100%" }} value={mandateText} onChange={(e) => setMandateText(e.target.value)} />
      <button disabled={busy} onClick={() => run(async () => { const m = await api.createMandate(mandateText); setMandateId(m.id); })}>Generate mandate</button>{" "}
      <select value={mandateId} onChange={(e) => setMandateId(e.target.value)}>
        {mandates.map((m) => <option key={m.id} value={m.id}>${m.budgetTotal} budget, ${m.spent} spent, auto under ${m.autoApproveBelow}</option>)}
      </select>

      <h3>2. Ask the agent</h3>
      <input style={{ width: "70%" }} value={request} onChange={(e) => setRequest(e.target.value)} />{" "}
      <button disabled={busy || !mandateId} onClick={() => run(() => api.runTask(mandateId, request))}>{busy ? "Working..." : "Run agent"}</button>
      {reply && <p style={{ background: "#f3f4f6", padding: 12, borderRadius: 8 }}>{reply}</p>}

      <h3>3. Approvals</h3>
      {pending.length === 0 && payable.length === 0 && <p>Nothing waiting.</p>}
      {pending.map((o) => (
        <div key={o.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <b>${o.total.toFixed(2)}</b> - {o.items.map((i: any) => i.name).join(", ")}<br /><small>{o.reasons.join(" ")}</small><br />
          <button onClick={() => run(() => api.approve(o.id))}>Approve</button> <button onClick={() => run(() => api.reject(o.id))}>Reject</button>
        </div>
      ))}
      {payable.map((o) => (
        <div key={o.id} style={{ border: "1px solid #bfdbfe", borderRadius: 8, padding: 12, marginBottom: 8 }}>
          Ready to pay ${o.total.toFixed(2)}: <a href={o.approveUrl} target="_blank" rel="noreferrer">Approve in PayPal sandbox</a>{" "}
          <button onClick={() => run(() => api.capture(o.id))}>I approved it, capture</button>
        </div>
      ))}

      <h3>4. Audit log</h3>
      <div className="ag-theme-quartz" style={{ height: 320 }}>
        <AgGridReact rowData={orders} defaultColDef={{ sortable: true, filter: true, resizable: true }} columnDefs={[
          { field: "createdAt", headerName: "Time", width: 190 },
          { field: "total", valueFormatter: (p: any) => "$" + p.value.toFixed(2), width: 100 },
          { field: "status", cellRenderer: (p: any) => <StatusBadge value={p.value} />, width: 170 },
          { field: "explanation", flex: 2 },
          { field: "paypalOrderId", headerName: "PayPal order", width: 170 },
        ]} />
      </div>
    </div>
  );
}
