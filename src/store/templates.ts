import { defineStore } from "pinia";

const isDevelop = import.meta.env.VITE_BRANCH_NAME;

const DEVELOP_TEMPLATE_URL =
  "https://raw.githubusercontent.com/BossHobby/Templates/develop-deploy/";
const MASTER_TEMPLATE_URL =
  "https://raw.githubusercontent.com/BossHobby/Templates/master-deploy/";

export const useTemplatesStore = defineStore("templates", {
  state: () => ({
    index: [],
  }),
  actions: {
    fetch_templates() {
      const url = isDevelop ? DEVELOP_TEMPLATE_URL : MASTER_TEMPLATE_URL;

      return fetch(url + "index.json")
        .then((res) => res.json())
        .then((index) => {
          this.index = index.map((e) => {
            if (e.image) {
              e.image = url + e.image;
            }
            e.profile = url + e.profile;
            return e;
          });
        });
    },
  },
});
