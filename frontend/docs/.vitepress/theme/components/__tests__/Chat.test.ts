import { describe, it, expect, vi, afterEach } from "vitest";
import { mount, flushPromises, VueWrapper } from "@vue/test-utils";
import Chat from "../Chat.vue";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Pre-populate sessionStorage so the component mounts directly in expanded mode
// (isCompactMode = false). This is necessary for tests that need to see the
// messages list, because error messages are only rendered in the expanded view.
const seedExpandedSession = () => {
  const messages = [
    {
      role: "assistant",
      content: "Hi! What would you like to learn about Steve today?",
      timestamp: Date.now() - 1000,
    },
    { role: "user", content: "Previous question", timestamp: Date.now() - 500 },
    { role: "assistant", content: "Previous answer", timestamp: Date.now() - 400 },
  ];
  sessionStorage.setItem("chatMessages", JSON.stringify(messages));
  sessionStorage.setItem("chatCompactMode", "false");
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe("Chat", () => {
  let wrapper: VueWrapper;

  afterEach(() => {
    wrapper?.unmount();
    sessionStorage.clear();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  // ── Mounting ────────────────────────────────────────────────────────────────

  it("renders the chat container after mount", async () => {
    wrapper = mount(Chat);
    await flushPromises();
    expect(wrapper.find(".chat-position").exists()).toBe(true);
  });

  it("shows the chat toggle FAB by default", async () => {
    wrapper = mount(Chat);
    await flushPromises();
    expect(wrapper.find(".chat-fab").exists()).toBe(true);
  });

  it("is not expanded initially (mini-chat window absent)", async () => {
    wrapper = mount(Chat);
    await flushPromises();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it("renders nothing before onMounted fires", () => {
    wrapper = mount(Chat);
    expect(wrapper.find(".chat-position").exists()).toBe(false);
  });

  it("renders after the isClient flag is set in onMounted", async () => {
    wrapper = mount(Chat);
    expect(wrapper.find(".chat-position").exists()).toBe(false);
    await flushPromises();
    expect(wrapper.find(".chat-position").exists()).toBe(true);
  });

  // ── FAB / toggle ────────────────────────────────────────────────────────────

  it("opens the chat panel when FAB is clicked", async () => {
    wrapper = mount(Chat);
    await flushPromises();
    await wrapper.find(".chat-fab").trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
  });

  it("FAB is no longer visible once the chat window opens", async () => {
    wrapper = mount(Chat);
    await flushPromises();
    await wrapper.find(".chat-fab").trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".chat-fab").exists()).toBe(false);
  });

  it("closes the chat when the close button is clicked in compact mode", async () => {
    wrapper = mount(Chat);
    await flushPromises();
    await wrapper.find(".chat-fab").trigger("click");
    await wrapper.vm.$nextTick();
    const closeBtn = wrapper.find('[aria-label="Close chat"]');
    expect(closeBtn.exists()).toBe(true);
    await closeBtn.trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".chat-fab").exists()).toBe(true);
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  // ── Compact mode UI ─────────────────────────────────────────────────────────

  it("shows the initial greeting in compact mode", async () => {
    wrapper = mount(Chat);
    await flushPromises();
    await wrapper.find(".chat-fab").trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Hi! What would you like to learn about Steve today?");
  });

  it("renders at least 5 prompt suggestion buttons in compact mode", async () => {
    wrapper = mount(Chat);
    await flushPromises();
    await wrapper.find(".chat-fab").trigger("click");
    await wrapper.vm.$nextTick();
    const suggestionBtns = wrapper
      .findAll("button")
      .filter(b => !b.attributes("aria-label") && b.text().trim().length > 10);
    expect(suggestionBtns.length).toBeGreaterThanOrEqual(5);
  });

  it("sets userInput when a suggestion is clicked", async () => {
    wrapper = mount(Chat);
    await flushPromises();
    await wrapper.find(".chat-fab").trigger("click");
    await wrapper.vm.$nextTick();
    const suggestionBtns = wrapper
      .findAll("button")
      .filter(b => !b.attributes("aria-label") && b.text().trim().length > 10);
    const firstText = suggestionBtns[0].text().trim();
    await suggestionBtns[0].trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.find("textarea").element.value).toBe(firstText);
  });

  it("renders a textarea for user input in compact mode", async () => {
    wrapper = mount(Chat);
    await flushPromises();
    await wrapper.find(".chat-fab").trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.find("textarea").exists()).toBe(true);
  });

  it("renders a send button in compact mode", async () => {
    wrapper = mount(Chat);
    await flushPromises();
    await wrapper.find(".chat-fab").trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[aria-label="Send message"]').exists()).toBe(true);
  });

  it("send button is disabled when textarea is empty", async () => {
    wrapper = mount(Chat);
    await flushPromises();
    await wrapper.find(".chat-fab").trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[aria-label="Send message"]').attributes("disabled")).toBeDefined();
  });

  it("send button becomes active when textarea has content", async () => {
    wrapper = mount(Chat);
    await flushPromises();
    await wrapper.find(".chat-fab").trigger("click");
    await wrapper.vm.$nextTick();
    await wrapper.find("textarea").setValue("Hello Steve");
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[aria-label="Send message"]').attributes("disabled")).toBeUndefined();
  });

  // ── activateChat event ──────────────────────────────────────────────────────

  it("opens when activateChat event is dispatched", async () => {
    wrapper = mount(Chat);
    await flushPromises();
    window.dispatchEvent(
      new CustomEvent("activateChat", { detail: { message: "hello", autoSend: false } }),
    );
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
  });

  it("pre-fills textarea when activateChat fires with a message", async () => {
    wrapper = mount(Chat);
    await flushPromises();
    window.dispatchEvent(
      new CustomEvent("activateChat", {
        detail: { message: "Tell me about Steve", autoSend: false },
      }),
    );
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find("textarea").element.value).toBe("Tell me about Steve");
  });

  // ── Keyboard shortcut ───────────────────────────────────────────────────────

  it("registers the global keydown listener on mount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    wrapper = mount(Chat);
    expect(addSpy.mock.calls.map(c => c[0])).toContain("keydown");
    addSpy.mockRestore();
  });

  it("removes global keydown listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    wrapper = mount(Chat);
    wrapper.unmount();
    expect(removeSpy.mock.calls.map(c => c[0])).toContain("keydown");
    removeSpy.mockRestore();
    wrapper = mount(Chat);
  });

  it("toggles chat open via Ctrl+Shift+. keyboard shortcut", async () => {
    wrapper = mount(Chat);
    await flushPromises();
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: ".", ctrlKey: true, shiftKey: true, bubbles: true }),
    );
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
  });

  // ── Event listener lifecycle ─────────────────────────────────────────────────

  it("registers activateChat event listener on mount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    wrapper = mount(Chat);
    expect(addSpy.mock.calls.map(c => c[0])).toContain("activateChat");
    addSpy.mockRestore();
  });

  it("removes activateChat event listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    wrapper = mount(Chat);
    wrapper.unmount();
    expect(removeSpy.mock.calls.map(c => c[0])).toContain("activateChat");
    removeSpy.mockRestore();
    wrapper = mount(Chat);
  });

  // ── sessionStorage restore ───────────────────────────────────────────────────

  it("restores messages from sessionStorage on mount", async () => {
    const stored = [
      {
        role: "assistant",
        content: "Hi! What would you like to learn about Steve today?",
        timestamp: Date.now(),
      },
      { role: "user", content: "Restored message", timestamp: Date.now() },
    ];
    sessionStorage.setItem("chatMessages", JSON.stringify(stored));
    sessionStorage.setItem("chatCompactMode", "false");
    wrapper = mount(Chat);
    await flushPromises();
    await wrapper.find(".chat-fab").trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Restored message");
  });

  it("falls back to default greeting when sessionStorage is empty", async () => {
    sessionStorage.clear();
    wrapper = mount(Chat);
    await flushPromises();
    await wrapper.find(".chat-fab").trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Hi! What would you like to learn about Steve today?");
  });

  it("falls back to default greeting when sessionStorage contains invalid JSON", async () => {
    sessionStorage.setItem("chatMessages", "not-json{{");
    wrapper = mount(Chat);
    await flushPromises();
    await wrapper.find(".chat-fab").trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Hi! What would you like to learn about Steve today?");
  });

  // ── Keyboard input in textarea ───────────────────────────────────────────────

  it("does NOT send message on Shift+Enter in textarea", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    wrapper = mount(Chat);
    await flushPromises();
    await wrapper.find(".chat-fab").trigger("click");
    await wrapper.vm.$nextTick();

    await wrapper.find("textarea").setValue("Hello");
    await wrapper.find("textarea").trigger("keydown", { key: "Enter", shiftKey: true });
    await flushPromises();

    expect(mockFetch).not.toHaveBeenCalled();
  });

  // ── Fetch / streaming ────────────────────────────────────────────────────────

  it("calls the /chat endpoint when Enter is pressed in the textarea", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: new ReadableStream({
        start(ctrl) {
          ctrl.close();
        },
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    wrapper = mount(Chat);
    await flushPromises();
    await wrapper.find(".chat-fab").trigger("click");
    await wrapper.vm.$nextTick();

    await wrapper.find("textarea").setValue("Tell me about Airwallex");
    await wrapper.find("textarea").trigger("keydown", { key: "Enter", shiftKey: false });
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/chat"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  // For error-state tests, we pre-seed sessionStorage so the component opens
  // directly in expanded mode. This ensures the messages list (where the error
  // message is rendered) is visible without waiting for the compact→expanded
  // transition that sendMessage triggers asynchronously.

  it("handles a fetch error gracefully (shows error message)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));

    seedExpandedSession();
    wrapper = mount(Chat);
    await flushPromises();

    // Open the chat window (it will be in expanded mode due to seeded session)
    await wrapper.find(".chat-fab").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();

    await wrapper.find("textarea").setValue("Hi");
    await wrapper.find("textarea").trigger("keydown", { key: "Enter", shiftKey: false });
    await flushPromises();

    expect(wrapper.text()).toContain("Something went wrong");
  });

  it("handles a non-ok HTTP response gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    seedExpandedSession();
    wrapper = mount(Chat);
    await flushPromises();

    await wrapper.find(".chat-fab").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();

    await wrapper.find("textarea").setValue("Hi");
    await wrapper.find("textarea").trigger("keydown", { key: "Enter", shiftKey: false });
    await flushPromises();

    expect(wrapper.text()).toContain("Something went wrong");
  });

  // ── Streaming response ──────────────────────────────────────────────────────

  it("accumulates streamed content into the assistant message", async () => {
    const encoder = new TextEncoder();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: new ReadableStream({
        start(ctrl) {
          ctrl.enqueue(encoder.encode('0:"Hello "\n'));
          ctrl.enqueue(encoder.encode('0:"world"\n'));
          ctrl.close();
        },
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    seedExpandedSession();
    wrapper = mount(Chat);
    await flushPromises();

    await wrapper.find(".chat-fab").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();

    await wrapper.find("textarea").setValue("Hi");
    await wrapper.find("textarea").trigger("keydown", { key: "Enter", shiftKey: false });
    await flushPromises();

    expect(wrapper.text()).toContain("Hello world");
  });

  it("handles null response.body as an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, body: null }));

    seedExpandedSession();
    wrapper = mount(Chat);
    await flushPromises();

    await wrapper.find(".chat-fab").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();

    await wrapper.find("textarea").setValue("Hi");
    await wrapper.find("textarea").trigger("keydown", { key: "Enter", shiftKey: false });
    await flushPromises();

    expect(wrapper.text()).toContain("Something went wrong");
  });

  // ── Retry ───────────────────────────────────────────────────────────────────

  it("shows retry button after a failed message and retries on click", async () => {
    let callCount = 0;
    const encoder = new TextEncoder();
    const mockFetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error("Network failure"));
      }
      return Promise.resolve({
        ok: true,
        body: new ReadableStream({
          start(ctrl) {
            ctrl.enqueue(encoder.encode('0:"Retry success"\n'));
            ctrl.close();
          },
        }),
      });
    });
    vi.stubGlobal("fetch", mockFetch);

    seedExpandedSession();
    wrapper = mount(Chat);
    await flushPromises();
    await wrapper.find(".chat-fab").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();

    await wrapper.find("textarea").setValue("Hi");
    await wrapper.find("textarea").trigger("keydown", { key: "Enter", shiftKey: false });
    await flushPromises();

    expect(wrapper.text()).toContain("Something went wrong");
    const retryBtn = wrapper.find(".retry-btn");
    expect(retryBtn.exists()).toBe(true);

    await retryBtn.trigger("click");
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  // ── Copy ────────────────────────────────────────────────────────────────────

  it("copies assistant message content to clipboard", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    vi.useFakeTimers();

    seedExpandedSession();
    wrapper = mount(Chat);
    await flushPromises();
    await wrapper.find(".chat-fab").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();

    const copyBtns = wrapper.findAll('[aria-label="Copy message"]');
    expect(copyBtns.length).toBeGreaterThan(0);

    await copyBtns[0].trigger("click");
    await flushPromises();

    expect(writeTextMock).toHaveBeenCalled();
    expect(wrapper.find('[aria-label="Copied"]').exists()).toBe(true);

    vi.advanceTimersByTime(2000);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[aria-label="Copied"]').exists()).toBe(false);
    vi.useRealTimers();
  });

  // ── Reset ───────────────────────────────────────────────────────────────────

  it("resets chat to initial greeting when new conversation is clicked", async () => {
    seedExpandedSession();
    wrapper = mount(Chat);
    await flushPromises();
    await wrapper.find(".chat-fab").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("Previous answer");

    const resetBtn = wrapper.find('[aria-label="New conversation"]');
    expect(resetBtn.exists()).toBe(true);
    await resetBtn.trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();

    // resetChat restores a single initial greeting and returns to compact mode
    const stored = JSON.parse(sessionStorage.getItem("chatMessages") ?? "[]") as {
      content: string;
    }[];
    expect(stored).toHaveLength(1);
    expect(stored[0].content).toContain("Hi!");
    expect(localStorage.getItem("chatFullHeight")).toBeNull();
  });

  // ── Full height toggle ──────────────────────────────────────────────────────

  it("toggles full height mode and persists to localStorage", async () => {
    seedExpandedSession();
    wrapper = mount(Chat);
    await flushPromises();
    await wrapper.find(".chat-fab").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();

    const fullScreenBtn = wrapper.find('[aria-label="Toggle full screen"]');
    expect(fullScreenBtn.exists()).toBe(true);

    await fullScreenBtn.trigger("click");
    await wrapper.vm.$nextTick();
    expect(localStorage.getItem("chatFullHeight")).toBe("true");

    await fullScreenBtn.trigger("click");
    await wrapper.vm.$nextTick();
    expect(localStorage.getItem("chatFullHeight")).toBe("false");
  });

  // ── autoSend via activateChat ───────────────────────────────────────────────

  it("auto-sends message when activateChat fires with autoSend: true", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: new ReadableStream({
        start(ctrl) {
          ctrl.close();
        },
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    wrapper = mount(Chat);
    await flushPromises();

    window.dispatchEvent(
      new CustomEvent("activateChat", {
        detail: { message: "Auto question", autoSend: true },
      }),
    );
    await flushPromises();
    await wrapper.vm.$nextTick();
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/chat"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  // ── Enter key submits in expanded mode ──────────────────────────────────────

  it("sends message via Enter in expanded mode textarea", async () => {
    const encoder = new TextEncoder();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: new ReadableStream({
        start(ctrl) {
          ctrl.enqueue(encoder.encode('0:"Response"\n'));
          ctrl.close();
        },
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    seedExpandedSession();
    wrapper = mount(Chat);
    await flushPromises();
    await wrapper.find(".chat-fab").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();

    const textareas = wrapper.findAll("textarea");
    const expandedTextarea = textareas[textareas.length - 1];
    await expandedTextarea.setValue("Test question");
    await expandedTextarea.trigger("keydown", { key: "Enter", shiftKey: false });
    await flushPromises();

    expect(mockFetch).toHaveBeenCalled();
  });

  // ── Loading indicator visibility ────────────────────────────────────────────

  it("clears loading state after streaming completes", async () => {
    const encoder = new TextEncoder();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: new ReadableStream({
        start(ctrl) {
          ctrl.enqueue(encoder.encode('0:"Done"\n'));
          ctrl.close();
        },
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    seedExpandedSession();
    wrapper = mount(Chat);
    await flushPromises();
    await wrapper.find(".chat-fab").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();

    await wrapper.find("textarea").setValue("Hi");
    await wrapper.find("textarea").trigger("keydown", { key: "Enter", shiftKey: false });
    await flushPromises();

    // After streaming completes, the send button should not show spinner
    const sendBtn = wrapper.find('[aria-label="Send message"]');
    expect(sendBtn.find(".animate-spin").exists()).toBe(false);
  });
});
