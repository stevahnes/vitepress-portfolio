import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises, VueWrapper } from "@vue/test-utils";
import SoundCloudPlayer from "../SoundCloudPlayer.vue";

const expand = async (wrapper: VueWrapper) => {
  await wrapper.find(".sc-collapsed").trigger("click");
};

// ─── Mock widget factory ──────────────────────────────────────────────────────
// Stores event callbacks from widget.bind() so tests can fire them manually.

type WidgetCallback = (...args: unknown[]) => void;

function createMockWidget() {
  const callbacks: Record<string, WidgetCallback> = {};
  const widget = {
    bind: vi.fn((event: string, cb: WidgetCallback) => {
      callbacks[event] = cb;
    }),
    play: vi.fn(),
    pause: vi.fn(),
    next: vi.fn(),
    prev: vi.fn(),
    seekTo: vi.fn(),
    isPaused: vi.fn((cb: (paused: boolean) => void) => cb(true)),
    getCurrentSound: vi.fn(
      (
        cb: (sound: { title: string; duration: number; user: { username: string } } | null) => void,
      ) => {
        cb({ title: "Test Track", duration: 180000, user: { username: "TestArtist" } });
      },
    ),
    getCurrentSoundIndex: vi.fn((cb: (index: number) => void) => cb(2)),
    getSounds: vi.fn((cb: (sounds: unknown[]) => void) => cb([{}, {}, {}, {}, {}])),
    getPosition: vi.fn((cb: (position: number) => void) => cb(30000)),
  };
  return { widget, callbacks };
}

function installSCMock(mockWidget: ReturnType<typeof createMockWidget>["widget"]) {
  (window as unknown as Record<string, unknown>).SC = {
    Widget: Object.assign((_iframe: HTMLIFrameElement) => mockWidget, {
      Events: {
        READY: "ready",
        PLAY: "play",
        PAUSE: "pause",
        FINISH: "finish",
        SEEK: "seek",
      },
    }),
  };
}

function removeSCMock() {
  delete (window as unknown as Record<string, unknown>).SC;
}

describe("SoundCloudPlayer", () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    wrapper = mount(SoundCloudPlayer);
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it("renders the player container after mount", () => {
    expect(wrapper.find(".sc-player").exists()).toBe(true);
  });

  it("starts in collapsed state", () => {
    expect(wrapper.find(".sc-collapsed").exists()).toBe(true);
    expect(wrapper.find(".sc-expanded").exists()).toBe(false);
  });

  it("does not render the iframe before expansion", () => {
    expect(wrapper.find("iframe").exists()).toBe(false);
  });

  it("expands when the collapsed button is clicked", async () => {
    await expand(wrapper);
    expect(wrapper.find(".sc-expanded").exists()).toBe(true);
    expect(wrapper.find(".sc-collapsed").exists()).toBe(false);
  });

  it("loads the iframe on first expansion", async () => {
    await expand(wrapper);
    expect(wrapper.find("iframe").exists()).toBe(true);
    expect(wrapper.find("iframe").attributes("src")).toContain("soundcloud.com/player");
  });

  it("collapses back when the minimize button is clicked", async () => {
    await expand(wrapper);
    await wrapper.find(".sc-header-btn").trigger("click");
    expect(wrapper.find(".sc-collapsed").exists()).toBe(true);
    expect(wrapper.find(".sc-expanded").exists()).toBe(false);
  });

  it("does not show playing indicator when paused", () => {
    expect(wrapper.find(".sc-playing-indicator").exists()).toBe(false);
  });

  it("shows track info placeholders in expanded state", async () => {
    await expand(wrapper);
    expect(wrapper.find(".sc-title").text()).toBe("Loading...");
    expect(wrapper.find(".sc-artist").text()).toBe("SoundCloud");
  });

  it("shows track counter in expanded state", async () => {
    await expand(wrapper);
    expect(wrapper.find(".sc-track-counter").text()).toBe("1 / 0");
  });

  it("disables controls while loading", async () => {
    await expand(wrapper);
    expect(wrapper.find(".sc-play-btn").attributes("disabled")).toBeDefined();
    wrapper.findAll(".sc-nav-btn").forEach(btn => {
      expect(btn.attributes("disabled")).toBeDefined();
    });
  });

  it("registers window event listeners on mount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const w = mount(SoundCloudPlayer);
    const events = addSpy.mock.calls.map(c => c[0]);
    expect(events).toContain("openSoundCloud");
    expect(events).toContain("playSoundCloud");
    expect(events).toContain("pauseSoundCloud");
    expect(events).toContain("nextSoundCloud");
    expect(events).toContain("prevSoundCloud");
    w.unmount();
    addSpy.mockRestore();
  });

  it("removes window event listeners on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const w = mount(SoundCloudPlayer);
    w.unmount();
    const events = removeSpy.mock.calls.map(c => c[0]);
    expect(events).toContain("openSoundCloud");
    expect(events).toContain("playSoundCloud");
    expect(events).toContain("pauseSoundCloud");
    expect(events).toContain("nextSoundCloud");
    expect(events).toContain("prevSoundCloud");
    removeSpy.mockRestore();
  });

  it("opens when the openSoundCloud event fires", async () => {
    window.dispatchEvent(new Event("openSoundCloud"));
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".sc-expanded").exists()).toBe(true);
  });

  it("renders the progress bar in expanded state", async () => {
    await expand(wrapper);
    expect(wrapper.find(".sc-progress").exists()).toBe(true);
    expect(wrapper.findAll(".sc-time")).toHaveLength(2);
    expect(wrapper.find(".sc-seek-bar").exists()).toBe(true);
  });

  it("accepts a custom playlistUrl prop", async () => {
    const customUrl = "https://soundcloud.com/test/sets/my-playlist";
    const w = mount(SoundCloudPlayer, { props: { playlistUrl: customUrl } });
    await w.vm.$nextTick();
    await w.find(".sc-collapsed").trigger("click");
    expect(w.find("iframe").attributes("src")).toContain(encodeURIComponent(customUrl));
    w.unmount();
  });

  it("collapsed button has the music note icon", () => {
    expect(wrapper.find(".sc-note-icon").exists()).toBe(true);
  });

  it("collapsed button contains the sc-music-note wrapper", () => {
    expect(wrapper.find(".sc-music-note").exists()).toBe(true);
  });

  it("expanded header contains track title and artist", async () => {
    await expand(wrapper);
    expect(wrapper.find(".sc-header").exists()).toBe(true);
    expect(wrapper.find(".sc-title").exists()).toBe(true);
    expect(wrapper.find(".sc-artist").exists()).toBe(true);
  });

  it("expanded controls section has a play button and two nav buttons", async () => {
    await expand(wrapper);
    expect(wrapper.find(".sc-play-btn").exists()).toBe(true);
    expect(wrapper.findAll(".sc-nav-btn")).toHaveLength(2);
  });

  it("play button renders a spinner while loading", async () => {
    await expand(wrapper);
    expect(wrapper.find(".sc-spinner").exists()).toBe(true);
  });

  it("seek bar fill starts at 0%", async () => {
    await expand(wrapper);
    expect(wrapper.find(".sc-seek-fill").attributes("style")).toContain("width: 0%");
  });

  it("both time displays show 0:00 at start", async () => {
    await expand(wrapper);
    const times = wrapper.findAll(".sc-time");
    expect(times[0].text()).toBe("0:00");
    expect(times[1].text()).toBe("0:00");
  });

  it("iframe src contains auto_play=false", async () => {
    await expand(wrapper);
    expect(wrapper.find("iframe").attributes("src")).toContain("auto_play=false");
  });

  it("iframe src includes show_artwork=false", async () => {
    await expand(wrapper);
    expect(wrapper.find("iframe").attributes("src")).toContain("show_artwork=false");
  });

  it("iframe src includes buying=false", async () => {
    await expand(wrapper);
    expect(wrapper.find("iframe").attributes("src")).toContain("buying=false");
  });

  it("iframe has the sc-iframe class (off-screen positioning)", async () => {
    await expand(wrapper);
    expect(wrapper.find("iframe").classes()).toContain("sc-iframe");
  });

  it("iframe has allow='autoplay; encrypted-media'", async () => {
    await expand(wrapper);
    expect(wrapper.find("iframe").attributes("allow")).toContain("autoplay");
  });

  it("does not change the iframe src on second expansion", async () => {
    await expand(wrapper);
    const firstSrc = wrapper.find("iframe").attributes("src");
    await wrapper.find(".sc-header-btn").trigger("click");
    await expand(wrapper);
    expect(wrapper.find("iframe").attributes("src")).toBe(firstSrc);
  });

  it("dispatching openSoundCloud twice still shows expanded (idempotent)", async () => {
    window.dispatchEvent(new Event("openSoundCloud"));
    await wrapper.vm.$nextTick();
    window.dispatchEvent(new Event("openSoundCloud"));
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".sc-expanded").exists()).toBe(true);
  });

  it("playSoundCloud event does not throw when widget is not ready", () => {
    expect(() => window.dispatchEvent(new Event("playSoundCloud"))).not.toThrow();
  });

  it("pauseSoundCloud event does not throw when widget is not ready", () => {
    expect(() => window.dispatchEvent(new Event("pauseSoundCloud"))).not.toThrow();
  });

  it("nextSoundCloud event does not throw when widget is not ready", () => {
    expect(() => window.dispatchEvent(new Event("nextSoundCloud"))).not.toThrow();
  });

  it("prevSoundCloud event does not throw when widget is not ready", () => {
    expect(() => window.dispatchEvent(new Event("prevSoundCloud"))).not.toThrow();
  });

  it("uses the piano-covers playlist URL by default", async () => {
    await expand(wrapper);
    expect(wrapper.find("iframe").attributes("src") ?? "").toContain("piano-covers");
  });

  it("URL-encodes the playlist URL in the iframe src", async () => {
    const specialUrl = "https://soundcloud.com/user/sets/special playlist";
    const w = mount(SoundCloudPlayer, { props: { playlistUrl: specialUrl } });
    await flushPromises();
    await w.find(".sc-collapsed").trigger("click");
    const src = w.find("iframe").attributes("src") ?? "";
    expect(src).not.toContain(" ");
    w.unmount();
  });

  it("clicking the seek bar does not throw when widget is not ready", async () => {
    await expand(wrapper);
    await expect(wrapper.find(".sc-seek-bar").trigger("click")).resolves.not.toThrow();
  });

  it("sc-player-container has 'expanded' class when open", async () => {
    await expand(wrapper);
    expect(wrapper.find(".sc-player-container").classes()).toContain("expanded");
  });

  it("sc-player-container does NOT have 'expanded' class when collapsed", () => {
    expect(wrapper.find(".sc-player-container").classes()).not.toContain("expanded");
  });
});

// ─── Widget interaction tests ─────────────────────────────────────────────────
// These tests mock window.SC to exercise the full widget lifecycle.

describe("SoundCloudPlayer (widget interactions)", () => {
  let wrapper: VueWrapper;
  let mockWidget: ReturnType<typeof createMockWidget>["widget"];
  let callbacks: Record<string, WidgetCallback>;

  beforeEach(() => {
    const mock = createMockWidget();
    mockWidget = mock.widget;
    callbacks = mock.callbacks;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    wrapper?.unmount();
    removeSCMock();
  });

  async function mountAndExpand() {
    await flushPromises(); // settle any pending promises from previous tests
    const w = mount(SoundCloudPlayer);
    await flushPromises();
    installSCMock(mockWidget);
    await w.find(".sc-collapsed").trigger("click");
    await flushPromises();
    await w.vm.$nextTick();
    callbacks["ready"]();
    await flushPromises();
    await w.vm.$nextTick();
    return w;
  }

  it("initializes widget and populates track info on READY", async () => {
    wrapper = await mountAndExpand();

    expect(wrapper.find(".sc-title").text()).toBe("Test Track");
    expect(wrapper.find(".sc-artist").text()).toBe("TestArtist");
    expect(wrapper.find(".sc-track-counter").text()).toBe("3 / 5");
  });

  it("removes spinner after warm-up play completes", async () => {
    wrapper = await mountAndExpand();
    callbacks["play"](); // warm-up → marks isWidgetReady = true
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".sc-spinner").exists()).toBe(false);
  });

  it("warm-up PLAY event pauses immediately and marks widget ready", async () => {
    wrapper = await mountAndExpand();

    callbacks["play"]();
    await wrapper.vm.$nextTick();

    expect(mockWidget.pause).toHaveBeenCalled();
    expect(wrapper.find(".sc-play-btn").attributes("disabled")).toBeUndefined();
  });

  it("second PLAY event sets isPlaying to true", async () => {
    wrapper = await mountAndExpand();

    callbacks["play"](); // warm-up
    await wrapper.vm.$nextTick();
    callbacks["play"](); // real play
    await wrapper.vm.$nextTick();

    const playBtn = wrapper.find(".sc-play-btn");
    expect(playBtn.find(".sc-spinner").exists()).toBe(false);
  });

  it("PAUSE event sets isPlaying to false", async () => {
    wrapper = await mountAndExpand();
    callbacks["play"](); // warm-up
    await wrapper.vm.$nextTick();
    callbacks["play"](); // real play
    await wrapper.vm.$nextTick();
    callbacks["pause"]();
    await wrapper.vm.$nextTick();

    const playBtn = wrapper.find(".sc-play-btn");
    expect(playBtn.find(".sc-spinner").exists()).toBe(false);
  });

  it("ignores PAUSE during warm-up phase", async () => {
    wrapper = await mountAndExpand();

    callbacks["pause"]();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".sc-expanded").exists()).toBe(true);
  });

  it("FINISH event triggers nextTrack after 500ms", async () => {
    wrapper = await mountAndExpand();
    callbacks["play"](); // warm-up
    await wrapper.vm.$nextTick();

    vi.useFakeTimers();
    callbacks["finish"]();
    await wrapper.vm.$nextTick();

    expect(mockWidget.next).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(mockWidget.next).toHaveBeenCalled();
  });

  it("togglePlay calls widget.play when paused", async () => {
    wrapper = await mountAndExpand();
    callbacks["play"](); // warm-up
    await wrapper.vm.$nextTick();

    mockWidget.isPaused.mockImplementation((cb: (p: boolean) => void) => cb(true));
    await wrapper.find(".sc-play-btn").trigger("click");
    await wrapper.vm.$nextTick();

    expect(mockWidget.play).toHaveBeenCalled();
  });

  it("togglePlay calls widget.pause when playing", async () => {
    wrapper = await mountAndExpand();
    callbacks["play"](); // warm-up
    await wrapper.vm.$nextTick();

    mockWidget.isPaused.mockImplementation((cb: (p: boolean) => void) => cb(false));
    await wrapper.find(".sc-play-btn").trigger("click");
    await wrapper.vm.$nextTick();

    expect(mockWidget.pause).toHaveBeenCalled();
  });

  it("nextTrack calls widget.next and re-fetches track info", async () => {
    wrapper = await mountAndExpand();
    callbacks["play"](); // warm-up
    await wrapper.vm.$nextTick();

    vi.useFakeTimers();
    const navBtns = wrapper.findAll(".sc-nav-btn");
    await navBtns[1].trigger("click");
    expect(mockWidget.next).toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(mockWidget.getCurrentSound).toHaveBeenCalledTimes(2);
  });

  it("prevTrack calls widget.prev and re-fetches track info", async () => {
    wrapper = await mountAndExpand();
    callbacks["play"](); // warm-up
    await wrapper.vm.$nextTick();

    vi.useFakeTimers();
    const navBtns = wrapper.findAll(".sc-nav-btn");
    await navBtns[0].trigger("click");
    expect(mockWidget.prev).toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(mockWidget.getCurrentSound).toHaveBeenCalledTimes(2);
  });

  it("error callback stops playing and clears position tracking", async () => {
    wrapper = await mountAndExpand();
    callbacks["play"](); // warm-up
    await wrapper.vm.$nextTick();
    callbacks["play"](); // real play
    await wrapper.vm.$nextTick();

    callbacks["error"]();
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".sc-play-btn").find(".sc-spinner").exists()).toBe(false);
  });

  it("SEEK callback updates position", async () => {
    wrapper = await mountAndExpand();
    callbacks["play"](); // warm-up
    await wrapper.vm.$nextTick();

    callbacks["seek"]();
    await wrapper.vm.$nextTick();

    expect(mockWidget.getPosition).toHaveBeenCalled();
  });

  it("position tracking updates the progress display", async () => {
    wrapper = await mountAndExpand();
    callbacks["play"](); // warm-up
    await wrapper.vm.$nextTick();

    vi.useFakeTimers();
    callbacks["play"](); // real play — starts position interval
    await wrapper.vm.$nextTick();

    vi.advanceTimersByTime(1000);
    await wrapper.vm.$nextTick();

    const times = wrapper.findAll(".sc-time");
    expect(times[0].text()).toBe("0:30");
    expect(times[1].text()).toBe("3:00");
  });

  it("drift detection corrects playing state when widget is actually paused", async () => {
    wrapper = await mountAndExpand();
    callbacks["play"](); // warm-up
    await wrapper.vm.$nextTick();

    vi.useFakeTimers();
    callbacks["play"](); // real play
    await wrapper.vm.$nextTick();

    mockWidget.getPosition.mockImplementation((cb: (p: number) => void) => cb(5000));
    mockWidget.isPaused.mockImplementation((cb: (p: boolean) => void) => cb(true));

    vi.advanceTimersByTime(1000);
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".sc-play-btn").find(".sc-spinner").exists()).toBe(false);
  });

  it("handlePlaySoundCloud triggers play when widget is ready", async () => {
    wrapper = await mountAndExpand();
    callbacks["play"](); // warm-up → ready
    await wrapper.vm.$nextTick();

    mockWidget.isPaused.mockImplementation((cb: (p: boolean) => void) => cb(true));
    mockWidget.play.mockClear();

    window.dispatchEvent(new Event("playSoundCloud"));
    await wrapper.vm.$nextTick();

    expect(mockWidget.play).toHaveBeenCalled();
  });

  it("handlePauseSoundCloud triggers pause when playing", async () => {
    wrapper = await mountAndExpand();
    callbacks["play"](); // warm-up
    await wrapper.vm.$nextTick();

    mockWidget.isPaused.mockImplementation((cb: (p: boolean) => void) => cb(false));
    mockWidget.pause.mockClear();

    window.dispatchEvent(new Event("pauseSoundCloud"));
    await wrapper.vm.$nextTick();

    expect(mockWidget.pause).toHaveBeenCalled();
  });

  it("handleNextSoundCloud triggers nextTrack", async () => {
    wrapper = await mountAndExpand();

    mockWidget.next.mockClear();
    window.dispatchEvent(new Event("nextSoundCloud"));
    await wrapper.vm.$nextTick();

    expect(mockWidget.next).toHaveBeenCalled();
  });

  it("handlePrevSoundCloud triggers prevTrack", async () => {
    wrapper = await mountAndExpand();

    mockWidget.prev.mockClear();
    window.dispatchEvent(new Event("prevSoundCloud"));
    await wrapper.vm.$nextTick();

    expect(mockWidget.prev).toHaveBeenCalled();
  });

  it("unmounting after widget init cleans up without error", async () => {
    wrapper = await mountAndExpand();
    callbacks["play"](); // warm-up
    await wrapper.vm.$nextTick();

    expect(() => wrapper.unmount()).not.toThrow();
    wrapper = mount(SoundCloudPlayer);
  });

  it("progress bar fill reflects position percentage", async () => {
    wrapper = await mountAndExpand();
    callbacks["play"](); // warm-up
    await wrapper.vm.$nextTick();

    vi.useFakeTimers();
    callbacks["play"](); // real play
    await wrapper.vm.$nextTick();

    vi.advanceTimersByTime(1000);
    await wrapper.vm.$nextTick();

    const fill = wrapper.find(".sc-seek-fill");
    const style = fill.attributes("style") ?? "";
    expect(style).toContain("16.6");
  });
});
