'use client';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {copyToClipboard} from '@/lib/utils';
import {Copy, Info} from 'lucide-react';
import {toast} from 'sonner';

interface CallbackURLHintProps {
  notifyUrl: string;
  returnUrl: string;
}

function URLRow({label, value}: {label: string; value: string}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <Input
          readOnly
          value={value}
          className="bg-background font-mono text-xs shadow-none hover:bg-muted/70"
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={async () => {
            try {
              await copyToClipboard(value);
              toast.success('已复制');
            } catch {
              toast.error('复制失败');
            }
          }}
        >
          <Copy className="size-3" />
        </Button>
      </div>
    </div>
  );
}

/**
 * 醒目的 Callback URL 提示块,指引用户到 LDC 商户后台配置地址
 */
export function CallbackURLHint({notifyUrl, returnUrl}: CallbackURLHintProps) {
  return (
    <div className="space-y-4 rounded-[20px] border border-amber-500/10 bg-amber-500/[0.06] p-4 dark:border-amber-400/10 dark:bg-amber-400/[0.05]">
      <div className="flex items-center gap-2">
        <Info className="size-3.5" />
        <p className="text-sm text-foreground font-medium">请先在 LDC 集市应用详情中配置回调地址</p>
      </div>

      <div className="space-y-3">
        <URLRow label="notify_url" value={notifyUrl} />
        <URLRow label="return_url" value={returnUrl} />
      </div>
    </div>
  );
}
