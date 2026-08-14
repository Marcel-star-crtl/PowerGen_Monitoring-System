import React, { useEffect, useState } from 'react';
import { adminAPI } from '@/api/endpoints/admin';
import { useNotification } from '@/contexts/NotificationContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Spinner } from '@/components/common/Spinner';
import { Badge } from '@/components/common/Badge';
import { FiSave, FiAlertTriangle, FiInfo } from 'react-icons/fi';

interface ApprovalStep {
  level: number;
  name: string;
  email: string;
  role: string;
  department: string;
  conditional_ceo_step?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Fuel Request Approval Chain — admin management page.
 *
 * These six people (plus the CEO threshold) previously only lived as
 * hardcoded values in the backend source code. Changing any of them —
 * because someone left, changed role, or changed email — required a code
 * change and a redeploy. In the meantime, every new fuel request would
 * silently email a dead inbox with no visible error, anywhere in a chain
 * that gates real diesel and real money.
 *
 * This page edits models/ApprovalChainConfig.js through
 * PUT /api/admin/approval-chain/fuel-request, which takes effect
 * immediately for every fuel request created after saving — no restart
 * needed.
 */
const ApprovalChainPage: React.FC = () => {
  const { success, error: showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [steps, setSteps] = useState<ApprovalStep[]>([]);
  const [ceoThreshold, setCeoThreshold] = useState(100);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await adminAPI.getApprovalChain();
      const data = res.data;
      setSteps(data.steps);
      setCeoThreshold(data.ceo_liters_threshold ?? 100);
      setIsDefault(!!data.is_default);
      setDirty(false);
    } catch (e: any) {
      showError(e?.response?.data?.error || 'Failed to load approval chain');
    } finally {
      setLoading(false);
    }
  }

  function updateStep(level: number, field: keyof ApprovalStep, value: string) {
    setSteps(prev => prev.map(s => (s.level === level ? { ...s, [field]: value } : s)));
    setDirty(true);
  }

  function validate(): string | null {
    for (const s of steps) {
      if (!s.name.trim() || !s.email.trim() || !s.role.trim() || !s.department.trim()) {
        return `Level ${s.level} (${s.role || 'unnamed step'}) is missing a required field.`;
      }
      if (!EMAIL_RE.test(s.email.trim())) {
        return `Level ${s.level} (${s.name}) has an invalid email address: "${s.email}".`;
      }
    }
    if (!Number.isFinite(ceoThreshold) || ceoThreshold < 0) {
      return 'CEO threshold must be a non-negative number.';
    }
    return null;
  }

  async function handleSave() {
    const validationError = validate();
    if (validationError) {
      showError(validationError);
      return;
    }
    setSaving(true);
    try {
      await adminAPI.updateApprovalChain({ steps, ceo_liters_threshold: ceoThreshold });
      success('Approval chain updated — takes effect immediately for new fuel requests.');
      setIsDefault(false);
      setDirty(false);
    } catch (e: any) {
      showError(e?.response?.data?.error || 'Failed to save approval chain');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fuel Request Approval Chain</h1>
        <p className="text-gray-500 mt-1">
          These are the people every fuel refueling request routes through for approval,
          in order. Changing an approver here takes effect immediately — no deploy needed.
        </p>
      </div>

      {isDefault && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <FiInfo className="mt-0.5 flex-shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            No custom configuration has been saved yet — the values below are the built-in
            defaults. Saving once will switch the system to this admin-managed configuration.
          </p>
        </div>
      )}

      <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <FiAlertTriangle className="mt-0.5 flex-shrink-0 text-blue-600" />
        <p className="text-sm text-blue-800">
          Each step's <strong>role</strong> label (e.g. "Finance Officer") is used by the
          system to identify what that step does — budget checks, disbursement, etc. Only
          change the role text if you know what you're doing. Name, email, and department
          are always safe to update.
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <Card key={step.level} className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="blue">Level {step.level}</Badge>
                <span className="text-sm font-semibold text-gray-700">{step.role}</span>
                {step.conditional_ceo_step && (
                  <Badge variant="yellow">Only when ≥ {ceoThreshold}L</Badge>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Name"
                value={step.name}
                onChange={(e) => updateStep(step.level, 'name', e.target.value)}
                required
              />
              <Input
                label="Email"
                type="email"
                value={step.email}
                onChange={(e) => updateStep(step.level, 'email', e.target.value)}
                required
              />
              <Input
                label="Role"
                value={step.role}
                onChange={(e) => updateStep(step.level, 'role', e.target.value)}
                required
                helperText="Used internally to identify this step's function (e.g. Finance step logic)"
              />
              <Input
                label="Department"
                value={step.department}
                onChange={(e) => updateStep(step.level, 'department', e.target.value)}
                required
              />
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">CEO approval threshold</h3>
            <p className="text-xs text-gray-500 mt-1">
              Requests requesting this many liters or more require the final CEO approval step.
              Requests below this threshold are fully approved at Head of Business.
            </p>
          </div>
          <div className="w-40">
            <Input
              type="number"
              min={0}
              value={ceoThreshold}
              onChange={(e) => { setCeoThreshold(Number(e.target.value)); setDirty(true); }}
            />
          </div>
        </div>
      </Card>

      <div className="mt-6 flex items-center justify-end gap-3">
        {dirty && <span className="text-sm text-amber-600">Unsaved changes</span>}
        <Button variant="secondary" onClick={load} disabled={saving}>
          Reset
        </Button>
        <Button variant="primary" onClick={handleSave} loading={saving} disabled={!dirty}>
          <FiSave className="mr-2" /> Save Changes
        </Button>
      </div>
    </div>
  );
};

export default ApprovalChainPage;
