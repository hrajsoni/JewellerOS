"use client";

import React, { useState, useEffect } from "react";
import { History, Shield, RefreshCw, Clock } from "lucide-react";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/audit-logs");
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Platform Audit Trail
            <span className="text-xs font-mono font-normal bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
              Immutable Log
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Comprehensive audit record of all Super Admin actions, entitlement overrides, plan changes, and system events.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition-colors border border-slate-700 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-400" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-medium">Action & Event</th>
                <th className="py-3 px-4 font-medium">Target Entity</th>
                <th className="py-3 px-4 font-medium">Initiator</th>
                <th className="py-3 px-4 font-medium">Timestamp</th>
                <th className="py-3 px-4 font-medium">Context Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-amber-400 font-bold">{log.action}</td>
                  <td className="py-3 px-4 text-slate-300">
                    {log.targetType}: {log.targetId.slice(0, 18)}
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-sans">
                    {log.admin?.name || "System Automated"}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-sans text-xs">
                    {new Date(log.createdAt).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-sans text-xs">
                    {log.details?.reason || log.details?.planName || JSON.stringify(log.details || {})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
