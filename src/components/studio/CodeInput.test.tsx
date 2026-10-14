// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CODE_SUBMIT_DELAY, CodeInput, digitsOnly, type CodeStatus } from "./CodeInput";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function Harness({
  initial = "",
  status: start = "idle",
  onComplete = () => undefined,
}: {
  initial?: string;
  status?: CodeStatus;
  onComplete?: (code: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<CodeStatus>(start);
  return (
    <CodeInput
      value={value}
      status={status}
      onChange={(v) => {
        setValue(v);
        if (status === "wrong" || status === "expired") setStatus("idle");
      }}
      onComplete={onComplete}
    />
  );
}

const boxes = () => [...document.querySelectorAll("[data-box]")];
const input = () => screen.getByLabelText("6-digit code", { selector: "input" });

describe("CodeInput", () => {
  it("keeps only digits", () => {
    expect(digitsOnly("482 913")).toBe("482913");
    expect(digitsOnly("12-34-56-78")).toBe("123456");
  });

  it("is one labelled input over six hidden boxes, as on the board", () => {
    render(<Harness />);
    const el = input();
    expect(el).toHaveAttribute("id", "otp-in");
    expect(el).toHaveAttribute("autocomplete", "one-time-code");
    expect(el).toHaveAttribute("inputmode", "numeric");
    expect(el).toHaveAttribute("maxlength", "6");
    expect(el).toHaveAttribute("aria-describedby", "otp-h");
    expect(el).toHaveAttribute("aria-invalid", "false");
    expect(screen.getByRole("group", { name: "6-digit code" })).toBeInTheDocument();
    expect(document.getElementById("otp-h")).toHaveTextContent(
      "Paste the code, or type it. It signs you in as soon as all six digits are in.",
    );
    expect(boxes()).toHaveLength(6);
    for (const b of boxes()) expect(b).toHaveAttribute("aria-hidden", "true");
  });

  it("typing fills the boxes, and the caret box follows while focused", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(input());
    expect(boxes()[0]).toHaveClass("cur");
    await user.keyboard("48a2");
    expect(input()).toHaveValue("482");
    expect(boxes().map((b) => b.textContent)).toEqual(["4", "8", "2", "", "", ""]);
    expect(boxes()[3]).toHaveClass("cur");
    await user.tab();
    expect(boxes().some((b) => b.classList.contains("cur"))).toBe(false);
  });

  it("backspace removes the last digit", async () => {
    const user = userEvent.setup();
    render(<Harness initial="4829" />);
    await user.click(input());
    await user.keyboard("{Backspace}");
    expect(input()).toHaveValue("482");
    expect(boxes()[3]).toHaveTextContent("");
  });

  it("paste drops the spaces and submits 150ms after the sixth digit", () => {
    vi.useFakeTimers();
    const done = vi.fn();
    render(<Harness onComplete={done} />);
    fireEvent.paste(input(), { clipboardData: { getData: () => "482 913" } });
    expect(input()).toHaveValue("482913");
    act(() => {
      vi.advanceTimersByTime(CODE_SUBMIT_DELAY - 1);
    });
    expect(done).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(done).toHaveBeenCalledWith("482913");
  });

  it("a paste with no digits is left to the browser", () => {
    render(<Harness />);
    const ev = fireEvent.paste(input(), { clipboardData: { getData: () => "abc" } });
    expect(ev).toBe(true);
    expect(input()).toHaveValue("");
  });

  it("an edit within 150ms cancels the submit", () => {
    vi.useFakeTimers();
    const done = vi.fn();
    render(<Harness onComplete={done} initial="48291" />);
    fireEvent.change(input(), { target: { value: "482913" } });
    fireEvent.change(input(), { target: { value: "48291" } });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(done).not.toHaveBeenCalled();
  });

  it("wrong code: red boxes and aria-invalid; typing clears it", async () => {
    const user = userEvent.setup();
    render(<Harness initial="482931" status="wrong" />);
    expect(input()).toHaveAttribute("aria-invalid", "true");
    for (const b of boxes()) expect(b).toHaveClass("bad");
    await user.click(input());
    await user.keyboard("{Backspace}");
    expect(input()).toHaveAttribute("aria-invalid", "false");
    for (const b of boxes()) expect(b).not.toHaveClass("bad");
  });

  it("code expired: the boxes are not red", () => {
    render(<Harness initial="482913" status="expired" />);
    for (const b of boxes()) expect(b).not.toHaveClass("bad");
    expect(input()).toHaveAttribute("aria-invalid", "false");
  });

  it("checking and locked: boxes .off and the input disabled", () => {
    const { unmount } = render(<Harness initial="482913" status="checking" />);
    expect(input()).toBeDisabled();
    for (const b of boxes()) expect(b).toHaveClass("off");
    unmount();
    render(<Harness status="locked" />);
    expect(input()).toBeDisabled();
    for (const b of boxes()) expect(b).toHaveClass("off");
  });

  it("keeps the caret at the end", () => {
    render(<Harness initial="4829" />);
    const el = input() as HTMLInputElement;
    el.setSelectionRange(1, 1);
    fireEvent.select(el);
    expect(el.selectionStart).toBe(4);
  });
});
