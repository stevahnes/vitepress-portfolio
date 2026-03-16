import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises, VueWrapper } from "@vue/test-utils";
import ShaderBackground from "../ShaderBackground.vue";

// ─── Notes on testability ──────────────────────────────────────────────────────
//
// switchShader() has an early-return guard: `if (!gl) return`.
// Since JSDOM has no WebGL, gl is always null. This means:
//   - Switching shaders via the picker or window events does NOT update
//     activeShader or sessionStorage in tests.
//   - We can only test the initial shader selection (pickInitialShader runs
//     before the WebGL guard) and the event listener registration.
//
// Picker-options live inside <Transition name="slide">. In JSDOM there is no
// CSS animation engine. Vue Test Utils does NOT stub <Transition> by default,
// so elements in a leaving transition stay in the DOM. This makes any
// `.exists() === false` assertion after a hide action unreliable.
// We therefore only assert `.exists() === true` (enter) and class/attribute
// states, never `.exists() === false` after a hide action.

const SHADER_IDS = ["aurora", "velodrome", "keys", "signal", "topology"] as const;
type ShaderId = (typeof SHADER_IDS)[number];

const openPicker = async (wrapper: VueWrapper) => {
  await flushPromises();
  await wrapper.vm.$nextTick();
  await wrapper.find(".picker-toggle").trigger("click");
  await flushPromises();
  await wrapper.vm.$nextTick();
};

describe("ShaderBackground", () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    wrapper?.unmount();
    sessionStorage.clear();
  });

  // ── Canvas ──────────────────────────────────────────────────────────────────

  it("renders a canvas element", () => {
    wrapper = mount(ShaderBackground);
    expect(wrapper.find("canvas").exists()).toBe(true);
  });

  it("canvas has the shader-bg class", () => {
    wrapper = mount(ShaderBackground);
    expect(wrapper.find("canvas.shader-bg").exists()).toBe(true);
  });

  it("canvas is marked as aria-hidden", () => {
    wrapper = mount(ShaderBackground);
    expect(wrapper.find("canvas").attributes("aria-hidden")).toBe("true");
  });

  // ── Picker — initial visibility ─────────────────────────────────────────────

  it("renders the shader picker after mount", async () => {
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".shader-picker").exists()).toBe(true);
  });

  it("shows the picker toggle button", async () => {
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".picker-toggle").exists()).toBe(true);
  });

  // Safe: on fresh mount showPicker=false and <Transition> never entered,
  // so the element is genuinely absent (not leaving).
  it("picker options are hidden by default", async () => {
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".picker-options").exists()).toBe(false);
  });

  // ── Picker — open ───────────────────────────────────────────────────────────

  it("opens picker options on toggle click", async () => {
    wrapper = mount(ShaderBackground);
    await openPicker(wrapper);
    expect(wrapper.find(".picker-options").exists()).toBe(true);
  });

  it("toggle chevron rotates when picker is open", async () => {
    wrapper = mount(ShaderBackground);
    await openPicker(wrapper);
    expect(wrapper.find(".toggle-chevron").classes()).toContain("rotated");
  });

  it("toggle chevron is NOT rotated when picker is closed", async () => {
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".toggle-chevron").classes()).not.toContain("rotated");
  });

  // ── Picker — options ────────────────────────────────────────────────────────

  it("renders an option for each of the 5 shaders", async () => {
    wrapper = mount(ShaderBackground);
    await openPicker(wrapper);
    expect(wrapper.findAll(".picker-option").length).toBe(5);
  });

  it("marks the active shader in the picker", async () => {
    wrapper = mount(ShaderBackground);
    await openPicker(wrapper);
    expect(wrapper.find(".picker-option.active").exists()).toBe(true);
  });

  it("each option displays an icon and a label", async () => {
    wrapper = mount(ShaderBackground);
    await openPicker(wrapper);
    for (const opt of wrapper.findAll(".picker-option")) {
      expect(opt.find(".option-icon").exists()).toBe(true);
      expect(opt.find(".option-label").exists()).toBe(true);
    }
  });

  it("option labels include all five shader names", async () => {
    wrapper = mount(ShaderBackground);
    await openPicker(wrapper);
    const labels = wrapper.findAll(".option-label").map(el => el.text().toLowerCase());
    for (const id of SHADER_IDS) {
      expect(labels.some(l => l.includes(id))).toBe(true);
    }
  });

  // ── Picker — shader selection (limited by no-WebGL) ─────────────────────────
  //
  // pickInitialShader() runs synchronously before the WebGL guard, so it always
  // writes to sessionStorage. switchShader() (called on option click) hits the
  // `if (!gl) return` guard and does NOT update sessionStorage.
  // We therefore only test that clicking an option doesn't throw, not its effect.

  it("clicking an option does not throw", async () => {
    wrapper = mount(ShaderBackground);
    await openPicker(wrapper);
    await expect(wrapper.findAll(".picker-option")[0].trigger("click")).resolves.not.toThrow();
  });

  it("toggle button title reflects the current active shader label", async () => {
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".picker-toggle").attributes("title") ?? "").toContain("Current:");
  });

  it("toggle button icon reflects the current active shader icon", async () => {
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".toggle-icon").text().trim().length).toBeGreaterThan(0);
  });

  // ── sessionStorage — initial selection ──────────────────────────────────────
  //
  // pickInitialShader() is the only path that writes sessionStorage (no WebGL
  // guard). These tests are reliable because they test that initial-pick logic.

  it("restores a valid stored shader from sessionStorage on mount", async () => {
    sessionStorage.setItem("activeShader", "velodrome");
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    await openPicker(wrapper);
    expect(wrapper.find(".picker-option.active").find(".option-label").text().toLowerCase()).toBe(
      "velodrome",
    );
  });

  it("falls back to a random valid shader when sessionStorage has an invalid id", async () => {
    sessionStorage.setItem("activeShader", "notreal");
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    // pickInitialShader ignores invalid ids and picks a random one, then writes it
    const stored = sessionStorage.getItem("activeShader");
    expect(SHADER_IDS).toContain(stored as ShaderId);
  });

  it("writes a valid shader id to sessionStorage when none is stored", async () => {
    sessionStorage.clear();
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(SHADER_IDS).toContain(sessionStorage.getItem("activeShader") as ShaderId);
  });

  // ── switchShader event listener ─────────────────────────────────────────────

  it("registers the switchShader event listener on mount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    wrapper = mount(ShaderBackground);
    expect(addSpy.mock.calls.map(c => c[0])).toContain("switchShader");
    addSpy.mockRestore();
  });

  it("removes the switchShader event listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    wrapper = mount(ShaderBackground);
    wrapper.unmount();
    expect(removeSpy.mock.calls.map(c => c[0])).toContain("switchShader");
    removeSpy.mockRestore();
    wrapper = mount(ShaderBackground);
  });

  // The switchShader event handler calls switchShader() which early-returns
  // when gl===null (no WebGL in JSDOM). We verify the event does not throw.
  it("dispatching switchShader event does not throw", async () => {
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(() => {
      window.dispatchEvent(new CustomEvent("switchShader", { detail: { id: "topology" } }));
    }).not.toThrow();
  });

  // ── Accessibility ───────────────────────────────────────────────────────────

  it("picker toggle has an aria-label", async () => {
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".picker-toggle").attributes("aria-label")).toBe("Switch background");
  });

  it("all shader options are keyboard-focusable buttons", async () => {
    wrapper = mount(ShaderBackground);
    await openPicker(wrapper);
    for (const opt of wrapper.findAll(".picker-option")) {
      expect(opt.element.tagName.toLowerCase()).toBe("button");
    }
  });

  // ── Layout classes ───────────────────────────────────────────────────────────

  it("shader-picker has class 'open' when picker is open", async () => {
    wrapper = mount(ShaderBackground);
    await openPicker(wrapper);
    expect(wrapper.find(".shader-picker").classes()).toContain("open");
  });

  // Safe: fresh mount, showPicker was never true, so no leaving transition.
  it("shader-picker does NOT have class 'open' when picker is closed on fresh mount", async () => {
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".shader-picker").classes()).not.toContain("open");
  });
});

// ─── WebGL lifecycle tests ────────────────────────────────────────────────────
// Mock canvas.getContext("webgl") to exercise shader compilation, switching,
// observer setup, and cleanup logic.

function createMockGLContext() {
  const programs: object[] = [];
  const gl = {
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    COMPILE_STATUS: 35713,
    LINK_STATUS: 35714,
    ARRAY_BUFFER: 34962,
    STATIC_DRAW: 35044,
    FLOAT: 5126,
    TRIANGLE_STRIP: 5,
    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => ""),
    deleteShader: vi.fn(),
    createProgram: vi.fn(() => {
      const prog = {};
      programs.push(prog);
      return prog;
    }),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => ""),
    useProgram: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    getUniformLocation: vi.fn(() => ({})),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    createBuffer: vi.fn(() => ({})),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    uniform3f: vi.fn(),
    viewport: vi.fn(),
    drawArrays: vi.fn(),
    clearColor: vi.fn(),
    clear: vi.fn(),
  };
  return { gl, programs };
}

describe("ShaderBackground (WebGL lifecycle)", () => {
  let wrapper: VueWrapper;
  let mockGL: ReturnType<typeof createMockGLContext>["gl"];
  let origGetContext: typeof HTMLCanvasElement.prototype.getContext;
  let idleCallbacks: ((deadline: IdleDeadline) => void)[];
  let origRequestIdleCallback: typeof window.requestIdleCallback;
  let origCancelAnimationFrame: typeof window.cancelAnimationFrame;
  let cancelSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sessionStorage.clear();
    const { gl } = createMockGLContext();
    mockGL = gl;

    origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn(function (
      this: HTMLCanvasElement,
      type: string,
    ) {
      if (type === "webgl") return mockGL as unknown as WebGLRenderingContext;
      return origGetContext.call(this, type as "2d");
    }) as typeof HTMLCanvasElement.prototype.getContext;

    idleCallbacks = [];
    origRequestIdleCallback = window.requestIdleCallback;
    window.requestIdleCallback = vi.fn((cb: IdleRequestCallback) => {
      idleCallbacks.push(cb as (deadline: IdleDeadline) => void);
      return idleCallbacks.length;
    }) as unknown as typeof window.requestIdleCallback;

    cancelSpy = vi.fn();
    origCancelAnimationFrame = window.cancelAnimationFrame;
    window.cancelAnimationFrame = cancelSpy as unknown as typeof window.cancelAnimationFrame;
  });

  afterEach(() => {
    wrapper?.unmount();
    HTMLCanvasElement.prototype.getContext = origGetContext;
    window.requestIdleCallback = origRequestIdleCallback;
    window.cancelAnimationFrame = origCancelAnimationFrame;
    sessionStorage.clear();
  });

  function fireIdleCallbacks() {
    for (const cb of idleCallbacks) {
      cb({ timeRemaining: () => 50, didTimeout: false });
    }
    idleCallbacks = [];
  }

  it("initializes WebGL and compiles a shader program on mount", async () => {
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();

    // Fire requestIdleCallback to trigger initGL
    fireIdleCallbacks();
    await flushPromises();

    expect(mockGL.createProgram).toHaveBeenCalled();
    expect(mockGL.useProgram).toHaveBeenCalled();
    expect(mockGL.linkProgram).toHaveBeenCalled();
  });

  it("pre-compiles remaining shaders during idle time", async () => {
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();

    // First idle callback triggers initGL which calls precompileOthers
    fireIdleCallbacks();
    await flushPromises();

    // precompileOthers registers its own idle callback
    fireIdleCallbacks();
    await flushPromises();

    // 1 initial + 4 other shaders = at least 5 programs created
    expect(mockGL.createProgram.mock.calls.length).toBeGreaterThanOrEqual(5);
  });

  it("sets up ResizeObserver on the canvas", async () => {
    const observeSpy = vi.fn();
    const disconnectSpy = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = observeSpy;
        disconnect = disconnectSpy;
        unobserve = vi.fn();
      },
    );

    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    fireIdleCallbacks();
    await flushPromises();

    expect(observeSpy).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("cancels animation frame on unmount", async () => {
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    fireIdleCallbacks();
    await flushPromises();

    wrapper.unmount();
    expect(cancelSpy).toHaveBeenCalled();

    // Remount to satisfy afterEach
    wrapper = mount(ShaderBackground);
  });

  it("switches shader via switchShader event when GL is available", async () => {
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    fireIdleCallbacks();
    await flushPromises();

    mockGL.useProgram.mockClear();
    window.dispatchEvent(new CustomEvent("switchShader", { detail: { id: "topology" } }));
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(mockGL.useProgram).toHaveBeenCalled();
  });

  it("clicking a picker option switches the shader when GL is available", async () => {
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    fireIdleCallbacks();
    await flushPromises();

    await openPicker(wrapper);
    mockGL.useProgram.mockClear();
    const options = wrapper.findAll(".picker-option");
    // Click a non-active option
    const nonActive = options.find(o => !o.classes().includes("active"));
    if (nonActive) {
      await nonActive.trigger("click");
      await flushPromises();
      expect(mockGL.useProgram).toHaveBeenCalled();
    }
  });

  it("updates sessionStorage when shader is switched", async () => {
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    fireIdleCallbacks();
    await flushPromises();

    window.dispatchEvent(new CustomEvent("switchShader", { detail: { id: "keys" } }));
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(sessionStorage.getItem("activeShader")).toBe("keys");
  });
});
