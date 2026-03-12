import type { PropsWithChildren } from "react";

export const ShellPanel = ({ title, children }: PropsWithChildren<{ title: string }>) => {
  return (
    <section style={{ border: "1px solid #1e293b", borderRadius: 8, padding: 12, background: "#0f172a" }}>
      <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "#e2e8f0" }}>{title}</h3>
      {children}
    </section>
  );
};
