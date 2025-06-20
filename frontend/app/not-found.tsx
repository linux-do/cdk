"use client";
import WorldMap from "@/components/ui/world-map";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { WritingText } from '@/components/animate-ui/text/writing';
import { MessageCircle, Send, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className=" py-40 dark:bg-black bg-white w-full">
      <div className="max-w-7xl mx-auto text-center">
                 <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, delay: 0.2 }}
         >
           <p className="font-bold text-xl md:text-4xl dark:text-white text-black">
             {"页面".split("").map((word, idx) => (
               <motion.span
                 key={idx}
                 className="inline-block"
                 initial={{ x: -10, opacity: 0 }}
                 animate={{ x: 0, opacity: 1 }}
                 transition={{ duration: 0.5, delay: idx * 0.04 }}
               >
                 {word}
               </motion.span>
             ))}{" "}
             <span className="text-neutral-400">
               {"未找到".split("").map((word, idx) => (
                 <motion.span
                   key={idx}
                   className="inline-block"
                   initial={{ x: -10, opacity: 0 }}
                   animate={{ x: 0, opacity: 1 }}
                   transition={{ duration: 0.5, delay: (idx + 2) * 0.04 }}
                 >
                   {word}
                 </motion.span>
               ))}
             </span>
           </p>
         </motion.div>
         
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, delay: 0.6 }}
         >
           <p className="text-sm md:text-lg text-neutral-500 max-w-2xl mx-auto py-4">
             {"抱歉，您访问的页面不存在或已被永久移动。若您认为这是个页面问题，请及时向我们".split("").map((char, idx) => (
               <motion.span
                 key={idx}
                 className="inline-block"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ duration: 0.02, delay: 0.8 + idx * 0.01 }}
               >
                 {char === " " ? "\u00A0" : char}
               </motion.span>
             ))}
             <motion.span
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ duration: 0.3, delay: 1.3 }}
               className="inline-block"
             >
               <a 
                 href="https://rcnocajpmmaw.feishu.cn/share/base/form/shrcnQnuZp9op9LhOAMI3kVBe2e"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="text-blue-500 hover:text-blue-600 underline mx-1 inline-flex items-center gap-1"
               >
                 <MessageCircle className="w-3 h-3" />
                 反馈
               </a>
             </motion.span>
             <motion.span
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ duration: 0.3, delay: 1.5 }}
               className="inline-block"
             >
               或加入
             </motion.span>
             <motion.span
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ duration: 0.3, delay: 1.7 }}
               className="inline-block"
             >
               <a 
                 href="https://t.me/linuxdocdk"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="text-blue-500 hover:text-blue-600 underline mx-1 inline-flex items-center gap-1"
               >
                 <Send className="w-3 h-3" />
                 群组
               </a>
             </motion.span>
             <motion.span
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ duration: 0.3, delay: 1.9 }}
               className="inline-block"
             >
               交流，感谢您的支持！
             </motion.span>
           </p>
         </motion.div>
         
         {/* 返回首页按钮 */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, delay: 2.2 }}
           className="flex justify-center pt-6"
         >
           <Link href="/explore">
             <Button size="lg">
               <Home className="w-4 h-4 mr-2" />
               返回首页
             </Button>
           </Link>
         </motion.div>
       </div>
      <WorldMap
        dots={[
          {
            start: {
              lat: 64.2008,
              lng: -149.4937,
            }, // Alaska (Fairbanks)
            end: {
              lat: 34.0522,
              lng: -118.2437,
            }, // Los Angeles
          },
          {
            start: { lat: 64.2008, lng: -149.4937 }, // Alaska (Fairbanks)
            end: { lat: -15.7975, lng: -47.8919 }, // Brazil (Brasília)
          },
          {
            start: { lat: -15.7975, lng: -47.8919 }, // Brazil (Brasília)
            end: { lat: 38.7223, lng: -9.1393 }, // Lisbon
          },
          {
            start: { lat: 51.5074, lng: -0.1278 }, // London
            end: { lat: 28.6139, lng: 77.209 }, // New Delhi
          },
          {
            start: { lat: 28.6139, lng: 77.209 }, // New Delhi
            end: { lat: 39.9042, lng: 116.4074 }, // Beijing
          },
          {
            start: { lat: 39.9042, lng: 116.4074 }, // Beijing
            end: { lat: 43.1332, lng: 131.9113 }, // Vladivostok
          },
          {
            start: { lat: 39.9042, lng: 116.4074 }, // Beijing
            end: { lat: 55.7558, lng: 37.6173 }, // Moscow
          },
          {
            start: { lat: 28.6139, lng: 77.209 }, // New Delhi
            end: { lat: -1.2921, lng: 36.8219 }, // Nairobi
          },
        ]}
      />
    </div>
  );
}

