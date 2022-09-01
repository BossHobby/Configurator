<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Filter</p>
      <tooltip class="card-header-icon" entry="filter.settings" size="lg" />
    </header>

    <div class="card-content">
      <div class="content column-narrow field-is-5">
        <div class="columns" v-if="profile">
          <div class="column is-6" v-if="profile.filter.gyro">
            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label" for="gyro-1-type">
                  Gyro Pass 1 Type
                  <tooltip entry="filter.gyro_1_type" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input-select
                      class="is-fullwidth"
                      id="gyro-1-type"
                      v-model.number="profile.filter.gyro[0].type"
                      :options="filterTypeOptions"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>

            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label" for="gyro-1-freq">
                  Gyro Pass 1 Freq
                  <tooltip entry="filter.gyro_1_freq" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input
                      class="input"
                      id="gyro-1-freq"
                      type="number"
                      step="5"
                      v-model.number="profile.filter.gyro[0].cutoff_freq"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="field is-horizontal mt-6">
              <div class="field-label">
                <label class="label" for="gyro-2-type">
                  Gyro Pass 2 Type
                  <tooltip entry="filter.gyro_2_type" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input-select
                      class="is-fullwidth"
                      id="gyro-2-type"
                      v-model.number="profile.filter.gyro[1].type"
                      :options="filterTypeOptions"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>

            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label" for="gyro-2-freq">
                  Gyro Pass 2 Freq
                  <tooltip entry="filter.gyro_2_freq" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input
                      class="input"
                      id="gyro-2-freq"
                      type="number"
                      step="5"
                      v-model.number="profile.filter.gyro[1].cutoff_freq"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="column is-6" v-if="profile.filter.dterm">
            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label" for="dterm-1-type">
                  DTerm Pass 1 Type
                  <tooltip entry="filter.dterm_1_type" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input-select
                      class="is-fullwidth"
                      id="dterm-1-type"
                      v-model.number="profile.filter.dterm[0].type"
                      :options="filterTypeOptions"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>

            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label" for="dterm-1-freq">
                  DTerm Pass 1 Freq
                  <tooltip entry="filter.dterm_1_freq" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input
                      class="input"
                      id="dterm-1-freq"
                      type="number"
                      step="5"
                      v-model.number="profile.filter.dterm[0].cutoff_freq"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="field is-horizontal mt-6">
              <div class="field-label">
                <label class="label" for="dterm-2-type">
                  DTerm Pass 2 Type
                  <tooltip entry="filter.dterm_2_type" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input-select
                      class="is-fullwidth"
                      id="dterm-2-type"
                      v-model.number="profile.filter.dterm[1].type"
                      :options="filterTypeOptions"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>

            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label" for="dterm-2-freq">
                  DTerm Pass 2 Freq
                  <tooltip entry="filter.dterm_2_freq" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input
                      class="input"
                      id="dterm-2-freq"
                      type="number"
                      step="5"
                      v-model.number="profile.filter.dterm[1].cutoff_freq"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="field is-horizontal mt-6">
              <div class="field-label">
                <label class="label" for="dterm-dynamic-enable">
                  DTerm Dynamic
                  <tooltip entry="filter.dterm_dynamic_enable" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input-select
                      class="is-fullwidth"
                      id="dterm-dynamic-enable"
                      v-model.number="profile.filter.dterm_dynamic_enable"
                      :options="toggleOptions"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>

            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label" for="dterm-dynamic-min">
                  DTerm Dynamic Min
                  <tooltip entry="filter.dterm_dynamic_min" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input
                      class="input"
                      id="dterm-dynamic-min"
                      type="number"
                      step="5"
                      v-model.number="profile.filter.dterm_dynamic_min"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label" for="dterm-dynamic-max">
                  DTerm Dynamic Max
                  <tooltip entry="filter.dterm_dynamic_max" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input
                      class="input"
                      id="dterm-dynamic-max"
                      type="number"
                      step="5"
                      v-model.number="profile.filter.dterm_dynamic_max"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useProfileStore } from "@/store/profile";

export default defineComponent({
  name: "FilterSettings",
  setup() {
    return {
      profile: useProfileStore(),
    };
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
