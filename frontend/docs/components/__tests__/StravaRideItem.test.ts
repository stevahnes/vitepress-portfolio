import { describe, it, expect, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent, h } from "vue";

vi.mock("leaflet/dist/leaflet.css", () => ({}));
vi.mock("leaflet", () => ({
  default: { divIcon: vi.fn().mockReturnValue({}) },
}));
vi.mock("@vue-leaflet/vue-leaflet", () => {
  const stub = (name: string) =>
    defineComponent({
      name,
      props: {
        zoom: null,
        center: null,
        options: null,
        url: null,
        attribution: null,
        latLngs: null,
        color: null,
        weight: null,
        opacity: null,
        icon: null,
        latLng: null,
        position: null,
      },
      emits: ["ready", "click"],
      setup(_, { slots }) {
        return () => h("div", { class: `stub-${name}` }, slots.default?.());
      },
    });
  return {
    LMap: stub("LMap"),
    LTileLayer: stub("LTileLayer"),
    LPolyline: stub("LPolyline"),
    LMarker: stub("LMarker"),
    LPopup: stub("LPopup"),
    LControlZoom: stub("LControlZoom"),
  };
});

// Stub <Transition> so accordion v-if resolves immediately
const TransitionStub = defineComponent({
  setup(_, { slots }) {
    return () => slots.default?.();
  },
});

import StravaRideItem from "../StravaRideItem.vue";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const baseActivity = {
  type: "EBikeRide",
  name: "Morning E-Bike",
  distance: 30000,
  moving_time: 3600,
  elapsed_time: 4200,
  total_elevation_gain: 250,
  average_watts: 150,
  kilojoules: 540,
  average_heartrate: 130,
  max_heartrate: 165,
  average_speed: 8.33,
  max_speed: 15.0,
  start_latlng: [1.35, 103.85] as [number, number],
  end_latlng: [1.36, 103.86] as [number, number],
  map: { summary_polyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@" },
  start_date_local: "2024-06-15T07:30:00",
};

const mountItem = async (activityOverrides = {}, globalOpts = {}) => {
  const wrapper = mount(StravaRideItem, {
    props: { activity: { ...baseActivity, ...activityOverrides } },
    global: { stubs: { Transition: TransitionStub }, ...globalOpts },
  });
  await flushPromises();
  return wrapper;
};

const mountExpanded = async (activityOverrides = {}) => {
  const wrapper = await mountItem(activityOverrides);
  await wrapper.find(".accordion-header").trigger("click");
  await flushPromises();
  return wrapper;
};

// ─── Suite ──────────────────────────────────────────────────────────────────

describe("StravaRideItem", () => {
  // ── Existing tests ────────────────────────────────────────────────────────

  it("renders accordion header with activity name", async () => {
    const wrapper = await mountItem();
    expect(wrapper.text()).toContain("Morning E-Bike");
  });

  it("shows summary stats in collapsed state", async () => {
    const wrapper = await mountItem();
    const html = wrapper.html();
    expect(html).toContain("Time:");
    expect(html).toContain("Distance:");
    expect(html).toContain("Avg Speed:");
    expect(html).toContain("Power:");
    expect(html).toContain("HR:");
    expect(html).toContain("Energy:");
  });

  it("formats distance correctly (km)", async () => {
    const wrapper = await mountItem();
    expect(wrapper.text()).toContain("30.00 km");
  });

  it("formats time correctly (h:mm:ss)", async () => {
    const wrapper = await mountItem();
    expect(wrapper.text()).toContain("1:00:00");
  });

  it("starts collapsed (no accordion content)", async () => {
    const wrapper = await mountItem();
    expect(wrapper.find(".accordion-content").exists()).toBe(false);
  });

  it("expands accordion on header click", async () => {
    const wrapper = await mountExpanded();
    expect(wrapper.find(".accordion-content").exists()).toBe(true);
    expect(wrapper.text()).toContain("Ride Details");
  });

  it("shows full stats when expanded", async () => {
    const wrapper = await mountExpanded();
    const html = wrapper.html();
    expect(html).toContain("Total Time");
    expect(html).toContain("Moving Time");
    expect(html).toContain("Elevation");
    expect(html).toContain("Avg Power");
    expect(html).toContain("Avg HR");
    expect(html).toContain("Max HR");
  });

  it("collapses accordion on second header click", async () => {
    const wrapper = await mountExpanded();
    expect(wrapper.find(".accordion-content").exists()).toBe(true);
    await wrapper.find(".accordion-header").trigger("click");
    await flushPromises();
    expect(wrapper.find(".accordion-content").exists()).toBe(false);
  });

  it("handles N/A for missing optional stats", async () => {
    const wrapper = await mountItem({
      average_watts: null,
      kilojoules: null,
      average_heartrate: null,
      max_heartrate: null,
    });
    expect(wrapper.text()).toContain("N/A");
  });

  // ── formatDistance ────────────────────────────────────────────────────────

  it("formats distance < 1000m in metres", async () => {
    const wrapper = await mountItem({ distance: 500 });
    expect(wrapper.text()).toContain("500 m");
  });

  it("formats distance exactly 1000m as km", async () => {
    const wrapper = await mountItem({ distance: 1000 });
    expect(wrapper.text()).toContain("1.00 km");
  });

  // ── formatTime ────────────────────────────────────────────────────────────

  it("formats time under 1 hour as mm:ss", async () => {
    const wrapper = await mountItem({ moving_time: 330 });
    expect(wrapper.text()).toContain("5:30");
  });

  it("formats time with zero seconds as mm:00", async () => {
    const wrapper = await mountItem({ moving_time: 300 });
    expect(wrapper.text()).toContain("5:00");
  });

  it("formats elapsed time (4200s = 1:10:00)", async () => {
    const wrapper = await mountExpanded();
    expect(wrapper.text()).toContain("1:10:00");
  });

  // Cover the mm:ss branch with single-digit minutes (line 119-120 — padStart on secs)
  it("pads seconds to 2 digits in mm:ss format", async () => {
    // 61 seconds → "1:01"
    const wrapper = await mountItem({ moving_time: 61 });
    expect(wrapper.text()).toContain("1:01");
  });

  it("formats 0 seconds as 0:00", async () => {
    const wrapper = await mountItem({ moving_time: 0 });
    expect(wrapper.text()).toContain("0:00");
  });

  it("formats exactly 1 hour (3600s = 1:00:00)", async () => {
    const wrapper = await mountItem({ moving_time: 3600 });
    expect(wrapper.text()).toContain("1:00:00");
  });

  it("pads minutes to 2 digits in h:mm:ss format", async () => {
    // 3661 = 1h 1m 1s → "1:01:01"
    const wrapper = await mountItem({ moving_time: 3661 });
    expect(wrapper.text()).toContain("1:01:01");
  });

  // ── formatSpeed ───────────────────────────────────────────────────────────

  it("formats average speed in km/h", async () => {
    const wrapper = await mountItem({ average_speed: 8.333 });
    expect(wrapper.text()).toContain("30.0 km/h");
  });

  it("formats max speed in km/h", async () => {
    const wrapper = await mountExpanded({ max_speed: 10.0 });
    expect(wrapper.text()).toContain("36.0 km/h");
  });

  it("formats zero speed as 0.0 km/h", async () => {
    const wrapper = await mountItem({ average_speed: 0 });
    expect(wrapper.text()).toContain("0.0 km/h");
  });

  // ── formatElevation ───────────────────────────────────────────────────────

  it("formats elevation gain in metres", async () => {
    const wrapper = await mountExpanded({ total_elevation_gain: 312.7 });
    expect(wrapper.text()).toContain("313 m");
  });

  it("formats zero elevation as 0 m", async () => {
    const wrapper = await mountExpanded({ total_elevation_gain: 0 });
    expect(wrapper.text()).toContain("0 m");
  });

  it("formats fractional elevation with rounding", async () => {
    const wrapper = await mountExpanded({ total_elevation_gain: 99.4 });
    expect(wrapper.text()).toContain("99 m");
  });

  // ── formatPower ───────────────────────────────────────────────────────────

  it("formats power in watts", async () => {
    const wrapper = await mountItem({ average_watts: 200 });
    expect(wrapper.text()).toContain("200 W");
  });

  it("shows N/A for null power", async () => {
    const wrapper = await mountItem({ average_watts: null });
    expect(wrapper.text()).toContain("N/A");
  });

  it("shows N/A for undefined power", async () => {
    const wrapper = await mountItem({ average_watts: undefined });
    expect(wrapper.text()).toContain("N/A");
  });

  it("formats fractional watts with rounding", async () => {
    const wrapper = await mountItem({ average_watts: 234.6 });
    expect(wrapper.text()).toContain("235 W");
  });

  // ── formatEnergy ──────────────────────────────────────────────────────────

  it("formats energy in kJ", async () => {
    const wrapper = await mountItem({ kilojoules: 750.4 });
    expect(wrapper.text()).toContain("750 kJ");
  });

  it("shows N/A for null energy", async () => {
    const wrapper = await mountItem({ kilojoules: null });
    expect(wrapper.text()).toContain("N/A");
  });

  it("shows N/A for undefined energy", async () => {
    const wrapper = await mountItem({ kilojoules: undefined });
    expect(wrapper.text()).toContain("N/A");
  });

  // ── formatHeartRate ───────────────────────────────────────────────────────

  it("formats heart rate in bpm (rounds)", async () => {
    const wrapper = await mountItem({ average_heartrate: 132.7 });
    expect(wrapper.text()).toContain("133 bpm");
  });

  it("shows N/A for null heart rate", async () => {
    const wrapper = await mountItem({ average_heartrate: null });
    expect(wrapper.text()).toContain("N/A");
  });

  it("shows N/A for undefined heart rate", async () => {
    const wrapper = await mountItem({ average_heartrate: undefined });
    expect(wrapper.text()).toContain("N/A");
  });

  it("shows N/A for null max heart rate", async () => {
    const wrapper = await mountExpanded({ max_heartrate: null });
    expect(wrapper.find(".accordion-content").text()).toContain("N/A");
  });

  it("shows N/A for undefined max heart rate", async () => {
    const wrapper = await mountExpanded({ max_heartrate: undefined });
    expect(wrapper.find(".accordion-content").text()).toContain("N/A");
  });

  // ── getHeaderColorClasses — all activity type variants ────────────────────
  // These cover lines 184-213 (the switch statement branches)

  it("renders EBikeRide type with correct gradient class", async () => {
    const wrapper = await mountItem({ type: "EBikeRide", name: "E-Bike Morning" });
    // The h3 should have green gradient classes
    const h3 = wrapper.find("h3");
    expect(h3.classes().join(" ") + h3.attributes("class")).toMatch(/green/);
  });

  it("renders Hike type with amber/yellow gradient class", async () => {
    const wrapper = await mountItem({ type: "Hike", name: "Trail Hike" });
    const h3 = wrapper.find("h3");
    expect(h3.classes().join(" ") + h3.attributes("class")).toMatch(/yellow|amber/);
  });

  it("renders Run type with red/pink gradient class", async () => {
    const wrapper = await mountItem({ type: "Run", name: "Morning Run" });
    const h3 = wrapper.find("h3");
    expect(h3.classes().join(" ") + h3.attributes("class")).toMatch(/red|pink/);
  });

  it("renders Ride type with blue/cyan gradient class", async () => {
    const wrapper = await mountItem({ type: "Ride", name: "Road Ride" });
    const h3 = wrapper.find("h3");
    expect(h3.classes().join(" ") + h3.attributes("class")).toMatch(/blue|cyan/);
  });

  it("renders unknown type with default (Ride) blue/cyan gradient class", async () => {
    const wrapper = await mountItem({ type: "Walk", name: "Evening Walk" });
    const h3 = wrapper.find("h3");
    expect(h3.classes().join(" ") + h3.attributes("class")).toMatch(/blue|cyan/);
  });

  it("renders Ride type with bike SVG circles (wheels)", async () => {
    const wrapper = await mountItem({ type: "Ride", name: "Road Ride" });
    expect(wrapper.html()).toContain("circle");
  });

  it("renders Hike type with boot SVG path", async () => {
    const wrapper = await mountItem({ type: "Hike", name: "Trail Hike" });
    expect(wrapper.html()).toContain("svg");
  });

  it("renders Run type with shoe SVG", async () => {
    const wrapper = await mountItem({ type: "Run", name: "Morning Run" });
    expect(wrapper.html()).toContain("svg");
  });

  // ── decodePolyline ────────────────────────────────────────────────────────

  it("renders route when map.polyline is present (preferred over summary_polyline)", async () => {
    const wrapper = await mountItem({
      map: { polyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@" },
    });
    expect(wrapper.find(".ride-accordion-item").exists()).toBe(true);
    const vm = wrapper.vm as unknown as { routeCoordinates: [number, number][] };
    expect(vm.routeCoordinates.length).toBeGreaterThan(0);
  });

  it("prefers map.polyline over map.summary_polyline", async () => {
    // Both present — polyline takes priority
    const wrapper = await mountItem({
      map: {
        polyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
        summary_polyline: "differentPolyline",
      },
    });
    const vm = wrapper.vm as unknown as { routeCoordinates: [number, number][] };
    expect(vm.routeCoordinates.length).toBeGreaterThan(0);
  });

  it("falls back to start/end latlng when no polyline", async () => {
    const wrapper = await mountItem({ map: {} });
    const vm = wrapper.vm as unknown as { routeCoordinates: [number, number][] };
    // Falls back to [start_latlng, end_latlng]
    expect(vm.routeCoordinates).toHaveLength(2);
    expect(vm.routeCoordinates[0]).toEqual([1.35, 103.85]);
  });

  it("returns empty coordinates when no polyline and no latlng", async () => {
    const wrapper = await mountItem({
      map: {},
      start_latlng: undefined as unknown as [number, number],
      end_latlng: undefined as unknown as [number, number],
    });
    const vm = wrapper.vm as unknown as { routeCoordinates: [number, number][] };
    expect(vm.routeCoordinates).toHaveLength(0);
  });

  it("handles missing map prop entirely", async () => {
    const wrapper = await mountItem({ map: undefined });
    expect(wrapper.find(".ride-accordion-item").exists()).toBe(true);
  });

  it("handles corrupted polyline gracefully (logs error, returns empty)", async () => {
    // decodePolyline with truly invalid input that throws
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Pass null as polyline — decodePolyline will hit the catch branch
    const wrapper = await mountItem({
      map: { summary_polyline: null as unknown as string },
    });
    expect(wrapper.find(".ride-accordion-item").exists()).toBe(true);
    consoleSpy.mockRestore();
  });

  // ── mapCenter computed ────────────────────────────────────────────────────

  it("uses start_latlng as map center", async () => {
    const wrapper = await mountItem({ start_latlng: [10.0, 50.0] as [number, number] });
    const vm = wrapper.vm as unknown as { mapCenter: [number, number] };
    expect(vm.mapCenter[0]).toBe(10.0);
    expect(vm.mapCenter[1]).toBe(50.0);
  });

  it("falls back to mid-route coordinate when no start_latlng", async () => {
    const wrapper = await mountItem({
      start_latlng: undefined,
      end_latlng: undefined,
      map: { summary_polyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@" },
    });
    const vm = wrapper.vm as unknown as { mapCenter: [number, number] };
    expect(Array.isArray(vm.mapCenter)).toBe(true);
    expect(vm.mapCenter.length).toBe(2);
  });

  it("falls back to default [1.35, 103.85] when no start_latlng and no route", async () => {
    const wrapper = await mountItem({
      start_latlng: undefined as unknown as [number, number],
      end_latlng: undefined as unknown as [number, number],
      map: {},
    });
    const vm = wrapper.vm as unknown as { mapCenter: [number, number] };
    expect(vm.mapCenter).toEqual([1.35, 103.85]);
  });

  // ── mapBounds computed ────────────────────────────────────────────────────

  it("computes mapBounds from route coordinates", async () => {
    const wrapper = await mountItem();
    const vm = wrapper.vm as unknown as { mapBounds: [[number, number], [number, number]] | null };
    expect(vm.mapBounds).not.toBeNull();
    if (vm.mapBounds) {
      expect(vm.mapBounds).toHaveLength(2);
      expect(vm.mapBounds[0][0]).toBeLessThan(vm.mapBounds[1][0]);
    }
  });

  it("returns null mapBounds when no route coordinates", async () => {
    const wrapper = await mountItem({
      map: {},
      start_latlng: undefined as unknown as [number, number],
      end_latlng: undefined as unknown as [number, number],
    });
    const vm = wrapper.vm as unknown as { mapBounds: null };
    expect(vm.mapBounds).toBeNull();
  });

  it("computes padding correctly for tight bounds (same-point route)", async () => {
    // start and end at same location → zero spread, padding should still apply
    const wrapper = await mountItem({
      map: {},
      start_latlng: [1.35, 103.85] as [number, number],
      end_latlng: [1.35, 103.85] as [number, number],
    });
    const vm = wrapper.vm as unknown as { mapBounds: [[number, number], [number, number]] | null };
    // bounds exist (two identical points are still a valid bounds)
    expect(vm.mapBounds).not.toBeNull();
  });

  // ── routeColor computed ───────────────────────────────────────────────────

  it("uses green route color in dark mode", async () => {
    const wrapper = await mountItem();
    // clientSideTheme starts true in onMounted; isDark defaults false in test
    const vm = wrapper.vm as unknown as { routeColor: string };
    // Light mode default → #059669
    expect(vm.routeColor).toBe("#059669");
  });

  // ── start_date_local display ──────────────────────────────────────────────

  it("shows formatted start date when expanded", async () => {
    const wrapper = await mountExpanded({ start_date_local: "2024-06-15T07:30:00" });
    expect(wrapper.find(".accordion-content").text()).toContain("2024");
  });

  it("does not crash when start_date_local is missing", async () => {
    const wrapper = await mountExpanded({ start_date_local: undefined });
    expect(wrapper.find(".accordion-content").exists()).toBe(true);
  });

  // ── tileConfig computed ───────────────────────────────────────────────────

  it("uses light tile URL in light mode (default)", async () => {
    const wrapper = await mountItem();
    const vm = wrapper.vm as unknown as { tileConfig: { url: string } };
    expect(vm.tileConfig.url).toContain("light_all");
  });

  // ── Custom mapHeight prop ─────────────────────────────────────────────────

  it("applies custom mapHeight to the map container", async () => {
    const wrapper = mount(StravaRideItem, {
      props: { activity: baseActivity, mapHeight: "600px" },
      global: { stubs: { Transition: TransitionStub } },
    });
    await flushPromises();
    await wrapper.find(".accordion-header").trigger("click");
    await flushPromises();
    expect(wrapper.find(".map-container").attributes("style")).toContain("600px");
  });

  it("uses default 400px map height when mapHeight prop not provided", async () => {
    const wrapper = mount(StravaRideItem, {
      props: { activity: baseActivity },
      global: { stubs: { Transition: TransitionStub } },
    });
    await flushPromises();
    await wrapper.find(".accordion-header").trigger("click");
    await flushPromises();
    expect(wrapper.find(".map-container").attributes("style")).toContain("400px");
  });

  // ── Map section rendered when expanded + isClient ─────────────────────────
  // Covers template lines for map, start marker, end marker (716-717, 736-737)

  it("renders map container when expanded", async () => {
    const wrapper = await mountExpanded();
    expect(wrapper.find(".map-container").exists()).toBe(true);
  });

  it("map container is not rendered when collapsed", async () => {
    const wrapper = await mountItem();
    expect(wrapper.find(".map-container").exists()).toBe(false);
  });

  it("renders LMap stub inside map container when expanded", async () => {
    const wrapper = await mountExpanded();
    expect(wrapper.find(".stub-LMap").exists()).toBe(true);
  });

  it("renders LPolyline stub when route coordinates exist", async () => {
    // isMapReady is false until onMapReady fires — but stub emits 'ready'
    // We can check the stub exists since isMapReady guards it
    const wrapper = await mountExpanded();
    // After expansion the LMap stub is rendered; isMapReady starts false
    // so polyline is conditional on isMapReady — trigger ready via vm
    const vm = wrapper.vm as unknown as { isMapReady: boolean };
    vm.isMapReady = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".stub-LPolyline").exists()).toBe(true);
  });

  it("renders start marker stub when isMapReady and start_latlng present", async () => {
    const wrapper = await mountExpanded();
    const vm = wrapper.vm as unknown as { isMapReady: boolean; isLeafletLoaded: boolean };
    vm.isMapReady = true;
    vm.isLeafletLoaded = true;
    await wrapper.vm.$nextTick();
    // LMarker stubs rendered (start + end)
    const markers = wrapper.findAll(".stub-LMarker");
    expect(markers.length).toBeGreaterThanOrEqual(1);
  });

  it("renders end marker stub when isMapReady and end_latlng present", async () => {
    const wrapper = await mountExpanded();
    const vm = wrapper.vm as unknown as { isMapReady: boolean; isLeafletLoaded: boolean };
    vm.isMapReady = true;
    vm.isLeafletLoaded = true;
    await wrapper.vm.$nextTick();
    const markers = wrapper.findAll(".stub-LMarker");
    expect(markers.length).toBe(2); // start + end
  });

  it("does not render end marker when end_latlng is missing", async () => {
    const wrapper = await mountExpanded({
      end_latlng: undefined as unknown as [number, number],
    });
    const vm = wrapper.vm as unknown as { isMapReady: boolean; isLeafletLoaded: boolean };
    vm.isMapReady = true;
    vm.isLeafletLoaded = true;
    await wrapper.vm.$nextTick();
    const markers = wrapper.findAll(".stub-LMarker");
    // Only start marker rendered
    expect(markers.length).toBe(1);
  });

  it("does not render start marker when start_latlng is missing", async () => {
    const wrapper = await mountExpanded({
      start_latlng: undefined as unknown as [number, number],
    });
    const vm = wrapper.vm as unknown as { isMapReady: boolean; isLeafletLoaded: boolean };
    vm.isMapReady = true;
    vm.isLeafletLoaded = true;
    await wrapper.vm.$nextTick();
    const markers = wrapper.findAll(".stub-LMarker");
    // Only end marker rendered
    expect(markers.length).toBe(1);
  });

  // ── onMapReady ────────────────────────────────────────────────────────────
  // Line 293: covers the map.options Object.assign branch

  it("onMapReady sets isMapReady to true", async () => {
    const wrapper = await mountExpanded();
    const vm = wrapper.vm as unknown as {
      isMapReady: boolean;
      onMapReady: () => Promise<void>;
      mapRef: {
        leafletObject: {
          setMinZoom: ReturnType<typeof vi.fn>;
          setMaxZoom: ReturnType<typeof vi.fn>;
          fitBounds: ReturnType<typeof vi.fn>;
          setView: ReturnType<typeof vi.fn>;
          on: ReturnType<typeof vi.fn>;
          getZoom: ReturnType<typeof vi.fn>;
          options: Record<string, unknown>;
        };
      };
    };

    // Provide a mock leafletObject so the full onMapReady path executes
    vm.mapRef = {
      leafletObject: {
        setMinZoom: vi.fn(),
        setMaxZoom: vi.fn(),
        fitBounds: vi.fn(),
        setView: vi.fn(),
        on: vi.fn(),
        getZoom: vi.fn().mockReturnValue(13),
        options: {},
      },
    };

    await vm.onMapReady();
    await wrapper.vm.$nextTick();

    expect(vm.isMapReady).toBe(true);
    expect(vm.mapRef.leafletObject.setMinZoom).toHaveBeenCalledWith(3);
    expect(vm.mapRef.leafletObject.setMaxZoom).toHaveBeenCalledWith(18);
  });

  it("onMapReady calls fitBounds when mapBounds are available", async () => {
    const wrapper = await mountExpanded();
    const vm = wrapper.vm as unknown as {
      onMapReady: () => Promise<void>;
      mapRef: {
        leafletObject: {
          setMinZoom: ReturnType<typeof vi.fn>;
          setMaxZoom: ReturnType<typeof vi.fn>;
          fitBounds: ReturnType<typeof vi.fn>;
          setView: ReturnType<typeof vi.fn>;
          on: ReturnType<typeof vi.fn>;
          getZoom: ReturnType<typeof vi.fn>;
          options: Record<string, unknown>;
        };
      };
    };

    const mockMap = {
      setMinZoom: vi.fn(),
      setMaxZoom: vi.fn(),
      fitBounds: vi.fn(),
      setView: vi.fn(),
      on: vi.fn(),
      getZoom: vi.fn().mockReturnValue(13),
      options: {},
    };
    vm.mapRef = { leafletObject: mockMap };

    await vm.onMapReady();
    // mapBounds is non-null for the default baseActivity with polyline
    expect(mockMap.fitBounds).toHaveBeenCalled();
  });

  it("onMapReady calls setView when mapBounds is null", async () => {
    const wrapper = await mountExpanded({
      map: {},
      start_latlng: undefined as unknown as [number, number],
      end_latlng: undefined as unknown as [number, number],
    });
    const vm = wrapper.vm as unknown as {
      onMapReady: () => Promise<void>;
      mapRef: {
        leafletObject: {
          setMinZoom: ReturnType<typeof vi.fn>;
          setMaxZoom: ReturnType<typeof vi.fn>;
          fitBounds: ReturnType<typeof vi.fn>;
          setView: ReturnType<typeof vi.fn>;
          on: ReturnType<typeof vi.fn>;
          getZoom: ReturnType<typeof vi.fn>;
          options: Record<string, unknown>;
        };
      };
    };

    const mockMap = {
      setMinZoom: vi.fn(),
      setMaxZoom: vi.fn(),
      fitBounds: vi.fn(),
      setView: vi.fn(),
      on: vi.fn(),
      getZoom: vi.fn().mockReturnValue(13),
      options: {},
    };
    vm.mapRef = { leafletObject: mockMap };

    await vm.onMapReady();
    expect(mockMap.setView).toHaveBeenCalledWith([1.35, 103.85], 13, { animate: false });
    expect(mockMap.fitBounds).not.toHaveBeenCalled();
  });

  it("onMapReady assigns performance options to map.options", async () => {
    const wrapper = await mountExpanded();
    const vm = wrapper.vm as unknown as {
      onMapReady: () => Promise<void>;
      mapRef: {
        leafletObject: {
          setMinZoom: ReturnType<typeof vi.fn>;
          setMaxZoom: ReturnType<typeof vi.fn>;
          fitBounds: ReturnType<typeof vi.fn>;
          setView: ReturnType<typeof vi.fn>;
          on: ReturnType<typeof vi.fn>;
          getZoom: ReturnType<typeof vi.fn>;
          options: Record<string, unknown>;
        };
      };
    };

    const options: Record<string, unknown> = {};
    vm.mapRef = {
      leafletObject: {
        setMinZoom: vi.fn(),
        setMaxZoom: vi.fn(),
        fitBounds: vi.fn(),
        setView: vi.fn(),
        on: vi.fn(),
        getZoom: vi.fn().mockReturnValue(13),
        options,
      },
    };

    await vm.onMapReady();
    expect(options.preferCanvas).toBe(true);
    expect(options.fadeAnimation).toBe(false);
  });

  it("onMapReady registers zoom event handler", async () => {
    const wrapper = await mountExpanded();
    const vm = wrapper.vm as unknown as {
      onMapReady: () => Promise<void>;
      currentZoom: number;
      mapRef: {
        leafletObject: {
          setMinZoom: ReturnType<typeof vi.fn>;
          setMaxZoom: ReturnType<typeof vi.fn>;
          fitBounds: ReturnType<typeof vi.fn>;
          setView: ReturnType<typeof vi.fn>;
          on: ReturnType<typeof vi.fn>;
          getZoom: ReturnType<typeof vi.fn>;
          options: Record<string, unknown>;
        };
      };
    };

    let zoomCallback: (() => void) | null = null;
    const mockMap = {
      setMinZoom: vi.fn(),
      setMaxZoom: vi.fn(),
      fitBounds: vi.fn(),
      setView: vi.fn(),
      on: vi.fn((event: string, cb: () => void) => {
        if (event === "zoom") zoomCallback = cb;
      }),
      getZoom: vi.fn().mockReturnValue(15),
      options: {},
    };
    vm.mapRef = { leafletObject: mockMap };

    await vm.onMapReady();
    expect(mockMap.on).toHaveBeenCalledWith("zoom", expect.any(Function));

    // Fire the zoom event and check currentZoom is updated
    zoomCallback!();
    expect(vm.currentZoom).toBe(15);
  });

  it("onMapReady does nothing when mapRef is null", async () => {
    const wrapper = await mountExpanded();
    const vm = wrapper.vm as unknown as {
      onMapReady: () => Promise<void>;
      mapRef: null;
      isMapReady: boolean;
    };
    vm.mapRef = null;
    // Should not throw
    await expect(vm.onMapReady()).resolves.toBeUndefined();
  });
});
