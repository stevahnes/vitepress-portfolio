<script setup lang="ts">
import { computed, useId } from "vue";
import { withBase } from "vitepress";
import { companies as defaultCompanies, type Company } from "../data/companies";

// --- Types ---
/**
 * Normalised logo state. Keeping the three cases explicit lets the template
 * stay declarative and makes each branch directly unit-testable.
 */
type ResolvedLogo =
  | { kind: "none" }
  | { kind: "single"; src: string }
  | { kind: "themed"; dark: string; light: string };

interface CarouselItem {
  company: Company;
  logo: ResolvedLogo;
  /** Inline height override, or undefined to fall back to the CSS default. */
  logoStyle?: { height: string };
}

interface TrackGroup {
  key: string;
  isClone: boolean;
}

interface Props {
  companies?: Company[];
  title?: string;
  /** Seconds for one full loop. Larger is slower. */
  durationSeconds?: number;
}

// --- Constants ---
/**
 * The list is rendered twice so the track can translate by exactly -50% and
 * restart at a visually identical position. The clone is hidden from assistive
 * tech and taken out of the tab order so each company is announced and
 * focusable exactly once.
 */
const TRACK_GROUPS: readonly TrackGroup[] = [
  { key: "primary", isClone: false },
  { key: "clone", isClone: true },
] as const;

/*
 * Logos carry no width/height attributes: a fixed attribute box would impose
 * one aspect ratio on every logo, scaling a square mark down to the box height
 * and leaving it swimming in dead space. Instead each entry supplies its own
 * logoHeight (see data/companies.ts) and width is left to the aspect ratio.
 *
 * Vertical layout shift is prevented by the fixed row height on .company-link,
 * and horizontal reflow is harmless because both track groups reflow
 * identically, so -50% still lands exactly one group along.
 */

// --- Props ---
const props = withDefaults(defineProps<Props>(), {
  companies: () => defaultCompanies,
  // "contributed" rather than "worked": the list mixes employers with
  // volunteer and community work, so a "worked" label would overstate it.
  title: "Where I've contributed",
  durationSeconds: 40,
});

// --- State ---
// SSR-stable unique id, so the section stays correctly labelled even if the
// component is ever rendered more than once on a page.
const titleId = useId();

// --- Utility Functions ---
const resolveLogo = (company: Company): ResolvedLogo => {
  const { logo } = company;

  if (!logo) return { kind: "none" };
  if (typeof logo === "string") return { kind: "single", src: withBase(logo) };

  return { kind: "themed", dark: withBase(logo.dark), light: withBase(logo.light) };
};

// --- Computed ---
const hasCompanies = computed(() => props.companies.length > 0);

// Resolved once per company rather than per render branch.
const items = computed<CarouselItem[]>(() =>
  props.companies.map(company => ({
    company,
    logo: resolveLogo(company),
    logoStyle: company.logoHeight ? { height: `${company.logoHeight}rem` } : undefined,
  })),
);

const trackStyle = computed(() => ({
  "--marquee-duration": `${props.durationSeconds}s`,
}));
</script>

<template>
  <section v-if="hasCompanies" class="company-carousel" :aria-labelledby="titleId">
    <h2 :id="titleId" class="carousel-title">{{ title }}</h2>

    <div class="marquee">
      <div class="marquee-track" :style="trackStyle">
        <ul
          v-for="group in TRACK_GROUPS"
          :key="group.key"
          class="marquee-group"
          :class="{ 'is-clone': group.isClone }"
          :aria-hidden="group.isClone ? 'true' : undefined"
        >
          <li v-for="item in items" :key="item.company.id" class="marquee-item">
            <a
              class="company-link"
              :href="item.company.href"
              target="_blank"
              rel="noopener noreferrer"
              :tabindex="group.isClone ? -1 : undefined"
            >
              <template v-if="item.logo.kind === 'none'">
                <!-- Placeholder until the logo asset lands. currentColor means it
                     needs no per-theme variant. -->
                <svg
                  class="company-placeholder"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 21h18" />
                  <path d="M5 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16" />
                  <path d="M14 21V10h4a1 1 0 0 1 1 1v10" />
                  <path d="M8 8h3" />
                  <path d="M8 12h3" />
                  <path d="M8 16h3" />
                </svg>
                <span class="company-name">{{ item.company.name }}</span>
              </template>

              <img
                v-else-if="item.logo.kind === 'single'"
                class="company-logo"
                :src="item.logo.src"
                :alt="item.company.name"
                :style="item.logoStyle"
                loading="lazy"
                decoding="async"
              />

              <template v-else>
                <img
                  class="company-logo dark"
                  :src="item.logo.dark"
                  :alt="item.company.name"
                  :style="item.logoStyle"
                  loading="lazy"
                  decoding="async"
                />
                <img
                  class="company-logo light"
                  :src="item.logo.light"
                  :alt="item.company.name"
                  :style="item.logoStyle"
                  loading="lazy"
                  decoding="async"
                />
              </template>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.company-carousel {
  /* Wide spacing carries the rhythm here, since the logos have no frames. */
  --marquee-gap: 4.5rem;

  /*
   * Lift above ShaderBackground's canvas, which is position: absolute with
   * z-index: 0 and overlaps this area. A positioned z-index: 0 element paints
   * above the inline text of static elements, so without this the heading is
   * hidden by the canvas. Same idiom as .VPHome .VPHero .container in style.css.
   */
  position: relative;
  z-index: 1;

  max-width: 1152px;
  margin: 4rem auto 0;
  padding: 0 24px;
}

.carousel-title {
  margin: 0 0 2rem;
  padding: 0;
  border: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: uppercase;
  /* text-2 rather than text-3: at 13px, text-3 falls under 4.5:1 on the dark bg. */
  color: var(--vp-c-text-2);
}

/* Marquee viewport: clips the track and fades both edges. */
.marquee {
  position: relative;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    #000 8%,
    #000 92%,
    transparent 100%
  );
  mask-image: linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%);
}

/*
 * Track width is exactly two group widths, because the trailing gap lives on
 * each item's margin rather than on a flex gap. That makes -50% land precisely
 * one group along, so the loop has no visible seam.
 */
.marquee-track {
  display: flex;
  width: max-content;
  animation: marquee-scroll var(--marquee-duration, 40s) linear infinite;
}

.marquee-group {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
}

.marquee-item {
  margin-right: var(--marquee-gap);
  list-style: none;
}

@keyframes marquee-scroll {
  to {
    transform: translateX(-50%);
  }
}

/* Pause on hover and while a logo link holds focus. */
.marquee:hover .marquee-track,
.marquee:focus-within .marquee-track {
  animation-play-state: paused;
}

/*
 * Unframed logo lockup. Deliberately no card, border or glass fill — the
 * home page already stacks three bordered feature cards directly above this,
 * and repeating that treatment per logo made the strip read as a second row
 * of cards rather than one continuous band.
 */
.company-link {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  /* Steady row height so muted logos and wordmarks sit on one baseline. */
  height: 2.75rem;
  padding: 0 0.25rem;
  border-radius: 4px;
  color: var(--vp-c-text-2);
  text-decoration: none;
  /* Muted at rest, full strength on hover — the usual logo-wall treatment. */
  opacity: 0.65;
  transition:
    opacity 0.3s ease,
    color 0.3s ease;
}

.company-link:hover {
  opacity: 1;
  color: var(--vp-c-brand-1);
}

.company-link:focus-visible {
  opacity: 1;
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 4px;
}

/*
 * Height comes from each entry's logoHeight (bound inline), which balances
 * logos by ink area rather than by height — see the field docs in
 * data/companies.ts. Width stays auto so the browser preserves each logo's
 * aspect ratio; the caps here are a backstop for entries with no logoHeight
 * set and for anything unusually wide.
 */
.company-logo {
  max-height: 100%;
  max-width: 10rem;
  object-fit: contain;
}

/* Show only the variant matching the active theme. Both are in the DOM, so
   switching themes never flashes or waits on JS. */
html:not(.dark) .company-logo.dark {
  display: none;
}

.dark .company-logo.light {
  display: none;
}

.company-placeholder {
  flex-shrink: 0;
  width: 1.375rem;
  height: 1.375rem;
}

/* Wordmark standing in for a real logo — sized to read as one. */
.company-name {
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.01em;
  white-space: nowrap;
  color: inherit;
}

/* Static, non-repeating layout when the visitor prefers reduced motion. */
@media (prefers-reduced-motion: reduce) {
  .marquee {
    -webkit-mask-image: none;
    mask-image: none;
  }

  .marquee-track {
    width: 100%;
    animation: none;
  }

  .marquee-group {
    flex-wrap: wrap;
    justify-content: center;
    /* Tighter row gap than column gap once the strip wraps to a block. */
    gap: 1.5rem var(--marquee-gap);
    width: 100%;
  }

  .marquee-group.is-clone {
    display: none;
  }

  .marquee-item {
    margin-right: 0;
  }
}

@media (max-width: 640px) {
  .company-carousel {
    --marquee-gap: 2.75rem;

    margin-top: 3rem;
  }

  .company-name {
    font-size: 1rem;
  }
}
</style>
