'use client';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {copyToClipboard} from '@/lib/utils';
import {Copy, ExternalLink, Info} from 'lucide-react';
import {toast} from 'sonner';

interface CallbackURLHintProps {
  notifyUrl: string;
  returnUrl: string;
}

function URLRow({label, value}: {label: string; value: string}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <Input readOnly value={value} className="bg-muted/40 font-mono text-xs" />
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            try {
              await copyToClipboard(value);
              toast.success('已复制');
            } catch {
              toast.error('复制失败');
            }
          }}
        >
          <Copy className="h-4 w-4" />
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
    <div className="border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <div className="text-sm text-amber-900 dark:text-amber-200 space-y-1">
          <p className="font-medium">请先在 LDC 商户后台配置回调地址</p>
          <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
            登录 <a href="https://credit.linux.do" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center">credit.linux.do <ExternalLink className="ml-0.5 h-3 w-3" /></a> 进入你的应用设置,把 <code className="text-xs bg-amber-100 dark:bg-amber-900/50 px-1 rounded">notify_url</code> 与 <code className="text-xs bg-amber-100 dark:bg-amber-900/50 px-1 rounded">return_url</code>(或等价字段)填成下方地址
          </p>
        </div>
      </div>

      <URLRow label="notify_url(异步通知)" value={notifyUrl} />
      <URLRow label="return_url(付款后同步回跳)" value={returnUrl} />
    </div>
  );
}
