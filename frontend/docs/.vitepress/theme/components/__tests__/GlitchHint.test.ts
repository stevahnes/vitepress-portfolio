import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises, VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import GlitchHint from "../GlitchHint.vue";

/**
 * Math.random() = 0.5 creates a predictable timeline:
 * Appearance: 12,000ms (8s min + 4s random)
 * Glitch phase: 400ms
 * Calm phase: 2,000ms
 * Repeat delay: 30,000ms
 */
const INITIAL_DELAY = 12_000;
const GLITCH_DURATION = 400;
const CALM_DURATION = 2_000;
const REPEAT_DELAY = 30_000;

describe("GlitchHint", () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    wrapper?.unmount();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const createWrapper = () =>
    mount(GlitchHint, {
      global: {
        stubs: {
          Transition: false, // Vital for .exists() checks to work without animation delays
          ClientOnly: { template: "<div><slot /></div>" },
        },
      },
    });

  // --- Mounting & Initial State ---
  it("renders nothing on initial mount", () => {
    wrapper = createWrapper();
    expect(wrapper.find(".glitch-hint").exists()).toBe(false);
  });

  it("does not show the hint immediately after mount", async () => {
    wrapper = createWrapper();
    vi.advanceTimersByTime(0);
    await nextTick();
    expect(wrapper.find(".glitch-hint").exists()).toBe(false);
  });

  it("does not show the hint before the minimum 8s delay", async () => {
    wrapper = createWrapper();
    vi.advanceTimersByTime(7999);
    await nextTick();
    expect(wrapper.find(".glitch-hint").exists()).toBe(false);
  });

  it("shows the hint button after the initial delay", async () => {
    wrapper = createWrapper();
    vi.advanceTimersByTime(INITIAL_DELAY);
    await nextTick();
    expect(wrapper.find(".glitch-hint").exists()).toBe(true);
  });

  // --- Phase Transitions ---
  it("applies the 'glitching' class immediately on appearance", async () => {
    wrapper = createWrapper();
    vi.advanceTimersByTime(INITIAL_DELAY);
    await nextTick();
    expect(wrapper.find(".glitch-hint").classes()).toContain("glitching");
  });

  it("transitions from 'glitching' to 'calm' after 400ms", async () => {
    wrapper = createWrapper();
    vi.advanceTimersByTime(INITIAL_DELAY + GLITCH_DURATION);
    await nextTick();
    const hint = wrapper.find(".glitch-hint");
    expect(hint.classes()).toContain("calm");
    expect(hint.classes()).not.toContain("glitching");
  });

  it("hides the hint after the calm phase ends", async () => {
    wrapper = createWrapper();
    // Move to end of cycle: 12,000 + 400 + 2,000 + margin
    vi.advanceTimersByTime(INITIAL_DELAY + GLITCH_DURATION + CALM_DURATION + 10);
    await flushPromises();
    await nextTick();
    expect(wrapper.find(".glitch-hint").exists()).toBe(false);
  });

  // --- Visuals & DOM Structure ---
  it("renders three span layers when visible", async () => {
    wrapper = createWrapper();
    vi.advanceTimersByTime(INITIAL_DELAY);
    await nextTick();
    expect(wrapper.findAll(".glitch-hint span").length).toBe(3);
  });

  it("renders specific channel layers (red, blue, base)", async () => {
    wrapper = createWrapper();
    vi.advanceTimersByTime(INITIAL_DELAY);
    await nextTick();
    expect(wrapper.find(".layer-r").exists()).toBe(true);
    expect(wrapper.find(".layer-b").exists()).toBe(true);
    expect(wrapper.find(".layer-base").exists()).toBe(true);
  });

  it("all layers display the prompt text '> _'", async () => {
    wrapper = createWrapper();
    vi.advanceTimersByTime(INITIAL_DELAY);
    await nextTick();
    const spans = wrapper.findAll(".glitch-hint span");
    spans.forEach(span => expect(span.text()).toBe("> _"));
  });

  // --- Accessibility ---
  it("button has an aria-label", async () => {
    wrapper = createWrapper();
    vi.advanceTimersByTime(INITIAL_DELAY);
    await nextTick();
    expect(wrapper.find(".glitch-hint").attributes("aria-label")).toBeDefined();
  });

  it("red and blue channel layers have aria-hidden='true'", async () => {
    wrapper = createWrapper();
    vi.advanceTimersByTime(INITIAL_DELAY);
    await nextTick();
    expect(wrapper.find(".layer-r").attributes("aria-hidden")).toBe("true");
    expect(wrapper.find(".layer-b").attributes("aria-hidden")).toBe("true");
  });

  // --- User Interaction ---
  it("clicking the hint dispatches '/terminal' + 'Enter'", async () => {
    wrapper = createWrapper();
    vi.advanceTimersByTime(INITIAL_DELAY);
    await nextTick();

    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    await wrapper.find(".glitch-hint").trigger("click");

    const keys = dispatchSpy.mock.calls
      .map(c => c[0] as KeyboardEvent)
      .filter(e => e.type === "keydown")
      .map(e => e.key);

    expect(keys).toEqual([..."/terminal".split(""), "Enter"]);
  });

  // it("clicking the hint hides it immediately regardless of phase", async () => {
  //   wrapper = createWrapper();
  //   vi.advanceTimersByTime(INITIAL_DELAY); // Still in glitching phase
  //   await nextTick();

  //   await wrapper.find(".glitch-hint").trigger("click");
  //   await nextTick();
  //   expect(wrapper.find(".glitch-hint").exists()).toBe(false);
  // });

  it("clicking clears timers so hint stays hidden", async () => {
    wrapper = createWrapper();
    vi.advanceTimersByTime(INITIAL_DELAY);
    await nextTick();

    await wrapper.find(".glitch-hint").trigger("click");
    await nextTick();

    // Advance time to when the calm phase would usually end
    vi.advanceTimersByTime(CALM_DURATION + 100);
    await nextTick();
    expect(wrapper.find(".glitch-hint").exists()).toBe(false);
  });

  // --- Recursion & Lifecycle ---
  it("schedules a second appearance after the first full cycle completes", async () => {
    wrapper = createWrapper();
    // First cycle (14,410ms total)
    vi.advanceTimersByTime(INITIAL_DELAY + GLITCH_DURATION + CALM_DURATION + 10);
    await nextTick();

    // Second delay (30,000ms)
    vi.advanceTimersByTime(REPEAT_DELAY);
    await nextTick();
    expect(wrapper.find(".glitch-hint").exists()).toBe(true);
  });

  // it("prevents stale timers and errors on unmount", async () => {
  //   wrapper = createWrapper();
  //   vi.advanceTimersByTime(INITIAL_DELAY);
  //   await nextTick();

  //   wrapper.unmount();
  //   // This is where runAllTimers would throw the "10000 timers" error
  //   // if the clearInterval/clearTimeout wasn't working.
  //   expect(() => vi.runOnlyPendingTimers()).not.toThrow();
  //   expect(vi.getTimerCount()).toBe(0);
  // });
});
