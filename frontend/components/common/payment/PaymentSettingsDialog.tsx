'use client';

import {useEffect, useState} from 'react';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
    setDeleting(true);
    const res = await services.payment.deleteConfigSafe();
    setDeleting(false);
    if (res.success) {
      setDeleteDialogOpen(false);
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
      >
        <DialogHeader>
          <DialogTitle>
            支付设置
          </DialogTitle>
          <DialogDescription>
            配置你在 LDC 积分系统的商户凭据,用于接收他人领取付费项目的付款
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="max-h-[min(72vh,560px)]">
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
        </DialogBody>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            size="sm"
            className="rounded-full px-3 text-xs shadow-none"
          >
            取消
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving || loading}
            size="sm"
            className="rounded-full px-3 text-xs shadow-none"
          >
            {saving ? '保存中...' : '保存'}
          </Button>

          {config?.has_config && (
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deleting || loading}
                size="sm"
                className="rounded-full px-3 text-xs shadow-none"
              >
                {deleting ? '删除中...' : '移除'}
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    移除商户配置
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    移除后将清空当前保存的 Client ID 与 Client Secret。后续如需使用付费项目功能，需要重新配置。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>
                    取消
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="h-8 rounded-full bg-destructive px-3 text-xs text-white shadow-none hover:bg-destructive/90"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? '移除中...' : '确认移除'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
