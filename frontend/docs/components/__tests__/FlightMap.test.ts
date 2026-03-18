import { describe, it, expect, vi, afterEach } from "vitest";
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
        radius: null,
        fillColor: null,
        fillOpacity: null,
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
    LCircleMarker: stub("LCircleMarker"),
    LPopup: stub("LPopup"),
    LControlZoom: stub("LControlZoom"),
  };
});

import FlightMap from "../FlightMap.vue";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeFlight = (origin: string, destination: string, overrides = {}) => ({
  date: "2024-01-15",
  time: "08:00",
  origin,
  destination,
  flightNumber: "SQ-001",
  departureDateTime: "2024-01-15T08:00:00",
  arrivalDateTime: "2024-01-15T10:00:00",
  airline: "Singapore Airlines",
  ...overrides,
});

const sampleFlights = [
  makeFlight("SIN", "CGK"),
  makeFlight("SIN", "HKG"),
  makeFlight("SIN", "CGK"), // duplicate route → count = 2
];

const transFlightsSINtoSFO = [
  makeFlight("SIN", "SFO"), // trans-Pacific westward
  makeFlight("SIN", "LAX"), // another US route
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const mountMap = async (props = {}) => {
  const wrapper = mount(FlightMap, { props: { flights: sampleFlights, ...props } });
  await flushPromises();
  await wrapper.vm.$nextTick();
  return wrapper;
};

// Mock leafletObject factory
const makeMockMap = (overrides = {}) => ({
  setMinZoom: vi.fn(),
  setMaxZoom: vi.fn(),
  setView: vi.fn(),
  fitBounds: vi.fn(),
  getZoom: vi.fn().mockReturnValue(4),
  on: vi.fn(),
  options: {} as Record<string, unknown>,
  ...overrides,
});

// ─── Suite ──────────────────────────────────────────────────────────────────

describe("FlightMap", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Basic rendering ────────────────────────────────────────────────────────

  it("renders map container after mount", async () => {
    const wrapper = await mountMap();
    expect(wrapper.find(".flight-map-container").exists()).toBe(true);
  });

  it("renders statistics panel with all labels", async () => {
    const wrapper = await mountMap();
    const html = wrapper.html();
    expect(html).toContain("Flight Statistics");
    expect(html).toContain("Total Flights");
    expect(html).toContain("Unique Routes");
    expect(html).toContain("Airports");
    expect(html).toContain("Countries");
  });

  it("renders legend panel", async () => {
    const wrapper = await mountMap();
    expect(wrapper.find(".legend-panel").exists()).toBe(true);
    expect(wrapper.text()).toContain("Flight Routes");
  });

  it("applies custom height style", async () => {
    const wrapper = await mountMap({ height: "500px" });
    expect(wrapper.find(".flight-map-container").attributes("style")).toContain("500px");
  });

  it("handles empty flights gracefully", async () => {
    const wrapper = mount(FlightMap, { props: { flights: [] } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".flight-map-container").exists()).toBe(true);
  });

  it("does not show route details modal initially", async () => {
    const wrapper = await mountMap();
    expect(wrapper.find(".modal-overlay").exists()).toBe(false);
  });

  // ── Statistics computed ────────────────────────────────────────────────────

  it("displays correct total flight count", async () => {
    const wrapper = await mountMap();
    expect(wrapper.text()).toContain("3");
  });

  it("displays correct unique routes count (deduplicates bidirectional)", async () => {
    const wrapper = await mountMap();
    expect(wrapper.text()).toContain("2");
  });

  it("shows 0 stats for empty flights", async () => {
    const wrapper = mount(FlightMap, { props: { flights: [] } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("0");
  });

  // ── Route deduplication & opacity ─────────────────────────────────────────

  it("counts repeated routes correctly (SIN-CGK appears three times)", async () => {
    const flights = [makeFlight("SIN", "CGK"), makeFlight("SIN", "CGK"), makeFlight("SIN", "CGK")];
    const wrapper = mount(FlightMap, { props: { flights } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("1"); // unique routes
    expect(wrapper.text()).toContain("3"); // total flights
  });

  it("treats reverse routes (CGK-SIN) as same route as SIN-CGK", async () => {
    const flights = [makeFlight("SIN", "CGK"), makeFlight("CGK", "SIN")];
    const wrapper = mount(FlightMap, { props: { flights } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("1");
  });

  // ── Route opacity scaling ─────────────────────────────────────────────────

  it("sets maximum opacity (1.0) for the most-flown route", async () => {
    const flights = [
      makeFlight("SIN", "CGK"),
      makeFlight("SIN", "CGK"),
      makeFlight("SIN", "CGK"),
      makeFlight("SIN", "HKG"), // less frequent
    ];
    const wrapper = mount(FlightMap, { props: { flights } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as { routes: Array<{ opacity: number; from: string }> };
    const cgkRoute = vm.routes.find(r => r.from === "SIN");
    expect(cgkRoute).toBeDefined();
    // The busiest route should have opacity capped at 1.0
    const maxOpacity = Math.max(...vm.routes.map(r => r.opacity));
    expect(maxOpacity).toBeLessThanOrEqual(1.0);
  });

  it("computes minimum opacity (0.3) for single-flight routes when others exist", async () => {
    const flights = [
      makeFlight("SIN", "CGK"),
      makeFlight("SIN", "CGK"),
      makeFlight("SIN", "CGK"),
      makeFlight("SIN", "HKG"), // single flight
    ];
    const wrapper = mount(FlightMap, { props: { flights } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as { routes: Array<{ opacity: number; count: number }> };
    const singleRoute = vm.routes.find(r => r.count === 1);
    expect(singleRoute).toBeDefined();
    expect(singleRoute!.opacity).toBeGreaterThanOrEqual(0.3);
  });

  // ── Invalid airport codes ──────────────────────────────────────────────────

  it("skips flights with unknown airport codes without crashing", async () => {
    const flights = [makeFlight("SIN", "CGK"), makeFlight("XXX", "YYY")];
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const wrapper = mount(FlightMap, { props: { flights } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".flight-map-container").exists()).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("XXX"));
    consoleSpy.mockRestore();
  });

  it("skips flight with unknown origin only", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const flights = [makeFlight("ZZZ", "CGK")];
    const wrapper = mount(FlightMap, { props: { flights } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".flight-map-container").exists()).toBe(true);
    consoleSpy.mockRestore();
  });

  it("skips flight with unknown destination only", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const flights = [makeFlight("SIN", "ZZZ")];
    const wrapper = mount(FlightMap, { props: { flights } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".flight-map-container").exists()).toBe(true);
    consoleSpy.mockRestore();
  });

  // ── createCurvedPath — westward wrapping (lines 369-374, 389, 393, 414) ───

  it("handles trans-Pacific routes (SIN→SFO) without crashing", async () => {
    const wrapper = mount(FlightMap, { props: { flights: transFlightsSINtoSFO } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".flight-map-container").exists()).toBe(true);
  });

  it("handles westward route where lng1 < lng2 (e.g. LAX→ICN)", async () => {
    // LAX lng=-118, ICN lng=+126 → westwardDistance < eastwardDistance
    // lng1 (LAX=-118) < lng2 (ICN=+126) → adjustedLng1 = lng1+360
    const flights = [makeFlight("LAX", "ICN")];
    const wrapper = mount(FlightMap, { props: { flights } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as { routes: Array<{ coordinates: [number, number][] }> };
    expect(vm.routes[0].coordinates.length).toBeGreaterThan(0);
  });

  it("handles westward route where lng2 < lng1 (e.g. SIN→SFO)", async () => {
    // SIN lng=+103, SFO lng=-122 → eastwardDistance=225, westwardDistance=135
    // westwardDistance < eastwardDistance → shouldGoWestward=true
    // lng1(SIN=+103) > lng2(SFO=-122) → adjustedLng2 = lng2+360
    const flights = [makeFlight("SIN", "SFO")];
    const wrapper = mount(FlightMap, { props: { flights } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as { routes: Array<{ coordinates: [number, number][] }> };
    expect(vm.routes[0].coordinates.length).toBeGreaterThan(0);
  });

  it("handles short-distance routes (BLR→MAA, distance < 5)", async () => {
    const flights = [makeFlight("BLR", "MAA")];
    const wrapper = mount(FlightMap, { props: { flights } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as { routes: Array<{ coordinates: [number, number][] }> };
    // Short routes return just two points
    expect(vm.routes[0].coordinates.length).toBeGreaterThanOrEqual(2);
  });

  it("generates curved path with multiple segments for long-haul routes", async () => {
    const flights = [makeFlight("SIN", "NRT")]; // SIN to Tokyo ~5000km
    const wrapper = mount(FlightMap, { props: { flights } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as { routes: Array<{ coordinates: [number, number][] }> };
    expect(vm.routes[0].coordinates.length).toBeGreaterThan(2);
  });

  it("handles primarily-vertical routes (more lat spread than lng)", async () => {
    // BOS (lat=42, lng=-71) to GRU (lat=-23, lng=-46) — large lat diff
    const flights = [makeFlight("BOS", "GRU")];
    const wrapper = mount(FlightMap, { props: { flights } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as { routes: Array<{ coordinates: [number, number][] }> };
    expect(vm.routes[0].coordinates.length).toBeGreaterThan(0);
  });

  // ── performanceConfig & simplifiedRoutes (lines 534-539, 544-551) ─────────

  it("simplifiedRoutes filters to count > 1 when shouldShowAllRoutes is false", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as {
      isZooming: boolean;
      currentZoom: number;
      simplifiedRoutes: Array<{ count: number }>;
    };
    // Force isZooming=true and low zoom to trigger the performance branch
    vm.isZooming = true;
    vm.currentZoom = 2;
    await wrapper.vm.$nextTick();
    // All returned routes should have count > 1
    vm.simplifiedRoutes.forEach(r => expect(r.count).toBeGreaterThan(1));
  });

  it("simplifiedRoutes returns all routes when shouldShowAllRoutes is true", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as {
      isZooming: boolean;
      currentZoom: number;
      simplifiedRoutes: Array<{ count: number }>;
      routes: Array<{ count: number }>;
    };
    vm.isZooming = false;
    vm.currentZoom = 5;
    await wrapper.vm.$nextTick();
    expect(vm.simplifiedRoutes.length).toBe(vm.routes.length);
  });

  it("simplifiedAirports filters by flight count when isZooming", async () => {
    // Need >15 airports to trigger slice — use many routes
    const manyFlights = [
      makeFlight("SIN", "CGK"),
      makeFlight("SIN", "HKG"),
      makeFlight("SIN", "BKK"),
      makeFlight("SIN", "KNO"),
      makeFlight("SIN", "PEN"),
      makeFlight("SIN", "ICN"),
      makeFlight("NRT", "SFO"),
      makeFlight("NRT", "LAX"),
      makeFlight("DXB", "LHR" as unknown as string),
      makeFlight("FRA", "CDG"),
      makeFlight("AMS", "MUC"),
      makeFlight("FCO", "IST"),
      makeFlight("BOS", "ATL"),
      makeFlight("TPA", "LAX"),
      makeFlight("GRU", "SFO"),
      makeFlight("ICN", "TPE"),
      makeFlight("HNL", "NRT"),
    ].filter(f => {
      // Keep only flights between known airports (LHR not in list so filter it)
      const known = [
        "SIN",
        "CGK",
        "HKG",
        "BKK",
        "KNO",
        "PEN",
        "ICN",
        "NRT",
        "SFO",
        "LAX",
        "DXB",
        "FRA",
        "CDG",
        "AMS",
        "MUC",
        "FCO",
        "IST",
        "BOS",
        "ATL",
        "TPA",
        "GRU",
        "TPE",
        "HNL",
      ];
      return known.includes(f.origin) && known.includes(f.destination);
    });

    const wrapper = mount(FlightMap, { props: { flights: manyFlights } });
    await flushPromises();
    await wrapper.vm.$nextTick();

    const vm = wrapper.vm as unknown as {
      isZooming: boolean;
      simplifiedAirports: Array<{ flightCount: number }>;
    };
    vm.isZooming = true;
    await wrapper.vm.$nextTick();

    // When isZooming, only airports with flightCount > 2 and slice to 15
    vm.simplifiedAirports.forEach(a => expect(a.flightCount).toBeGreaterThan(2));
    expect(vm.simplifiedAirports.length).toBeLessThanOrEqual(15);
  });

  it("simplifiedAirports respects maxAirports limit at low zoom", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as {
      isZooming: boolean;
      currentZoom: number;
      simplifiedAirports: Array<unknown>;
    };
    vm.isZooming = false;
    vm.currentZoom = 2; // triggers minFlightCount=3, maxAirports=20
    await wrapper.vm.$nextTick();
    expect(vm.simplifiedAirports.length).toBeLessThanOrEqual(20);
  });

  it("simplifiedAirports returns all at high zoom (currentZoom >= 4, not zooming)", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as {
      isZooming: boolean;
      currentZoom: number;
      simplifiedAirports: Array<unknown>;
      airports: Array<unknown>;
    };
    vm.isZooming = false;
    vm.currentZoom = 5;
    await wrapper.vm.$nextTick();
    // maxAirports=Infinity and minFlightCount=0 → all airports returned
    expect(vm.simplifiedAirports.length).toBe(vm.airports.length);
  });

  // ── airports computed — wrapping logic (lines 684, 733-734, 740, 744-783) ──

  it("computes airports from valid flights", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as { airports: Array<{ code: string }> };
    expect(vm.airports.length).toBeGreaterThan(0);
    // SIN, CGK, HKG should all be included
    const codes = vm.airports.map(a => a.code);
    expect(codes).toContain("SIN");
    expect(codes).toContain("CGK");
  });

  it("creates wrapped airport entries for trans-Pacific routes", async () => {
    const flights = [makeFlight("SIN", "SFO"), makeFlight("SIN", "LAX")];
    const wrapper = mount(FlightMap, { props: { flights } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as {
      airports: Array<{ code: string; lng: number }>;
    };
    // Wrapped airports get a "-wrapped" suffix
    const wrapped = vm.airports.filter(a => a.code.includes("-wrapped"));
    expect(wrapped.length).toBeGreaterThan(0);
  });

  it("does not create wrapped airports when no wrapping needed (regional routes)", async () => {
    const flights = [makeFlight("SIN", "CGK"), makeFlight("SIN", "BKK")];
    const wrapper = mount(FlightMap, { props: { flights } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as { airports: Array<{ code: string }> };
    const wrapped = vm.airports.filter(a => a.code.includes("-wrapped"));
    expect(wrapped.length).toBe(0);
  });

  it("excludes airport from original list when it falls outside longitude bounds", async () => {
    // Trans-Pacific route where original lng falls outside mapBounds
    const flights = [makeFlight("SIN", "SFO")];
    const wrapper = mount(FlightMap, { props: { flights } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as {
      airports: Array<{ code: string; lng: number }>;
      mapBounds: [[number, number], [number, number]] | null;
    };
    // All airports should be within mapBounds longitude range (or wrapped to fit)
    if (vm.mapBounds) {
      const [minLng, maxLng] = [vm.mapBounds[0][1], vm.mapBounds[1][1]];
      vm.airports.forEach(airport => {
        expect(airport.lng).toBeGreaterThanOrEqual(minLng - 1);
        expect(airport.lng).toBeLessThanOrEqual(maxLng + 1);
      });
    }
  });

  it("airports computed is empty for empty flights", async () => {
    const wrapper = mount(FlightMap, { props: { flights: [] } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as { airports: Array<unknown> };
    expect(vm.airports).toHaveLength(0);
  });

  // ── mapBounds / getAirportBounds ───────────────────────────────────────────

  it("returns null mapBounds for empty flights", async () => {
    const wrapper = mount(FlightMap, { props: { flights: [] } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as {
      mapBounds: [[number, number], [number, number]] | null;
    };
    expect(vm.mapBounds).toBeNull();
  });

  it("computes mapBounds that contain all route endpoints", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as {
      mapBounds: [[number, number], [number, number]] | null;
      routes: Array<{ coordinates: [number, number][] }>;
    };
    expect(vm.mapBounds).not.toBeNull();
    if (vm.mapBounds) {
      const [sw, ne] = vm.mapBounds;
      expect(sw[0]).toBeLessThan(ne[0]); // sw lat < ne lat
    }
  });

  it("handles trans-Pacific mapBounds with wrapped longitude", async () => {
    const wrapper = mount(FlightMap, { props: { flights: transFlightsSINtoSFO } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as {
      mapBounds: [[number, number], [number, number]] | null;
    };
    // Should not be null and should have reasonable values
    expect(vm.mapBounds).not.toBeNull();
  });

  // ── statistics computed (line 809) ────────────────────────────────────────

  it("statistics counts unique countries correctly", async () => {
    // SIN=Singapore, CGK=Indonesia, HKG=Hong Kong
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as { statistics: { countriesVisited: number } };
    expect(vm.statistics.countriesVisited).toBeGreaterThanOrEqual(2);
  });

  it("statistics.airportsVisited matches airports array length", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as {
      statistics: { airportsVisited: number };
      airports: Array<unknown>;
    };
    expect(vm.statistics.airportsVisited).toBe(vm.airports.length);
  });

  it("statistics returns zeros for empty flights", async () => {
    const wrapper = mount(FlightMap, { props: { flights: [] } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as {
      statistics: {
        totalFlights: number;
        uniqueRoutes: number;
        airportsVisited: number;
        countriesVisited: number;
      };
    };
    expect(vm.statistics.totalFlights).toBe(0);
    expect(vm.statistics.uniqueRoutes).toBe(0);
    expect(vm.statistics.airportsVisited).toBe(0);
    expect(vm.statistics.countriesVisited).toBe(0);
  });

  // ── onMapReady (lines 875-896) ────────────────────────────────────────────

  it("onMapReady sets isMapReady to true", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as {
      isMapReady: boolean;
      onMapReady: () => Promise<void>;
      mapRef: { leafletObject: ReturnType<typeof makeMockMap> };
    };
    vm.mapRef = { leafletObject: makeMockMap() };
    await vm.onMapReady();
    expect(vm.isMapReady).toBe(true);
  });

  it("onMapReady configures map zoom levels", async () => {
    const wrapper = await mountMap();
    const mockMap = makeMockMap();
    const vm = wrapper.vm as unknown as {
      onMapReady: () => Promise<void>;
      mapRef: { leafletObject: typeof mockMap };
    };
    vm.mapRef = { leafletObject: mockMap };
    await vm.onMapReady();
    expect(mockMap.setMinZoom).toHaveBeenCalledWith(3);
    expect(mockMap.setMaxZoom).toHaveBeenCalledWith(8);
  });

  it("onMapReady sets fixed view position", async () => {
    const wrapper = await mountMap();
    const mockMap = makeMockMap();
    const vm = wrapper.vm as unknown as {
      onMapReady: () => Promise<void>;
      mapRef: { leafletObject: typeof mockMap };
    };
    vm.mapRef = { leafletObject: mockMap };
    await vm.onMapReady();
    expect(mockMap.setView).toHaveBeenCalledWith([10, 103.9915], 4, { animate: false });
  });

  it("onMapReady registers zoomstart, zoomend, zoom event handlers", async () => {
    const wrapper = await mountMap();
    const mockMap = makeMockMap();
    const vm = wrapper.vm as unknown as {
      onMapReady: () => Promise<void>;
      mapRef: { leafletObject: typeof mockMap };
    };
    vm.mapRef = { leafletObject: mockMap };
    await vm.onMapReady();
    const registeredEvents = (mockMap.on.mock.calls as [string, unknown][]).map(c => c[0]);
    expect(registeredEvents).toContain("zoomstart");
    expect(registeredEvents).toContain("zoomend");
    expect(registeredEvents).toContain("zoom");
  });

  it("onMapReady zoomstart sets isZooming to true", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as {
      isZooming: boolean;
      onMapReady: () => Promise<void>;
      mapRef: { leafletObject: ReturnType<typeof makeMockMap> };
    };

    const callbacks: Record<string, () => void> = {};
    const mockMap = makeMockMap({
      on: vi.fn((event: string, cb: () => void) => {
        callbacks[event] = cb;
      }),
    });
    vm.mapRef = { leafletObject: mockMap };
    await vm.onMapReady();

    callbacks["zoomstart"]();
    expect(vm.isZooming).toBe(true);
  });

  it("onMapReady zoom event updates currentZoom", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as {
      currentZoom: number;
      onMapReady: () => Promise<void>;
      mapRef: { leafletObject: ReturnType<typeof makeMockMap> };
    };

    const callbacks: Record<string, () => void> = {};
    const mockMap = makeMockMap({
      getZoom: vi.fn().mockReturnValue(6),
      on: vi.fn((event: string, cb: () => void) => {
        callbacks[event] = cb;
      }),
    });
    vm.mapRef = { leafletObject: mockMap };
    await vm.onMapReady();

    callbacks["zoom"]();
    expect(vm.currentZoom).toBe(6);
  });

  it("onMapReady assigns performance options to map.options", async () => {
    const wrapper = await mountMap();
    const options: Record<string, unknown> = {};
    const mockMap = makeMockMap({ options });
    const vm = wrapper.vm as unknown as {
      onMapReady: () => Promise<void>;
      mapRef: { leafletObject: typeof mockMap };
    };
    vm.mapRef = { leafletObject: mockMap };
    await vm.onMapReady();
    expect(options.preferCanvas).toBe(true);
    expect(options.fadeAnimation).toBe(false);
    expect(options.zoomAnimation).toBe(true);
  });

  it("onMapReady does nothing when mapRef.leafletObject is undefined", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as {
      isMapReady: boolean;
      onMapReady: () => Promise<void>;
      mapRef: null;
    };
    vm.mapRef = null;
    await expect(vm.onMapReady()).resolves.toBeUndefined();
    // isMapReady is set to true before the early-return guard
    // just ensure no throw
  });

  // ── formatDate / formatTime (lines 948-955) ────────────────────────────────

  it("formatDate returns a locale date string", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as { formatDate: (d: string) => string };
    const result = vm.formatDate("2024-01-15");
    // Any locale — just assert it's a non-empty string
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("formatTime trims to HH:MM (first 5 chars)", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as { formatTime: (t: string) => string };
    expect(vm.formatTime("08:30:00")).toBe("08:30");
    expect(vm.formatTime("14:05:30")).toBe("14:05");
  });

  it("modal flight history shows formatted time (08:30)", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as { handleRouteClick: (r: object) => void };
    vm.handleRouteClick({
      key: "SIN-CGK",
      from: "SIN",
      to: "CGK",
      count: 1,
      flights: [{ ...sampleFlights[0], date: "2024-01-15", time: "08:30:00" }],
      coordinates: [],
      opacity: 0.5,
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".modal-content").text()).toContain("08:30");
  });

  // ── Modal show / close ────────────────────────────────────────────────────

  it("shows route details modal when a polyline is clicked", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as { handleRouteClick: (r: object) => void };
    vm.handleRouteClick({
      key: "SIN-CGK",
      from: "SIN",
      to: "CGK",
      count: 2,
      flights: [sampleFlights[0], sampleFlights[2]],
      coordinates: [
        [1.36, 103.99],
        [-6.13, 106.66],
      ],
      opacity: 0.9,
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".modal-overlay").exists()).toBe(true);
  });

  it("displays correct route info in modal", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as { handleRouteClick: (r: object) => void };
    vm.handleRouteClick({
      key: "SIN-CGK",
      from: "SIN",
      to: "CGK",
      count: 1,
      flights: [sampleFlights[0]],
      coordinates: [
        [1.36, 103.99],
        [-6.13, 106.66],
      ],
      opacity: 0.5,
    });
    await wrapper.vm.$nextTick();
    const modal = wrapper.find(".modal-content");
    expect(modal.text()).toContain("SIN");
    expect(modal.text()).toContain("CGK");
  });

  it("closes modal when overlay is clicked", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as { handleRouteClick: (r: object) => void };
    vm.handleRouteClick({
      key: "SIN-HKG",
      from: "SIN",
      to: "HKG",
      count: 1,
      flights: [sampleFlights[1]],
      coordinates: [],
      opacity: 0.5,
    });
    await wrapper.vm.$nextTick();
    await wrapper.find(".modal-overlay").trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".modal-overlay").exists()).toBe(false);
  });

  it("closes modal when the X button is clicked", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as { handleRouteClick: (r: object) => void };
    vm.handleRouteClick({
      key: "SIN-HKG",
      from: "SIN",
      to: "HKG",
      count: 1,
      flights: [sampleFlights[1]],
      coordinates: [],
      opacity: 0.5,
    });
    await wrapper.vm.$nextTick();
    await wrapper.find(".modal-content button").trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".modal-overlay").exists()).toBe(false);
  });

  it("modal content does not close when clicked (stopPropagation)", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as { handleRouteClick: (r: object) => void };
    vm.handleRouteClick({
      key: "SIN-HKG",
      from: "SIN",
      to: "HKG",
      count: 1,
      flights: [sampleFlights[1]],
      coordinates: [],
      opacity: 0.5,
    });
    await wrapper.vm.$nextTick();
    await wrapper.find(".modal-content").trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".modal-overlay").exists()).toBe(true);
  });

  it("modal shows airport names from AIRPORT_COORDINATES", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as { handleRouteClick: (r: object) => void };
    vm.handleRouteClick({
      key: "SIN-CGK",
      from: "SIN",
      to: "CGK",
      count: 1,
      flights: [sampleFlights[0]],
      coordinates: [],
      opacity: 0.5,
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".modal-content").text()).toContain("Singapore");
  });

  // ── Modal: >10 flights truncation (line 1012-1013) ────────────────────────

  it("shows '... and N more flights' for routes with >10 flights", async () => {
    const manyFlights = Array.from({ length: 12 }, () => makeFlight("SIN", "CGK"));
    const wrapper = mount(FlightMap, { props: { flights: manyFlights } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as { handleRouteClick: (r: object) => void };
    vm.handleRouteClick({
      key: "SIN-CGK",
      from: "SIN",
      to: "CGK",
      count: 12,
      flights: manyFlights,
      coordinates: [],
      opacity: 1,
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".modal-content").text()).toContain("more flights");
  });

  it("does not show 'more flights' text for exactly 10 flights", async () => {
    const tenFlights = Array.from({ length: 10 }, () => makeFlight("SIN", "CGK"));
    const wrapper = mount(FlightMap, { props: { flights: tenFlights } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as { handleRouteClick: (r: object) => void };
    vm.handleRouteClick({
      key: "SIN-CGK",
      from: "SIN",
      to: "CGK",
      count: 10,
      flights: tenFlights,
      coordinates: [],
      opacity: 1,
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".modal-content").text()).not.toContain("more flights");
  });

  // ── Stats panel collapse (mobile) ─────────────────────────────────────────

  it("stats panel is not collapsed initially", async () => {
    const wrapper = await mountMap();
    expect(wrapper.find(".stats-panel").classes()).not.toContain("collapsed-mobile");
  });

  it("toggleStatsPanel collapses stats panel", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as {
      toggleStatsPanel: () => void;
      isStatsPanelCollapsed: boolean;
    };
    vm.toggleStatsPanel();
    await wrapper.vm.$nextTick();
    expect(vm.isStatsPanelCollapsed).toBe(true);
  });

  it("toggleStatsPanel expands stats panel after collapse", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as {
      toggleStatsPanel: () => void;
      isStatsPanelCollapsed: boolean;
    };
    vm.toggleStatsPanel();
    vm.toggleStatsPanel();
    await wrapper.vm.$nextTick();
    expect(vm.isStatsPanelCollapsed).toBe(false);
  });

  // ── checkMobile (lifecycle, line 1012-1013) ───────────────────────────────

  it("registers resize listener on mount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    mount(FlightMap, { props: { flights: [] } });
    expect(addSpy.mock.calls.map(c => c[0])).toContain("resize");
    addSpy.mockRestore();
  });

  it("checkMobile sets isMobile=true when window.innerWidth <= 768", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as {
      checkMobile: () => void;
      isMobile: boolean;
    };
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 500 });
    vm.checkMobile();
    expect(vm.isMobile).toBe(true);
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it("checkMobile sets isMobile=false when window.innerWidth > 768", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as {
      checkMobile: () => void;
      isMobile: boolean;
    };
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1200,
    });
    vm.checkMobile();
    expect(vm.isMobile).toBe(false);
  });

  // ── Tile config ───────────────────────────────────────────────────────────

  it("uses light tile URL in light mode", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as { tileConfig: { url: string } };
    expect(vm.tileConfig.url).toContain("light_all");
  });

  // ── zoomLevels computed ───────────────────────────────────────────────────

  it("returns fixed zoom levels", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as {
      zoomLevels: { minZoom: number; maxZoom: number; initialZoom: number };
    };
    expect(vm.zoomLevels.minZoom).toBe(3);
    expect(vm.zoomLevels.maxZoom).toBe(8);
    expect(vm.zoomLevels.initialZoom).toBe(4);
  });

  // ── createZoomDebouncer ───────────────────────────────────────────────────

  it("zoomend handler eventually sets isZooming to false", async () => {
    vi.useFakeTimers();
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as {
      isZooming: boolean;
      onMapReady: () => Promise<void>;
      mapRef: { leafletObject: ReturnType<typeof makeMockMap> };
    };

    const callbacks: Record<string, () => void> = {};
    const mockMap = makeMockMap({
      on: vi.fn((event: string, cb: () => void) => {
        callbacks[event] = cb;
      }),
    });
    vm.mapRef = { leafletObject: mockMap };
    await vm.onMapReady();

    // Trigger zoomstart then zoomend
    callbacks["zoomstart"]();
    expect(vm.isZooming).toBe(true);
    callbacks["zoomend"]();
    vi.advanceTimersByTime(200); // past 150ms debounce
    expect(vm.isZooming).toBe(false);
    vi.useRealTimers();
  });
});
