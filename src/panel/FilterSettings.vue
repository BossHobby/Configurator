<template>
  <Panel title="Filters" help="filter.settings"
    ><div class="space-y-4">
      <div v-if="profile" class="grid grid-cols-12 gap-4">
        <div
          v-if="profile.filter.gyro"
          class="min-w-0 col-span-12 md:col-span-6"
        >
          <div class="form-grid grid-cols-2">
            <div class="form-row">
              <label class="form-label" for="gyro-1-type">
                Gyro Pass 1 Type
                <tooltip entry="filter.gyro_1_type"
              /></label>
              <UiSelect
                id="gyro-1-type"
                v-model.number="profile.filter.gyro[0].type"
                class="w-full"
                :options="filterTypeOptions"
              ></UiSelect>
            </div>

            <div class="form-row">
              <label class="form-label" for="gyro-1-freq">
                Gyro Pass 1 Freq
                <tooltip entry="filter.gyro_1_freq"
              /></label>
              <input
                id="gyro-1-freq"
                v-model.number="profile.filter.gyro[0].cutoff_freq"
                class="form-input"
                type="number"
                step="5"
                min="0"
              />
            </div>

            <div class="form-row">
              <label class="form-label" for="gyro-2-type">
                Gyro Pass 2 Type
                <tooltip entry="filter.gyro_2_type"
              /></label>
              <UiSelect
                id="gyro-2-type"
                v-model.number="profile.filter.gyro[1].type"
                class="w-full"
                :options="filterTypeOptions"
              ></UiSelect>
            </div>

            <div class="form-row">
              <label class="form-label" for="gyro-2-freq">
                Gyro Pass 2 Freq
                <tooltip entry="filter.gyro_2_freq"
              /></label>
              <input
                id="gyro-2-freq"
                v-model.number="profile.filter.gyro[1].cutoff_freq"
                class="form-input"
                type="number"
                step="5"
                min="0"
              />
            </div>

            <div v-if="profile.profileVersionGt('0.2.2')" class="form-row">
              <label class="form-label" for="gyro-dynamic-enable">
                Gyro Dynamic Notch
                <tooltip entry="filter.gyro_dynamic_notch_enable"
              /></label>
              <UiSelect
                id="gyro-dynamic-enable"
                v-model.number="profile.filter.gyro_dynamic_notch_enable"
                class="w-full"
                :options="toggleOptions"
              ></UiSelect>
            </div>
          </div>
        </div>

        <div
          v-if="profile.filter.dterm"
          class="min-w-0 col-span-12 md:col-span-6"
        >
          <div class="form-grid grid-cols-2">
            <div class="form-row">
              <label class="form-label" for="dterm-1-type">
                DTerm Pass 1 Type
                <tooltip entry="filter.dterm_1_type"
              /></label>
              <UiSelect
                id="dterm-1-type"
                v-model.number="profile.filter.dterm[0].type"
                class="w-full"
                :options="filterTypeOptions"
              ></UiSelect>
            </div>

            <div class="form-row">
              <label class="form-label" for="dterm-1-freq">
                DTerm Pass 1 Freq
                <tooltip entry="filter.dterm_1_freq"
              /></label>
              <input
                id="dterm-1-freq"
                v-model.number="profile.filter.dterm[0].cutoff_freq"
                class="form-input"
                type="number"
                step="5"
                min="0"
              />
            </div>

            <div class="form-row">
              <label class="form-label" for="dterm-2-type">
                DTerm Pass 2 Type
                <tooltip entry="filter.dterm_2_type"
              /></label>
              <UiSelect
                id="dterm-2-type"
                v-model.number="profile.filter.dterm[1].type"
                class="w-full"
                :options="filterTypeOptions"
              ></UiSelect>
            </div>

            <div class="form-row">
              <label class="form-label" for="dterm-2-freq">
                DTerm Pass 2 Freq
                <tooltip entry="filter.dterm_2_freq"
              /></label>
              <input
                id="dterm-2-freq"
                v-model.number="profile.filter.dterm[1].cutoff_freq"
                class="form-input"
                type="number"
                step="5"
                min="0"
              />
            </div>

            <div v-if="profile.profileVersionGt('0.2.6')" class="form-row">
              <label class="form-label" for="dterm-dynamic-enable">
                DTerm Dynamic
                <tooltip entry="filter.dterm_dynamic_type"
              /></label>
              <UiSelect
                id="dterm-dynamic-enable"
                v-model.number="profile.filter.dterm_dynamic_type"
                class="w-full"
                :options="filterTypeOptions"
              ></UiSelect>
            </div>

            <div v-else class="form-row">
              <label class="form-label" for="dterm-dynamic-enable">
                DTerm Dynamic
                <tooltip entry="filter.dterm_dynamic_enable"
              /></label>
              <UiSelect
                id="dterm-dynamic-enable"
                v-model.number="profile.filter.dterm_dynamic_enable"
                class="w-full"
                :options="toggleOptions"
              ></UiSelect>
            </div>

            <div v-if="dtermDynamicEnabled" class="form-row col-start-1">
              <label class="form-label" for="dterm-dynamic-min">
                DTerm Dynamic Min
                <tooltip entry="filter.dterm_dynamic_min"
              /></label>
              <input
                id="dterm-dynamic-min"
                v-model.number="profile.filter.dterm_dynamic_min"
                class="form-input"
                type="number"
                step="5"
                min="0"
              />
            </div>

            <div v-if="dtermDynamicEnabled" class="form-row">
              <label class="form-label" for="dterm-dynamic-max">
                DTerm Dynamic Max
                <tooltip entry="filter.dterm_dynamic_max"
              /></label>
              <input
                id="dterm-dynamic-max"
                v-model.number="profile.filter.dterm_dynamic_max"
                class="form-input"
                type="number"
                step="5"
                min="0"
              />
            </div>
          </div>
        </div>
      </div></div
  ></Panel>
</template>

<script lang="ts">
import Panel from "@/components/ui/Panel.vue";
import { defineComponent } from "vue";
import { useInfoStore } from "@/store/info";
import { useProfileStore } from "@/store/profile";

export default defineComponent({
  name: "FilterSettings",
  components: { Panel },
  setup() {
    return {
      info: useInfoStore(),
      profile: useProfileStore(),
    };
  },
  computed: {
    dtermDynamicEnabled(): boolean {
      return Boolean(
        this.profile.profileVersionGt("0.2.6")
          ? this.profile.filter.dterm_dynamic_type
          : this.profile.filter.dterm_dynamic_enable,
      );
    },
  },
  data() {
    return {
      filterTypeOptions: [
        { value: 0, text: "None" },
        { value: 1, text: "PT1" },
        { value: 2, text: "PT2" },
        { value: 3, text: "PT3" },
      ],
      toggleOptions: [
        { value: 0, text: "Off" },
        { value: 1, text: "On" },
      ],
    };
  },
});
</script>
