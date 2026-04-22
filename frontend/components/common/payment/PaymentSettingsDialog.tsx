'use client';

import {useEffect, useState} from 'react';
import {toast} from 'sonner';
import {Save, Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Dialog, DialogContent, DialogDescription, DialogTitle} from '@/components/ui/dialog';
import services from '@/lib/services';
import {PaymentConfigData} from '@/lib/services/payment';
import {PaymentSettingsContent} from './PaymentSettingsContent';

interface PaymentSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentSettingsDialog({
  open,
  onOpenChange,
}: PaymentSettingsDialogProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [config, setConfig] = useState<PaymentConfigData | null>(null);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await services.payment.getConfigSafe();
    if (res.success && res.data) {
      setConfig(res.data);
      setClientId(res.data.client_id || '');
    } else {
      toast.error(res.error || '加载失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      load();
    }
  }, [open]);

  const handleSave = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      toast.error('请填写 Client ID 与 Client Secret');
      return;
    }
    setSaving(true);
    const res = await services.payment.updateConfigSafe({
      client_id: clientId.trim(),
      client_secret: clientSecret.trim(),
    });
    setSaving(false);
    if (res.success) {
      toast.success('已保存');
      setClientSecret('');
      load();
    } else {
      toast.error(res.error || '保存失败');
    }
  };

  const handleDelete = async () => {
    if (!confirm('确认删除支付配置?')) return;
    setDeleting(true);
    const res = await services.payment.deleteConfigSafe();
    setDeleting(false);
    if (res.success) {
      toast.success('已删除');
      setConfig(null);
      setClientId('');
      setClientSecret('');
      load();
    } else {
      toast.error(res.error || '删除失败');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="rounded-[24px] border border-border/50 bg-background/95 p-0 shadow-[0_24px_60px_rgba(15,23,42,0.10)] ring-1 ring-black/[0.03] dark:bg-background dark:shadow-[0_24px_60px_rgba(0,0,0,0.42)] dark:ring-white/[0.04]"
      >
        <div className="px-6 pt-4">
          <div className="min-w-0">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              支付设置
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-muted-foreground">
              配置你在 LDC 积分系统的商户凭据,用于接收他人领取付费项目的付款
            </DialogDescription>
          </div>
        </div>

        <div className="px-6">
          <PaymentSettingsContent
            loading={loading}
            config={config}
            clientId={clientId}
            clientSecret={clientSecret}
            onClientIdChange={setClientId}
            onClientSecretChange={setClientSecret}
          />
        </div>

        <div className="flex items-center justify-end gap-2 -mt-4 px-4 py-4">
          {config?.has_config && (
            <Button variant="destructive" onClick={handleDelete} disabled={deleting || loading} size="sm">
              <Trash2 className="size-3" />
              {deleting ? '删除中...' : '移除'}
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || loading} size="sm">
            <Save className="size-3" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
