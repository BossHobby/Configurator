import { serial } from '../serial/serial';
import { QuicVal } from '../serial/quic';

const store = {
  state: {
    counters: [],
  },
  getters: {},
  mutations: {
    set_perf_counters(state, update) {
      state.counters = update;
    },
  },
  actions: {
    fetch_perf_counters({commit}){
      return serial
      .get(QuicVal.PerfCounters)
      .then(p => commit('set_perf_counters', p))
    }
  }
}

export default store;