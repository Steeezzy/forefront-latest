"use client";

import { useEffect, useState } from "react";
import { CalendarPlus2, Loader2, MessageSquareText, UserRoundPlus } from "lucide-react";
import { coreApi } from "@/lib/api";
import { resolveWorkspaceSession } from "@/lib/workspace-session";

type TabKey = "customers" | "appointments" | "orchestrator";

function toLocalDateTimeInputValue(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (value: number) => String(value).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function WorkspaceCorePage() {
  const [workspaceId, setWorkspaceId] = useState("");
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("customers");

  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [createdCustomer, setCreatedCustomer] = useState<any | null>(null);
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const [lookupPhone, setLookupPhone] = useState("");
  const [lookingUpCustomer, setLookingUpCustomer] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookedUpCustomer, setLookedUpCustomer] = useState<any | null>(null);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentError, setAppointmentError] = useState<string | null>(null);
  const [creatingAppointment, setCreatingAppointment] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    customer_id: "",
    service: "",
    date: "",
    notes: "",
  });

  const [runningOrchestrator, setRunningOrchestrator] = useState(false);
  const [orchestratorError, setOrchestratorError] = useState<string | null>(null);
  const [latestOrchestratorResult, setLatestOrchestratorResult] = useState<any | null>(null);
  const [turnHistory, setTurnHistory] = useState<any[]>([]);
  const [orchestratorForm, setOrchestratorForm] = useState({
    message: "",
    customer_phone: "",
    customer_name: "",
  });

  const loadAppointments = async (id: string) => {
    setAppointmentsLoading(true);
    setAppointmentError(null);

    try {
      const result = await coreApi.listAppointments(id, 50);
      setAppointments(result.data || []);
    } catch (error: any) {
      setAppointmentError(error.message || "Failed to load appointments");
    } finally {
      setAppointmentsLoading(false);
    }
  };

  useEffect(() => {
    const initializeWorkspace = async () => {
      try {
        const session = await resolveWorkspaceSession();
        setWorkspaceId(session.workspaceId);
        await loadAppointments(session.workspaceId);
      } catch (error: any) {
        setInitError(error.message || "Failed to resolve workspace session");
      } finally {
        setInitializing(false);
      }
    };

    void initializeWorkspace();
  }, []);

  const handleCreateCustomer = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!workspaceId) {
      return;
    }

    setCreatingCustomer(true);
    setCustomerError(null);

    try {
      const result = await coreApi.createCustomer({
        workspace_id: workspaceId,
        name: customerForm.name || undefined,
        phone: customerForm.phone || undefined,
        email: customerForm.email || undefined,
      });

      setCreatedCustomer(result.data);
      setCustomerForm({ name: "", phone: "", email: "" });
    } catch (error: any) {
      setCustomerError(error.message || "Failed to create customer");
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleLookupCustomer = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!workspaceId || !lookupPhone.trim()) {
      return;
    }

    setLookingUpCustomer(true);
    setLookupError(null);

    try {
      const result = await coreApi.getCustomerByPhone(workspaceId, lookupPhone.trim());
      setLookedUpCustomer(result.data || null);
    } catch (error: any) {
      setLookupError(error.message || "Customer not found");
      setLookedUpCustomer(null);
    } finally {
      setLookingUpCustomer(false);
    }
  };

  const handleCreateAppointment = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!workspaceId || !appointmentForm.service || !appointmentForm.date) {
      return;
    }

    setCreatingAppointment(true);
    setAppointmentError(null);

    try {
      const isoDate = new Date(appointmentForm.date).toISOString();
      await coreApi.createAppointment({
        workspace_id: workspaceId,
        customer_id: appointmentForm.customer_id || undefined,
        service: appointmentForm.service,
        date: isoDate,
        notes: appointmentForm.notes || undefined,
      });

      setAppointmentForm({ customer_id: "", service: "", date: "", notes: "" });
      await loadAppointments(workspaceId);
    } catch (error: any) {
      setAppointmentError(error.message || "Failed to create appointment");
    } finally {
      setCreatingAppointment(false);
    }
  };

  const handleRunOrchestrator = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!workspaceId || !orchestratorForm.message.trim()) {
      return;
    }

    setRunningOrchestrator(true);
    setOrchestratorError(null);

    try {
      const result = await coreApi.executeOrchestratorTurn({
        workspace_id: workspaceId,
        message: orchestratorForm.message.trim(),
        channel: "chat",
        customer_phone: orchestratorForm.customer_phone || undefined,
        customer_name: orchestratorForm.customer_name || undefined,
      });

      setLatestOrchestratorResult(result.data || null);
      setTurnHistory((current) => [result.data, ...current].slice(0, 5));
    } catch (error: any) {
      setOrchestratorError(error.message || "Failed to execute orchestrator turn");
    } finally {
      setRunningOrchestrator(false);
    }
  };

  if (initializing) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Resolving workspace session...
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {initError}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[#f4f4f5] min-h-[calc(100vh-64px)]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workspace Core</h1>
          <p className="text-sm text-gray-500 mt-1">
            Run workspace-scoped customer, appointment, and orchestrator flows against the new core APIs.
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600">
          Workspace: {workspaceId}
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { key: "customers", label: "Customers", icon: UserRoundPlus },
          { key: "appointments", label: "Appointments", icon: CalendarPlus2 },
          { key: "orchestrator", label: "AI Orchestrator", icon: MessageSquareText },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "customers" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <form onSubmit={handleCreateCustomer} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Create Customer</h2>
            <input
              value={customerForm.name}
              onChange={(event) => setCustomerForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Name"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              value={customerForm.phone}
              onChange={(event) => setCustomerForm((current) => ({ ...current, phone: event.target.value }))}
              placeholder="Phone"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              value={customerForm.email}
              onChange={(event) => setCustomerForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />

            {customerError && <p className="text-xs text-red-600">{customerError}</p>}

            <button
              type="submit"
              disabled={creatingCustomer}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {creatingCustomer && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Customer
            </button>

            {createdCustomer && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                Created customer {createdCustomer.id}
              </div>
            )}
          </form>

          <form onSubmit={handleLookupCustomer} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Lookup by Phone</h2>
            <input
              value={lookupPhone}
              onChange={(event) => setLookupPhone(event.target.value)}
              placeholder="Enter phone number"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />

            {lookupError && <p className="text-xs text-red-600">{lookupError}</p>}

            <button
              type="submit"
              disabled={lookingUpCustomer}
              className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
            >
              {lookingUpCustomer && <Loader2 className="h-4 w-4 animate-spin" />}
              Lookup Customer
            </button>

            {lookedUpCustomer && (
              <pre className="rounded-lg bg-gray-900 p-3 text-xs text-gray-100 overflow-x-auto">
                {JSON.stringify(lookedUpCustomer, null, 2)}
              </pre>
            )}
          </form>
        </div>
      )}

      {activeTab === "appointments" && (
        <div className="grid gap-4 lg:grid-cols-[340px,1fr]">
          <form onSubmit={handleCreateAppointment} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Create Appointment</h2>
            <input
              value={appointmentForm.customer_id}
              onChange={(event) => setAppointmentForm((current) => ({ ...current, customer_id: event.target.value }))}
              placeholder="Customer ID (optional)"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              value={appointmentForm.service}
              onChange={(event) => setAppointmentForm((current) => ({ ...current, service: event.target.value }))}
              placeholder="Service"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              type="datetime-local"
              value={appointmentForm.date}
              onChange={(event) => setAppointmentForm((current) => ({ ...current, date: event.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <textarea
              value={appointmentForm.notes}
              onChange={(event) => setAppointmentForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Notes (optional)"
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />

            {appointmentError && <p className="text-xs text-red-600">{appointmentError}</p>}

            <button
              type="submit"
              disabled={creatingAppointment}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {creatingAppointment && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Appointment
            </button>
          </form>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Recent Appointments</h2>
              <button
                onClick={() => loadAppointments(workspaceId)}
                className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs text-gray-600"
              >
                Refresh
              </button>
            </div>

            {appointmentsLoading ? (
              <div className="text-sm text-gray-500 inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading appointments...
              </div>
            ) : appointments.length === 0 ? (
              <p className="text-sm text-gray-500">No appointments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                      <th className="py-2 pr-3">Service</th>
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appointment) => (
                      <tr key={appointment.id} className="border-b border-gray-50">
                        <td className="py-2 pr-3 text-gray-800">{appointment.service}</td>
                        <td className="py-2 pr-3 text-gray-600">{toLocalDateTimeInputValue(appointment.date)}</td>
                        <td className="py-2 pr-3 text-gray-600">{appointment.status || "scheduled"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "orchestrator" && (
        <div className="grid gap-4 lg:grid-cols-[380px,1fr]">
          <form onSubmit={handleRunOrchestrator} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Run Core Orchestrator Turn</h2>
            <textarea
              value={orchestratorForm.message}
              onChange={(event) => setOrchestratorForm((current) => ({ ...current, message: event.target.value }))}
              placeholder="Enter customer message"
              rows={4}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              value={orchestratorForm.customer_phone}
              onChange={(event) => setOrchestratorForm((current) => ({ ...current, customer_phone: event.target.value }))}
              placeholder="Customer phone (optional)"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              value={orchestratorForm.customer_name}
              onChange={(event) => setOrchestratorForm((current) => ({ ...current, customer_name: event.target.value }))}
              placeholder="Customer name (optional)"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />

            {orchestratorError && <p className="text-xs text-red-600">{orchestratorError}</p>}

            <button
              type="submit"
              disabled={runningOrchestrator}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {runningOrchestrator && <Loader2 className="h-4 w-4 animate-spin" />}
              Execute Turn
            </button>
          </form>

          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Latest Result</h2>
            {latestOrchestratorResult ? (
              <pre className="rounded-lg bg-gray-900 p-3 text-xs text-gray-100 overflow-x-auto">
                {JSON.stringify(latestOrchestratorResult, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-gray-500">No orchestrator turns executed yet.</p>
            )}

            {turnHistory.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Recent Turns</h3>
                <div className="space-y-2">
                  {turnHistory.map((turn, index) => (
                    <div key={`${turn?.event?.id || index}`} className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700">
                      <p><strong>Intent:</strong> {turn?.ai_output?.intent || "unknown"}</p>
                      <p><strong>Action:</strong> {turn?.action_result?.action || "no-op"}</p>
                      <p><strong>Response:</strong> {turn?.response || "-"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
