import { defineStore } from "pinia";

const TEMPLATE_URL =
  "https://raw.githubusercontent.com/BossHobby/Templates/master/";

export const useTemplatesStore = defineStore("templates", {
  state: () => ({
    index: [],
  }),
  actions: {
    fetch_templates() {
      return fetch(TEMPLATE_URL + "index.json")
        .then((res) => res.json())
        .then((index) => {
          this.index = index.map((e) => {
            if (e.image) {
              e.image = TEMPLATE_URL + e.image;
            }
            e.profile = TEMPLATE_URL + e.profile;
            return e;
          });
        });
    },
  },
});
