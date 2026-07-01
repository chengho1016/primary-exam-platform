"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
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

type PrintPreviewProps = {
  authorization: string;
  paperId: string;
  watermarkText: string;
  mode?: "pages" | "source";
  title?: string;
};

export function PrintPreview({ authorization, paperId, watermarkText, mode = "pages", title }: PrintPreviewProps) {
  const activePaperId = paperId === PAPER_ID ? paperId : PAPER_ID;
  const sourceFrameRef = useRef<HTMLIFrameElement>(null);

  function printUploadedSource() {
    sourceFrameRef.current?.contentWindow?.focus();
    sourceFrameRef.current?.contentWindow?.print();
  }

  if (mode === "source") {
    const sourceUrl = `/api/print-source/${paperId}?job=${encodeURIComponent(authorization)}`;
    return (
      <main className="print-workspace">
        <header className="print-toolbar">
          <div>
            <h1>列印預覽 · {title ?? "已上傳試卷"}</h1>
            <p>此試卷由Admin上傳；列印授權有效15分鐘。若瀏覽器未能直接列印，請先在預覽框打開PDF列印功能。</p>
          </div>
          <div className="header-tools">
            <span className="security-note"><LockIcon />授權有效15分鐘</span>
            <Link className="button button-secondary button-small" href={`/papers/${paperId}`}>返回</Link>
            <button className="button button-primary button-small" onClick={printUploadedSource} type="button"><PrinterIcon />直接列印</button>
          </div>
        </header>
        <section className="source-print-preview">
          <iframe ref={sourceFrameRef} src={sourceUrl} title="試卷PDF列印預覽" />
          <div className="source-print-watermark" aria-hidden="true">{watermarkText}</div>
        </section>
      </main>
    );
  }

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
