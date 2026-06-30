"use client";

import Image from "next/image";
import Link from "next/link";
import { LockIcon, PrinterIcon } from "@/components/icons";

const PAPER_ID = "2324-03-MA-P4";
const PAGE_COUNT = 12;

function WatermarkLayer({ watermarkText }: { watermarkText: string }) {
  return (
    <div className="watermark-layer" aria-hidden="true">
      {Array.from({ length: 8 }, (_, index) => <span key={index}>{watermarkText}</span>)}
    </div>
  );
}

export function PrintPreview({ authorization, paperId, watermarkText }: { authorization: string; paperId: string; watermarkText: string }) {
  const activePaperId = paperId === PAPER_ID ? paperId : PAPER_ID;

  return (
    <main className="print-workspace">
      <header className="print-toolbar">
        <div><h1>列印預覽 · 2023–2024年度 四年級數學科考試三</h1><p>12頁均由伺服器加入帳戶及授權水印；此畫面不提供原 PDF 或下載按鈕。</p></div>
        <div className="header-tools"><span className="security-note"><LockIcon />授權有效15分鐘</span><Link className="button button-secondary button-small" href={`/papers/${activePaperId}`}>返回</Link><button className="button button-primary button-small" onClick={() => window.print()} type="button"><PrinterIcon />直接列印</button></div>
      </header>
      <section className="print-pages">
        {Array.from({ length: PAGE_COUNT }, (_, index) => {
          const pageNumber = index + 1;
          return (
            <article className="print-page" key={pageNumber}>
              <Image
                alt={`四年級數學科考試三第${pageNumber}頁`}
                className="print-page-image"
                height={1404}
                priority={pageNumber <= 2}
                src={`/api/print-page/${activePaperId}/${pageNumber}?job=${encodeURIComponent(authorization)}`}
                unoptimized
                width={992}
              />
              <WatermarkLayer watermarkText={watermarkText} />
              <span className="print-page-label">授權編號 {authorization} · 第{pageNumber}頁／共{PAGE_COUNT}頁</span>
            </article>
          );
        })}
      </section>
    </main>
  );
}
