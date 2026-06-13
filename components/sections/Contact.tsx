"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { siGithub, siGmail } from "simple-icons";
import { SectionShell } from "../site/SectionShell";
import { Button } from "../ui/Button";
import { BrandIcon, siLinkedin } from "../ui/BrandIcon";

export function Contact() {
  const t = useTranslations();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setStatus("loading");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website }),
      });
      if (response.ok) {
        setStatus("success");
        setName("");
        setEmail("");
        setMessage("");
        setWebsite("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const channels = [
    { label: t("contact.email_label"), value: "eduardoemanuelcf@gmail.com", href: "mailto:eduardoemanuelcf@gmail.com", icon: siGmail },
    { label: t("contact.linkedin_label"), value: "linkedin.com/in/eduardoemanuelcf", href: "https://www.linkedin.com/in/eduardoemanuelcf", icon: siLinkedin },
    { label: t("contact.github_label"), value: "github.com/eduardocabral8", href: "https://github.com/eduardocabral8", icon: siGithub },
  ];

  return (
    <SectionShell
      id="contact"
      code={t("rec.contact.code")}
      kicker={t("rec.contact.kicker")}
      title={t("contact.title")}
      intro={t("contact.cta")}
    >
      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-14">
        <form onSubmit={handleSubmit} className="panel p-6 lg:p-8">
          <div className="pb-4 mb-6" style={{ borderBottom: "1.5px solid var(--ink)" }}>
            <span className="h3 text-ink">{t("contact.form_headline")}</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="kicker">{t("contact.form_name")}</span>
              <input className="field" type="text" required value={name} onChange={(e) => setName(e.target.value)} disabled={status === "loading"} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="kicker">{t("contact.form_email")}</span>
              <input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={status === "loading"} />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 mt-4">
            <span className="kicker">{t("contact.form_message")}</span>
            <textarea className="field resize-none" rows={5} required value={message} onChange={(e) => setMessage(e.target.value)} disabled={status === "loading"} />
          </label>

          <div className="hidden" aria-hidden="true">
            <label htmlFor="form-website">Website</label>
            <input id="form-website" type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>

          <div className="flex items-center justify-between gap-4 mt-6">
            <span className="font-mono text-[0.75rem] whitespace-pre-line" aria-live="polite" style={{ color: status === "error" ? "var(--correction)" : "var(--stamp-ink)" }}>
              {status === "success" ? t("contact.form_success") : status === "error" ? t("contact.form_error") : ""}
            </span>
            <Button type="submit" variant="solid" disabled={status === "loading"}>
              {status === "loading" ? t("contact.form_sending") : t("contact.form_submit")}
            </Button>
          </div>
        </form>

        <div>
          <span className="kicker">{t("contact.channels_label")}</span>
          <div className="mt-4 flex flex-col">
            {channels.map((c, i) => (
              <a
                key={c.label}
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="group flex items-center gap-4 py-4"
                style={{ borderTop: "1px solid var(--line)", borderBottom: i === channels.length - 1 ? "1px solid var(--line)" : "none" }}
              >
                <span style={{ color: "var(--ink)" }}>
                  <BrandIcon icon={c.icon} size={20} />
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="kicker">{c.label}</span>
                  <span className="font-mono text-[0.8rem] truncate" style={{ color: "var(--ink)" }}>{c.value}</span>
                </span>
                <span className="ml-auto font-mono text-[0.78rem] link-ink" style={{ border: "none" }}>→ {t("contact.open")}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
