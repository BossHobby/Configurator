import { defineStore } from "pinia";

const isDevelop = import.meta.env.VITE_BRANCH_NAME;

const DEVELOP_TEMPLATE_URL =
  "https://raw.githubusercontent.com/BossHobby/Templates/develop-deploy/";
const MASTER_TEMPLATE_URL =
  "https://raw.githubusercontent.com/BossHobby/Templates/master-deploy/";

export interface TemplateOptionEntry {
  title?: string;
  name: string;
  desc: string;
  selector?: any;
  file: string;
}

export interface TemplateOption {
  name: string;
  title: string;
  desc: string;
  default: string;
  entries: TemplateOptionEntry[];
}

export interface TemplateEntry {
  name: string;
  desc: string;
  options: TemplateOption[];
  category: string;
  profile: string;
  image: string;
}

export function templateUrl(file: string) {
  const url = isDevelop ? DEVELOP_TEMPLATE_URL : MASTER_TEMPLATE_URL;
  return url + file;
}

export const useTemplatesStore = defineStore("templates", {
  state: () => ({
    index: [] as TemplateEntry[],
  }),
  actions: {
    fetch_templates() {
      const url = isDevelop ? DEVELOP_TEMPLATE_URL : MASTER_TEMPLATE_URL;
      return fetch(url + "index.json")
        .then((res) => res.json())
        .then((index) => {
          this.index = index.map((e) => {
            if (e.image) {
              e.image = templateUrl(e.image);
            }
            e.profile = templateUrl(e.profile);
            return e;
          });
        });
    },
  },
});
