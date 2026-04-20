'use client';

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Skeleton} from '@/components/ui/skeleton';
import {toast} from 'sonner';
import {ArrowLeftIcon, Save, Trash2} from 'lucide-react';
import services from '@/lib/services';
import {PaymentConfigData} from '@/lib/services/payment';
import {CallbackURLHint} from '@/components/common/payment/CallbackURLHint';

/**
 * 支付设置页面:
 *  - CallbackURLHint 展示并一键复制 notify_url / return_url
 *  - 表单:clientID + clientSecret(可部分更新:填空 secret 会被 API 拒绝保存)
 *  - 危险区:删除配置(后端若存在未结束付费项目会拒绝)
 */
export function PaymentSettingsPage() {
  const router = useRouter();
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
    load();
  }, []);

  const handleSave = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      toast.error('请填写 clientID 与 clientSecret');
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

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">支付设置</div>
          <div className="text-sm text-muted-foreground mt-1">
            配置你在 LDC 积分系统的商户凭据,用于接收他人领取付费项目的付款
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          返回
        </Button>
      </div>

      {!config?.payment_enabled && (
        <div className="border border-destructive/40 bg-destructive/5 text-destructive text-sm rounded-lg p-3">
          平台的付费功能当前处于关闭状态,保存配置不影响未来启用,但现在无法创建付费项目
        </div>
      )}

      <CallbackURLHint
        notifyUrl={config?.callback_notify_url || ''}
        returnUrl={config?.callback_return_url || ''}
      />

      <div className="border border-border rounded-lg p-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="client_id">clientID(pid)</Label>
          <Input
            id="client_id"
            placeholder="在 credit.linux.do 应用详情中获取"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            maxLength={64}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_secret">clientSecret(key)</Label>
          <Input
            id="client_secret"
            type="password"
            placeholder={config?.has_config ? `已保存,末 4 位: ${config.secret_last4 || '****'}(留空即不修改)` : '请输入'}
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            maxLength={256}
          />
          <p className="text-xs text-muted-foreground">
            服务器以 AES-256-GCM 加密存储,不会回显明文
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? '保存中...' : '保存'}
          </Button>
          {config?.has_config && (
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              <Trash2 className="h-4 w-4 mr-1" />
              {deleting ? '删除中...' : '删除配置'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
