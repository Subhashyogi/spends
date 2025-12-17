"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { safeJson } from "@/lib/http";
import { Plus, Trash2, Zap, AlertTriangle, CheckCircle, Tag } from "lucide-react";

type Rule = {
    id: string;
    name: string;
    condition: {
        field: 'category' | 'amount' | 'time';
        operator: 'equals' | 'gt' | 'lt';
        value: any;
    };
    action: {
        type: 'tag' | 'confirm' | 'alert';
        value?: string;
    };
    enabled: boolean;
};

export default function RulesManager() {
    const [rules, setRules] = useState<Rule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [field, setField] = useState<'category' | 'amount' | 'time'>("amount");
    const [operator, setOperator] = useState<'equals' | 'gt' | 'lt'>("gt");
    const [value, setValue] = useState("");
    const [actionType, setActionType] = useState<'tag' | 'confirm' | 'alert'>("confirm");
    const [actionValue, setActionValue] = useState("");

    useEffect(() => {
        loadRules();
    }, []);

    async function loadRules() {
        try {
            const res = await fetch("/api/rules");
            const { ok, data } = await safeJson(res);
            if (ok) setRules(data.data || data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function addRule(e: React.FormEvent) {
        e.preventDefault();
        try {
            const res = await fetch("/api/rules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    condition: { field, operator, value },
                    action: { type: actionType, value: actionValue }
                })
            });
            if (res.ok) {
                setShowForm(false);
                resetForm();
                loadRules();
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function deleteRule(id: string) {
        if (!confirm("Delete this rule?")) return;
        try {
            await fetch(`/api/rules?id=${id}`, { method: "DELETE" });
            setRules(rules.filter(r => r.id !== id));
        } catch (e) {
            console.error(e);
        }
    }

    function resetForm() {
        setName("");
        setField("amount");
        setOperator("gt");
        setValue("");
        setActionType("confirm");
        setActionValue("");
    }

    if (loading) return <div className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />;

    return (
        <div className="glass rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        <Zap className="h-5 w-5 text-indigo-500" />
                        Automation Rules
                    </h3>
                    <p className="text-sm text-zinc-500">Automate your transaction workflow</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400"
                >
                    <Plus className="h-3 w-3" /> New Rule
                </button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.form
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="glass mb-4 overflow-hidden rounded-xl p-4"
                        onSubmit={addRule}
                    >
                        <div className="grid gap-3 sm:grid-cols-2">
                            <input
                                placeholder="Rule Name (e.g. High Spend Alert)"
                                className="glass col-span-2 rounded-lg px-3 py-2 text-sm"
                                value={name} onChange={e => setName(e.target.value)} required
                            />

                            {/* Condition */}
                            <div className="col-span-2 flex items-center gap-2 text-sm text-zinc-500">
                                <span>If</span>
                                <select
                                    className="glass rounded-lg px-2 py-1"
                                    value={field} onChange={e => setField(e.target.value as any)}
                                >
                                    <option value="amount">Amount</option>
                                    <option value="category">Category</option>
                                    <option value="time">Time (Hour 0-23)</option>
                                </select>
                                <select
                                    className="glass rounded-lg px-2 py-1"
                                    value={operator} onChange={e => setOperator(e.target.value as any)}
                                >
                                    <option value="gt">Greater Than</option>
                                    <option value="lt">Less Than</option>
                                    <option value="equals">Equals</option>
                                </select>
                                <input
                                    placeholder="Value"
                                    className="glass w-24 rounded-lg px-2 py-1"
                                    value={value} onChange={e => setValue(e.target.value)} required
                                />
                            </div>

                            {/* Action */}
                            <div className="col-span-2 flex items-center gap-2 text-sm text-zinc-500">
                                <span>Then</span>
                                <select
                                    className="glass rounded-lg px-2 py-1"
                                    value={actionType} onChange={e => setActionType(e.target.value as any)}
                                >
                                    <option value="confirm">Ask Confirmation</option>
                                    <option value="alert">Show Alert</option>
                                    <option value="tag">Add Tag</option>
                                </select>
                                {actionType === 'tag' && (
                                    <input
                                        placeholder="Tag Name"
                                        className="glass w-32 rounded-lg px-2 py-1"
                                        value={actionValue} onChange={e => setActionValue(e.target.value)} required
                                    />
                                )}
                            </div>
                        </div>
                        <div className="mt-3 flex justify-end gap-2">
                            <button type="button" onClick={() => setShowForm(false)} className="text-xs text-zinc-500 hover:text-zinc-900">Cancel</button>
                            <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500">Save Rule</button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="space-y-2">
                {rules.length === 0 ? (
                    <p className="text-center text-sm text-zinc-500">No rules configured.</p>
                ) : (
                    rules.map(rule => (
                        <div key={rule.id} className="glass flex items-center justify-between rounded-xl p-3">
                            <div className="flex items-center gap-3">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${rule.action.type === 'alert' ? 'bg-red-100 text-red-500' :
                                    rule.action.type === 'confirm' ? 'bg-amber-100 text-amber-500' :
                                        'bg-blue-100 text-blue-500'
                                    }`}>
                                    {rule.action.type === 'alert' && <AlertTriangle className="h-4 w-4" />}
                                    {rule.action.type === 'confirm' && <CheckCircle className="h-4 w-4" />}
                                    {rule.action.type === 'tag' && <Tag className="h-4 w-4" />}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{rule.name}</div>
                                    <div className="text-xs text-zinc-500">
                                        If {rule.condition.field} {rule.condition.operator} {rule.condition.value} → {rule.action.type} {rule.action.value}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => deleteRule(rule.id)} className="text-zinc-400 hover:text-red-500">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
