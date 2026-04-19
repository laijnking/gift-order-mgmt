import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '礼品订单管理系统',
    template: '%s | 礼品订单管理系统',
  },
  description:
    '礼品订单管理系统，支持订单导入、供应商匹配、发货通知导出、物流回单管理和数据报表分析。',
  keywords: [
    '礼品订单管理系统',
    '订单管理',
    '供应商匹配',
    '发货通知',
    '物流回单',
    '库存管理',
    '数据报表',
  ],
  authors: [{ name: '礼品订单管理系统' }],
  generator: 'Gift Order Management System',
  // icons: {
  //   icon: '',
  // },
  openGraph: {
    title: '礼品订单管理系统',
    description:
      '支持订单导入、供应商匹配、发货通知导出、物流回单管理和数据报表分析。',
    siteName: '礼品订单管理系统',
    locale: 'zh_CN',
    type: 'website',
    // images: [
    //   {
    //     url: '',
    //     width: 1200,
    //     height: 630,
    //     alt: '扣子编程 - 你的 AI 工程师',
    //   },
    // ],
  },
  // twitter: {
  //   card: 'summary_large_image',
  //   title: 'Coze Code | Your AI Engineer is Here',
  //   description:
  //     'Build and deploy full-stack applications through AI conversation. No env setup, just flow.',
  //   // images: [''],
  // },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN">
      <body className={`antialiased`}>
        {isDev && <Inspector />}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
