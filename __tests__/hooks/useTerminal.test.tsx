import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../messages/en.json";
import { useTerminal } from "@/hooks/useTerminal";

const replace = vi.fn();
vi.mock("@/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/",
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

function setup() {
  return renderHook(() => useTerminal(), { wrapper });
}

const lastOutput = (lines: { type: string; text: string }[]) =>
  [...lines].reverse().find((l) => l.type === "output")?.text ?? "";

describe("useTerminal", () => {
  it("starts empty and seeds the welcome message on initialize", () => {
    const { result } = setup();
    expect(result.current.lines).toEqual([]);
    act(() => result.current.initialize());
    expect(result.current.lines).toEqual([
      { type: "output", text: messages.terminal.welcome },
    ]);
  });

  it("echoes the command as an input line and prints its output", () => {
    const { result } = setup();
    act(() => result.current.executeCommand("whoami"));
    expect(result.current.lines[0]).toEqual({
      type: "input",
      text: "eec@portfolio:~$ whoami",
    });
    expect(lastOutput(result.current.lines)).toContain("Emanuel Cabral");
  });

  it("lists available commands for help", () => {
    const { result } = setup();
    act(() => result.current.executeCommand("help"));
    expect(lastOutput(result.current.lines)).toContain("Available commands");
  });

  it("reports unknown commands", () => {
    const { result } = setup();
    act(() => result.current.executeCommand("foobar"));
    const out = lastOutput(result.current.lines);
    expect(out).toContain("foobar");
    expect(out).toMatch(/not recognized/i);
  });

  it("clears the screen with the clear command", () => {
    const { result } = setup();
    act(() => result.current.executeCommand("whoami"));
    expect(result.current.lines.length).toBeGreaterThan(0);
    act(() => result.current.executeCommand("clear"));
    expect(result.current.lines).toEqual([]);
  });

  it("rejects an invalid locale argument", () => {
    const { result } = setup();
    act(() => result.current.executeCommand("locale fr"));
    expect(lastOutput(result.current.lines)).toBe(messages.terminal.locale_invalid);
  });
});
