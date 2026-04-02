import React from 'react';

/** Same footer as the marketing home page — reuse on auth and other static routes. */
export default function MarketingFooter() {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-outline-variant/40 w-full px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-6 font-body text-sm shrink-0">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <img
          src="/drassa-logo.png"
          alt="DRASSA — Drassa Academy for Safety Aquatics"
          className="h-24 md:h-32 w-auto max-w-[220px] object-contain object-left shrink-0"
        />
        <div className="flex flex-col gap-2 text-center sm:text-left">
          <div className="text-lg font-semibold text-[#53606b]">Drassa Dubai</div>
          <p className="text-[#53606b] dark:text-slate-500">© 2026 Drassa Dubai. All rights reserved.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-8 justify-center">
        <span className="text-[#53606b] dark:text-slate-500 cursor-default">Privacy Policy</span>
        <span className="text-[#53606b] dark:text-slate-500 cursor-default">Safety Protocols</span>
        <span className="text-[#53606b] dark:text-slate-500 cursor-default">Contact Support</span>
      </div>
    </footer>
  );
}
