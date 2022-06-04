const TEMPLATE_URL =
  "https://raw.githubusercontent.com/BossHobby/Templates/master/";

const store = {
  state: {
    index: [],
  },
  mutations: {
    set_templates(state, index) {
      state.index = index.map((e) => {
        if (e.image) {
          e.image = TEMPLATE_URL + e.image;
        }
        e.profile = TEMPLATE_URL + e.profile;
        return e;
      });
    },
  },
  actions: {
    fetch_templates({ commit }) {
      return fetch(TEMPLATE_URL + "index.json")
        .then((res) => res.json())
        .then((json) => commit("set_templates", json));
    },
  },
};

export default store;
