'use client';

import React from 'react';
import {ContentRender} from '@/components/common/markdown/ContentRender';
import {ContainerScroll} from '@/components/ui/container-scroll-animation';
import {VersionLog} from './changelog';
import Image from 'next/image';

interface ChangelogClientProps {
  versionLogs: VersionLog[];
}

export function ChangelogClient({versionLogs}: ChangelogClientProps) {
  if (versionLogs.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">更新日志</h1>
        <p className="text-gray-600">暂无更新日志。</p>
        <p className="text-sm text-gray-500 mt-2">
          请在 <code>/public/docs/changelog/版本号/README.md</code> 中添加版本日志
        </p>
        <p className="text-sm text-gray-500 mt-1">
          封面图请放置在 <code>/public/docs/changelog/版本号/cover.png</code>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">

      <div className="space-y-4">
        {versionLogs.map((log) => (
          <div key={log.dirName} className="flex flex-col overflow-hidden">
            <ContainerScroll
              titleComponent={
                <>
                  <h2 className="-mt-[360px] text-4xl font-semibold text-black dark:text-white">
                    V {log.version} <br />
                    <span className="text-4xl md:text-[4rem] font-bold mt-1 leading-none">
                      版本更新日志
                    </span>
                  </h2>
                </>
              }
            >
              {log.coverExists ? (
                <Image
                  src={`/docs/changelog/${log.dirName}/cover.png`}
                  alt={`Version ${log.version} cover`}
                  height={720}
                  width={1400}
                  className="mx-auto rounded-2xl object-cover h-full object-center"
                  draggable={false}
                />
              ) : (
                <div className="mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 h-[720px] w-[1400px] flex items-center justify-center">
                  <div className="text-center text-white">
                    <h3 className="text-6xl font-bold mb-4">V {log.version}</h3>
                    <p className="text-xl opacity-80">版本更新</p>
                  </div>
                </div>
              )}
            </ContainerScroll>

            {/* 版本内容 */}
            <div className="container mx-auto -mt-[360px] px-4 py-8">
              <div className="max-w-4xl mx-auto">
                <div className="prose prose-lg max-w-none dark:prose-invert">
                  <ContentRender content={log.content} />
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
