'use client';

import {ChangeEvent} from 'react';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Skeleton} from '@/components/ui/skeleton';
import {PaymentConfigData} from '@/lib/services/payment';
import {CallbackURLHint} from '@/components/common/payment/CallbackURLHint';

interface PaymentSettingsContentProps {
  loading: boolean;
  config: PaymentConfigData | null;
  clientId: string;
  clientSecret: string;
  onClientIdChange: (value: string) => void;
  onClientSecretChange: (value: string) => void;
}

export function PaymentSettingsContent({
  loading,
  config,
  clientId,
  clientSecret,
  onClientIdChange,
  onClientSecretChange,
}: PaymentSettingsContentProps) {
  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CallbackURLHint
        notifyUrl={config?.callback_notify_url || ''}
        returnUrl={config?.callback_return_url || ''}
      />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="client_id">Client ID</Label>
          <Input
            id="client_id"
            placeholder="在 credit.linux.do 集市应用中获取"
            value={clientId}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onClientIdChange(e.target.value)}
            maxLength={64}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_secret">Client Secret</Label>
          <Input
            id="client_secret"
            type="password"
            placeholder={config?.has_config ? `已保存，末 4 位：${config.secret_last4 || '****'}(留空即不修改)` : '在 credit.linux.do 集市应用中获取'}
            value={clientSecret}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onClientSecretChange(e.target.value)}
            maxLength={256}
          />
          <p className="text-xs text-muted-foreground">
            服务器以 AES-256-GCM 加密存储，不会回显明文
          </p>
        </div>
      </div>
    </div>
  );
}
