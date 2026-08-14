import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CompanyCarousel from "../CompanyCarousel.vue";
import type { Company } from "../../data/companies";

const sampleCompanies: Company[] = [
  { id: "no-logo", name: "Placeholder Co", href: "https://placeholder.example" },
  { id: "single", name: "Single Logo Co", href: "https://single.example", logo: "/single.webp" },
  {
    id: "themed",
    name: "Themed Co",
    href: "https://themed.example",
    logo: { dark: "/themed-dark.webp", light: "/themed-light.webp" },
  },
];

describe("CompanyCarousel", () => {
  it("renders nothing when there are no companies", () => {
    const wrapper = mount(CompanyCarousel, { props: { companies: [] } });
    expect(wrapper.find(".company-carousel").exists()).toBe(false);
  });

  it("renders every company once per track group", () => {
    const wrapper = mount(CompanyCarousel, { props: { companies: sampleCompanies } });

    expect(wrapper.findAll(".marquee-group")).toHaveLength(2);
    expect(wrapper.findAll(".marquee-item")).toHaveLength(sampleCompanies.length * 2);
  });

  it("hides the duplicated group from assistive tech but not the primary group", () => {
    const wrapper = mount(CompanyCarousel, { props: { companies: sampleCompanies } });
    const [primary, clone] = wrapper.findAll(".marquee-group");

    expect(primary.attributes("aria-hidden")).toBeUndefined();
    expect(primary.classes()).not.toContain("is-clone");
    expect(clone.attributes("aria-hidden")).toBe("true");
    expect(clone.classes()).toContain("is-clone");
  });

  it("keeps duplicated links out of the tab order", () => {
    const wrapper = mount(CompanyCarousel, { props: { companies: sampleCompanies } });
    const [primary, clone] = wrapper.findAll(".marquee-group");

    primary.findAll(".company-link").forEach(link => {
      expect(link.attributes("tabindex")).toBeUndefined();
    });
    clone.findAll(".company-link").forEach(link => {
      expect(link.attributes("tabindex")).toBe("-1");
    });
  });

  it("labels the section with its heading", () => {
    const wrapper = mount(CompanyCarousel, { props: { companies: sampleCompanies } });
    const headingId = wrapper.find(".carousel-title").attributes("id");

    expect(headingId).toBeTruthy();
    expect(wrapper.find(".company-carousel").attributes("aria-labelledby")).toBe(headingId);
  });

  it("uses the default title and honours a custom one", () => {
    const defaults = mount(CompanyCarousel, { props: { companies: sampleCompanies } });
    expect(defaults.find(".carousel-title").text()).toBe("Where I've contributed");

    const custom = mount(CompanyCarousel, {
      props: { companies: sampleCompanies, title: "Trusted by" },
    });
    expect(custom.find(".carousel-title").text()).toBe("Trusted by");
  });

  it("renders a single image for a string logo", () => {
    const wrapper = mount(CompanyCarousel, {
      props: { companies: [sampleCompanies[1]] },
    });
    const images = wrapper.find(".marquee-group").findAll("img");

    expect(images).toHaveLength(1);
    expect(images[0].attributes("src")).toBe("/single.webp");
    expect(images[0].attributes("alt")).toBe("Single Logo Co");
    expect(images[0].classes()).not.toContain("dark");
    expect(images[0].classes()).not.toContain("light");
  });

  it("renders both variants for a themed logo so CSS can pick one", () => {
    const wrapper = mount(CompanyCarousel, {
      props: { companies: [sampleCompanies[2]] },
    });
    const group = wrapper.find(".marquee-group");

    const dark = group.find("img.company-logo.dark");
    const light = group.find("img.company-logo.light");

    expect(group.findAll("img")).toHaveLength(2);
    expect(dark.attributes("src")).toBe("/themed-dark.webp");
    expect(light.attributes("src")).toBe("/themed-light.webp");
    expect(dark.attributes("alt")).toBe("Themed Co");
    expect(light.attributes("alt")).toBe("Themed Co");
  });

  it("renders a placeholder and the company name when no logo is set", () => {
    const wrapper = mount(CompanyCarousel, {
      props: { companies: [sampleCompanies[0]] },
    });
    const group = wrapper.find(".marquee-group");

    expect(group.findAll("img")).toHaveLength(0);
    expect(group.find(".company-placeholder").exists()).toBe(true);
    expect(group.find(".company-placeholder").attributes("aria-hidden")).toBe("true");
    expect(group.find(".company-name").text()).toBe("Placeholder Co");
  });

  it("links each company externally and safely", () => {
    const wrapper = mount(CompanyCarousel, { props: { companies: sampleCompanies } });
    const links = wrapper.find(".marquee-group").findAll(".company-link");

    expect(links.map(link => link.attributes("href"))).toEqual([
      "https://placeholder.example",
      "https://single.example",
      "https://themed.example",
    ]);
    links.forEach(link => {
      expect(link.attributes("target")).toBe("_blank");
      expect(link.attributes("rel")).toBe("noopener noreferrer");
    });
  });

  it("exposes the loop duration as a custom property", () => {
    const defaults = mount(CompanyCarousel, { props: { companies: sampleCompanies } });
    expect(defaults.find(".marquee-track").attributes("style")).toContain(
      "--marquee-duration: 40s",
    );

    const custom = mount(CompanyCarousel, {
      props: { companies: sampleCompanies, durationSeconds: 12 },
    });
    expect(custom.find(".marquee-track").attributes("style")).toContain("--marquee-duration: 12s");
  });

  it("lazy-loads logos and leaves sizing to CSS", () => {
    const wrapper = mount(CompanyCarousel, { props: { companies: sampleCompanies } });
    const logos = wrapper.findAll("img.company-logo");

    expect(logos.length).toBeGreaterThan(0);
    logos.forEach(image => {
      expect(image.attributes("loading")).toBe("lazy");
      expect(image.attributes("decoding")).toBe("async");
      // No width/height attributes: they would force one aspect ratio onto
      // every logo. The fixed row height prevents vertical layout shift.
      expect(image.attributes("width")).toBeUndefined();
      expect(image.attributes("height")).toBeUndefined();
    });
  });

  it("applies logoHeight as an inline height, and omits it when unset", () => {
    const wrapper = mount(CompanyCarousel, {
      props: {
        companies: [
          {
            id: "sized",
            name: "Sized Co",
            href: "https://sized.example",
            logo: "/a.webp",
            logoHeight: 1.75,
          },
          { id: "unsized", name: "Unsized Co", href: "https://unsized.example", logo: "/b.webp" },
        ],
      },
    });
    const [sized, unsized] = wrapper.find(".marquee-group").findAll("img.company-logo");

    expect(sized.attributes("style")).toContain("height: 1.75rem");
    expect(unsized.attributes("style")).toBeUndefined();
  });

  it("falls back to the shipped company list when none is passed", () => {
    const wrapper = mount(CompanyCarousel);

    expect(wrapper.find(".company-carousel").exists()).toBe(true);
    expect(wrapper.find(".marquee-group").text()).toContain("Airwallex");
  });
});
