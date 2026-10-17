<template>
  <div ref="root" class="relative size-full" @keydown.esc="closeMenu">
    <div
      ref="container"
      class="mission-map size-full rounded-md"
      role="application"
      aria-label="Mission map. Click to add a waypoint, drag a waypoint to move it, right-click or long-press for more actions."
    />
    <div
      v-if="menu"
      ref="menuEl"
      role="menu"
      aria-label="Map actions"
      class="absolute z-[500] flex w-56 flex-col rounded-lg border border-line bg-panel p-1 text-sm text-ink shadow-lg"
      :style="{ left: `${menu.x}px`, top: `${menu.y}px` }"
    >
      <button
        v-for="item in menuItems"
        :key="item.label"
        type="button"
        role="menuitem"
        class="flex min-h-10 items-center rounded-md px-3 text-left hover:bg-subtle focus-visible:bg-subtle"
        :class="item.tone"
        @click="choose(item.run)"
      >
        {{ item.label }}
      </button>
    </div>
    <ul
      class="pointer-events-none absolute top-2 right-2 z-[400] flex gap-3 rounded-md border border-line bg-panel/90 px-2 py-1 text-xs"
      aria-label="Legend"
    >
      <li class="flex items-center gap-1.5">
        <span class="h-0.5 w-3 rounded-full bg-accent" />Route
      </li>
      <li v-if="hasCoord(home)" class="flex items-center gap-1.5">
        <span class="size-2 bg-ink" />Home
      </li>
      <li v-if="hasCoord(position)" class="flex items-center gap-1.5">
        <span class="size-2 rounded-full bg-warning" />Craft
      </li>
      <li v-if="hasCoord(target)" class="flex items-center gap-1.5">
        <span class="size-2 rounded-full border-2 border-warning" />Target
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TILE_PROVIDERS, type TileProvider } from "./tiles";
import {
  COORD_SCALE,
  hasCoord,
  type GeoPoint,
  type Waypoint,
} from "@/store/util/mission";

const props = defineProps<{
  waypoints: Waypoint[];
  rth: boolean;
  selected?: number;
  home?: GeoPoint;
  position?: GeoPoint;
  // Live QUIC_RT link: craft heading in degrees true, its track, the target it
  // flies toward and the mission waypoint it is flying.
  heading?: number;
  trail?: GeoPoint[];
  target?: GeoPoint;
  active?: number;
  // The craft takes guided commands: the context menu offers flyto.
  live?: boolean;
  // Keep the craft centered; panning the map emits unfollow.
  follow?: boolean;
  tiles: TileProvider;
}>();
const emit = defineEmits<{
  add: [point: GeoPoint];
  insert: [index: number, point: GeoPoint];
  move: [index: number, point: GeoPoint];
  remove: [index: number];
  select: [index: number];
  // pickAlt asks for the altitude instead of holding the current one.
  flyto: [point: GeoPoint, pickAlt: boolean];
  unfollow: [];
}>();

// Missions are small; allow zooming past the native tile resolution.
const MAX_ZOOM = 22;

const root = ref<HTMLElement>();
const container = ref<HTMLElement>();
const menuEl = ref<HTMLElement>();

// Context menu of a right-click or long-press, at a map point or a waypoint.
const menu = ref<{ x: number; y: number; point: GeoPoint; index?: number }>();

const menuItems = computed(() => {
  const m = menu.value;
  if (!m) return [];
  const items: { label: string; tone?: string; run: () => void }[] = [];
  if (props.live) {
    items.push(
      {
        label: "Go here",
        tone: "font-medium text-warning",
        run: () => emit("flyto", m.point, false),
      },
      {
        label: "Go here at altitude",
        tone: "text-warning",
        run: () => emit("flyto", m.point, true),
      },
    );
  }
  if (m.index !== undefined) {
    const index = m.index;
    items.push({
      label: `Delete waypoint ${index + 1}`,
      tone: "text-danger",
      run: () => emit("remove", index),
    });
  } else {
    items.push({ label: "Add waypoint here", run: () => emit("add", m.point) });
    const selected = props.selected;
    if (selected !== undefined && props.waypoints[selected]) {
      items.push({
        label: `Move waypoint ${selected + 1} here`,
        run: () => emit("move", selected, m.point),
      });
    }
  }
  return items;
});

async function openMenu(e: L.LeafletMouseEvent, index?: number) {
  menu.value = {
    x: e.containerPoint.x,
    y: e.containerPoint.y,
    point:
      index === undefined
        ? fromLatLng(e.latlng)
        : { lat: props.waypoints[index].lat, lon: props.waypoints[index].lon },
    index,
  };
  await nextTick();
  // Keep the menu inside the map, opening up or left near its edges.
  const el = menuEl.value;
  const box = container.value;
  if (!el || !box || !menu.value) return;
  if (menu.value.x + el.offsetWidth > box.clientWidth)
    menu.value.x = Math.max(0, menu.value.x - el.offsetWidth);
  if (menu.value.y + el.offsetHeight > box.clientHeight)
    menu.value.y = Math.max(0, menu.value.y - el.offsetHeight);
  el.querySelector("button")?.focus();
}

function closeMenu() {
  if (!menu.value) return false;
  menu.value = undefined;
  return true;
}

function choose(run: () => void) {
  closeMenu();
  run();
}

function onPointerDown(e: PointerEvent) {
  if (!root.value?.contains(e.target as Node)) closeMenu();
}

let map: L.Map | undefined;
let tileLayer: L.TileLayer | undefined;
let routeLayer: L.LayerGroup | undefined;
let craftLayer: L.LayerGroup | undefined;
let legs: L.Polyline[] = [];
let dragging = false;
let centered = false;
// Set once the user pans or zooms, so a late location never yanks the view.
let interacted = false;

const VIEW_KEY = "mission-map-view";

function readView(): { center: L.LatLngTuple; zoom: number } | undefined {
  try {
    const view = JSON.parse(localStorage.getItem(VIEW_KEY) ?? "");
    if (Array.isArray(view?.center) && typeof view.zoom == "number") {
      return view;
    }
  } catch {
    /* No usable saved view. */
  }
  return undefined;
}

function saveView() {
  if (!map) return;
  const center = map.getCenter();
  try {
    localStorage.setItem(
      VIEW_KEY,
      JSON.stringify({ center: [center.lat, center.lng], zoom: map.getZoom() }),
    );
  } catch {
    /* The view is only a convenience. */
  }
}

// With nothing to show, start where the user last looked, then move to the
// browser's location if it is granted before they touch the map.
function startView() {
  const view = readView();
  if (view) map!.setView(view.center, view.zoom);
  navigator.geolocation?.getCurrentPosition(
    (pos) => {
      if (!map || centered || interacted) return;
      map.setView([pos.coords.latitude, pos.coords.longitude], 16);
    },
    () => {
      /* Denied or unavailable: keep the saved or world view. */
    },
    { maximumAge: 10 * 60 * 1000, timeout: 10000 },
  );
}

const toLatLng = (p: GeoPoint): L.LatLngTuple => [
  p.lat / COORD_SCALE,
  p.lon / COORD_SCALE,
];
const fromLatLng = (p: L.LatLng): GeoPoint => ({
  lat: Math.round(p.lat * COORD_SCALE),
  lon: Math.round(L.Util.wrapNum(p.lng, [-180, 180], true) * COORD_SCALE),
});

// Always-on coordinate grid under the basemap, so the map stays usable
// offline when tiles fail to load.
const GridLayer = L.GridLayer.extend({
  createTile(coords: L.Coords) {
    const tile = document.createElement("div");
    tile.className = "mission-grid-tile";
    const nw = map!.unproject(coords.scaleBy(this.getTileSize()), coords.z);
    tile.textContent = `${nw.lat.toFixed(4)}, ${L.Util.wrapNum(nw.lng, [-180, 180], true).toFixed(4)}`;
    return tile;
  },
}) as new (options?: L.GridLayerOptions) => L.GridLayer;

function markerIcon(index: number) {
  const selected = index == props.selected ? " is-selected" : "";
  const active = index == props.active ? " is-active" : "";
  return L.divIcon({
    className: "",
    html: `<div class="mission-wp${selected}${active}">${index + 1}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function legPoints(): L.LatLngTuple[][] {
  const points = props.waypoints.map(toLatLng);
  const out: L.LatLngTuple[][] = [];
  for (let i = 1; i < points.length; i++) out.push([points[i - 1], points[i]]);
  return out;
}

function drawRoute() {
  if (!map || dragging) return;
  routeLayer?.remove();
  routeLayer = L.layerGroup().addTo(map);

  const wps = props.waypoints;
  if (hasCoord(props.home) && wps.length) {
    const home = toLatLng(props.home);
    L.polyline([home, toLatLng(wps[0])], {
      className: "mission-leg-home",
      interactive: false,
    }).addTo(routeLayer);
    if (props.rth) {
      L.polyline([toLatLng(wps[wps.length - 1]), home], {
        className: "mission-leg-home",
        interactive: false,
      }).addTo(routeLayer);
    }
  }

  // One polyline per leg, so clicking a leg inserts a point into it.
  legs = legPoints().map((points, index) =>
    L.polyline(points, { className: "mission-leg", weight: 3 })
      .on("click", (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        if (!closeMenu()) emit("insert", index + 1, fromLatLng(e.latlng));
      })
      .addTo(routeLayer!),
  );

  wps.forEach((wp, index) => {
    const marker = L.marker(toLatLng(wp), {
      draggable: true,
      icon: markerIcon(index),
      keyboard: false,
      zIndexOffset: index == props.selected ? 1000 : 0,
    })
      .on("click", () => {
        closeMenu();
        emit("select", index);
      })
      .on("contextmenu", (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        emit("select", index);
        openMenu(e, index);
      })
      .on("dragstart", () => {
        closeMenu();
        dragging = true;
        emit("select", index);
      })
      .on("drag", () => {
        // Move the adjacent legs live; the route is redrawn on drop.
        const at = marker.getLatLng();
        if (index > 0)
          legs[index - 1].setLatLngs([toLatLng(wps[index - 1]), at]);
        if (index < legs.length)
          legs[index].setLatLngs([at, toLatLng(wps[index + 1])]);
      })
      .on("dragend", () => {
        dragging = false;
        emit("move", index, fromLatLng(marker.getLatLng()));
        drawRoute();
      })
      .addTo(routeLayer!);
  });
}

function drawCraft() {
  if (!map) return;
  craftLayer?.remove();
  craftLayer = L.layerGroup().addTo(map);
  if (hasCoord(props.home)) {
    L.marker(toLatLng(props.home), {
      interactive: false,
      icon: L.divIcon({
        className: "",
        html: '<div class="mission-home"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      }),
    }).addTo(craftLayer);
  }
  if (props.trail && props.trail.length > 1) {
    L.polyline(props.trail.map(toLatLng), {
      className: "mission-trail",
      interactive: false,
    }).addTo(craftLayer);
  }
  if (hasCoord(props.target)) {
    if (hasCoord(props.position)) {
      L.polyline([toLatLng(props.position), toLatLng(props.target)], {
        className: "mission-leg-target",
        interactive: false,
      }).addTo(craftLayer);
    }
    L.circleMarker(toLatLng(props.target), {
      className: "mission-target",
      radius: 7,
      weight: 3,
      fillOpacity: 0,
      interactive: false,
    }).addTo(craftLayer);
  }
  if (hasCoord(props.position) && props.heading !== undefined) {
    L.marker(toLatLng(props.position), {
      interactive: false,
      zIndexOffset: 2000,
      icon: L.divIcon({
        className: "",
        html: `<svg class="mission-craft-arrow" viewBox="0 0 24 24" style="transform: rotate(${props.heading}deg)"><path d="M12 2 20 21 12 16 4 21Z"/></svg>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    }).addTo(craftLayer);
  } else if (hasCoord(props.position)) {
    L.circleMarker(toLatLng(props.position), {
      className: "mission-craft",
      radius: 6,
      weight: 2,
      fillOpacity: 1,
      interactive: false,
    }).addTo(craftLayer);
  }
}

function setTiles() {
  if (!map) return;
  tileLayer?.remove();
  tileLayer = undefined;
  const provider = TILE_PROVIDERS[props.tiles];
  tileLayer = L.tileLayer(provider.url, {
    attribution: provider.attribution,
    maxNativeZoom: provider.maxZoom,
    maxZoom: MAX_ZOOM,
  }).addTo(map);
}

function fit() {
  if (!map) return;
  const points = props.waypoints.filter(hasCoord).map(toLatLng);
  if (hasCoord(props.home)) points.push(toLatLng(props.home));
  if (hasCoord(props.position)) points.push(toLatLng(props.position));
  if (!points.length) return;
  centered = true;
  if (points.length == 1) map.setView(points[0], 17);
  else
    map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 18 });
}

function centerOnCraft() {
  const target = hasCoord(props.position) ? props.position : props.home;
  if (!map || !hasCoord(target)) return;
  centered = true;
  map.setView(toLatLng(target), Math.max(map.getZoom(), 17));
}

function followCraft() {
  if (!map || !hasCoord(props.position)) return;
  centered = true;
  map.panTo(toLatLng(props.position), { animate: true, duration: 0.25 });
}

defineExpose({ fit, centerOnCraft });

onMounted(() => {
  map = L.map(container.value!, {
    // Whole zoom levels keep raster tiles crisp and seam-free.
    zoomSnap: 1,
    maxZoom: MAX_ZOOM,
    worldCopyJump: true,
    // Long-press opens the context menu on every touch screen, not only iOS.
    tapHold: true,
  }).setView([0, 0], 2);
  map.attributionControl.setPrefix(false);
  new GridLayer({ maxZoom: MAX_ZOOM }).addTo(map);
  // A click while the menu is open only dismisses it.
  map.on("click", (e: L.LeafletMouseEvent) => {
    if (!closeMenu()) emit("add", fromLatLng(e.latlng));
  });
  map.on("contextmenu", (e: L.LeafletMouseEvent) => openMenu(e));
  map.on("movestart zoomstart", closeMenu);
  document.addEventListener("pointerdown", onPointerDown);
  map.on("dragstart", () => {
    if (props.follow) emit("unfollow");
  });
  for (const type of ["pointerdown", "wheel", "keydown"]) {
    container.value!.addEventListener(type, () => (interacted = true), {
      passive: true,
    });
  }
  setTiles();
  drawCraft();
  drawRoute();
  fit();
  if (!centered) startView();
  map.on("moveend", saveView);
});

onUnmounted(() => {
  document.removeEventListener("pointerdown", onPointerDown);
  map?.remove();
  map = undefined;
});

watch(() => props.tiles, setTiles);
watch(
  () => [props.waypoints, props.rth, props.selected, props.home, props.active],
  drawRoute,
  { deep: true },
);
watch(() => [props.trail?.length, props.heading, props.target], drawCraft, {
  deep: true,
});
watch(
  () => [props.home, props.position],
  () => {
    drawCraft();
    if (props.follow) followCraft();
    // Center once on the first fix when there is nothing else to show.
    else if (!centered) fit();
  },
  { deep: true },
);
watch(
  () => props.follow,
  (follow) => {
    if (follow) centerOnCraft();
  },
);
</script>

<style>
.mission-map.leaflet-container {
  background: var(--ui-subtle);
  font: inherit;
  cursor: crosshair;
  /* Long-press opens the map's own menu, not the browser's. */
  -webkit-touch-callout: none;
  user-select: none;
}
.mission-map .leaflet-control-attribution {
  background: color-mix(in srgb, var(--ui-panel) 85%, transparent);
  color: var(--ui-muted);
}
.mission-map .leaflet-control-attribution a {
  color: var(--ui-ink);
}
.mission-map .leaflet-bar a {
  background: var(--ui-panel);
  color: var(--ui-ink);
  border-color: var(--ui-line);
}
.mission-grid-tile {
  border-top: 1px solid var(--ui-line);
  border-left: 1px solid var(--ui-line);
  padding: 2px 4px;
  font-size: 10px;
  color: var(--ui-muted);
  font-variant-numeric: tabular-nums;
}
.mission-leg {
  stroke: var(--ui-accent);
  cursor: copy;
}
.mission-leg-home {
  stroke: var(--ui-muted);
  stroke-width: 2;
  stroke-dasharray: 6 6;
  fill: none;
}
.mission-craft {
  stroke: var(--ui-panel);
  fill: var(--ui-warning);
}
.mission-craft-arrow {
  width: 24px;
  height: 24px;
  fill: var(--ui-warning);
  stroke: var(--ui-panel);
  stroke-width: 1.5;
  stroke-linejoin: round;
}
.mission-trail {
  stroke: var(--ui-warning);
  stroke-width: 2;
  stroke-opacity: 0.6;
  fill: none;
}
.mission-target {
  stroke: var(--ui-warning);
}
.mission-leg-target {
  stroke: var(--ui-warning);
  stroke-width: 2;
  stroke-dasharray: 4 6;
  fill: none;
}
.mission-home {
  width: 12px;
  height: 12px;
  background: var(--ui-ink);
  border: 2px solid var(--ui-panel);
}
.mission-wp {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 9999px;
  border: 2px solid var(--ui-panel);
  background: var(--ui-accent);
  color: var(--ui-on-accent);
  font-size: 11px;
  font-weight: 600;
  cursor: grab;
}
.mission-wp.is-active {
  background: var(--ui-warning);
}
.mission-wp.is-selected {
  outline: 2px solid var(--ui-ink);
  outline-offset: 1px;
}
</style>
