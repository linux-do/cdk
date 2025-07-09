'use client';

import {useRef, forwardRef, useImperativeHandle} from 'react';
import {toast} from 'sonner';
import HCaptcha from '@hcaptcha/react-hcaptcha';

/**
 * ReceiveVerify 组件的 Props 接口
 */
interface ReceiveVerifyProps {
  sitekey?: string;
  onVerify: (token: string) => Promise<void>;
  onVerifyStart?: () => void;
  onVerifyEnd?: () => void;
}

/**
 * ReceiveVerify 组件的 Ref 接口
 */
export interface ReceiveVerifyRef {
  execute: () => void;
  reset: () => void;
}

/**
 * hCaptcha 验证组件
 */
export const ReceiveVerify = forwardRef<ReceiveVerifyRef, ReceiveVerifyProps>(
    ({sitekey, onVerify, onVerifyStart, onVerifyEnd}, ref) => {
      const captchaRef = useRef<HCaptcha>(null);

      useImperativeHandle(ref, () => ({
        execute: () => {
          onVerifyStart?.();
          captchaRef.current?.execute();
        },
        reset: () => {
          captchaRef.current?.resetCaptcha();
        },
      }));

      /**
     * hCaptcha验证成功回调
     */
      const handleCaptchaVerify = async (token: string) => {
        try {
          await onVerify(token);
        } catch (error) {
          console.error('Verification error:', error);
        } finally {
          onVerifyEnd?.();
          captchaRef.current?.resetCaptcha();
        }
      };

      /**
     * hCaptcha验证错误回调
     */
      const handleCaptchaError = () => {
        toast.error('验证失败，请重试');
        onVerifyEnd?.();
      };

      /**
     * hCaptcha验证过期回调
     */
      const handleCaptchaExpire = () => {
        toast.warning('验证已过期，请重新验证');
        onVerifyEnd?.();
      };

      /**
     * hCaptcha关闭回调
     */
      const handleCaptchaClose = () => {
        onVerifyEnd?.();
      };

      return (
        <>
          {/* hCaptcha组件 - invisible模式 */}
          <HCaptcha
            sitekey={sitekey || process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || 'your-hcaptcha-site-key'}
            size="invisible"
            onVerify={handleCaptchaVerify}
            onError={handleCaptchaError}
            onExpire={handleCaptchaExpire}
            onClose={handleCaptchaClose}
            ref={captchaRef}
            theme="light"
            tabIndex={-1}
          />

          {/* 添加自定义样式来优化hCaptcha外观 */}
          <style jsx global>{`
          .h_captcha_challenge_frame {
            border-radius: 12px !important;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          }
          
          .h_captcha_challenge .h_captcha_challenge_form {
            border-radius: 8px !important;
          }
          
          /* 隐藏关闭按钮或使其更小 */
          .h_captcha_challenge .h_captcha_challenge_close {
            width: 24px !important;
            height: 24px !important;
            background: rgba(0, 0, 0, 0.1) !important;
            border-radius: 50% !important;
            opacity: 0.7 !important;
            transition: opacity 0.2s ease !important;
          }
          
          .h_captcha_challenge .h_captcha_challenge_close:hover {
            opacity: 1 !important;
          }
          
          @media (prefers-color-scheme: dark) {
            .h_captcha_challenge_frame {
              background: #1f2937 !important;
              border: 1px solid #374151 !important;
            }
            
            .h_captcha_challenge .h_captcha_challenge_close {
              background: rgba(255, 255, 255, 0.1) !important;
            }
          }
        `}</style>
        </>
      );
    },
);

ReceiveVerify.displayName = 'ReceiveVerify';
