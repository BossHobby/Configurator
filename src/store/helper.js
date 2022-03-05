function mapFieldGetter({ module, getterType, mutationType }, store, path) {
  const val = store.getters[getterType](path);
  if (Array.isArray(val)) {
    return val.reduce((prev, val, index) => {
      const fieldPath = `${path}.${index}`;
      return Object.defineProperty(prev, index, {
        enumerable: true,

        get() {
          return mapFieldGetter({ module, getterType, mutationType }, store, fieldPath)
        },
        set(value) {
          store.commit(mutationType, { path: fieldPath, value });
          store.commit('track_key_change', module + '.' + fieldPath);
        }
      }, {
        enumerable: true
      });
    }, []);
  } else if (typeof val === 'object') {
    return Object.keys(val).reduce((prev, val) => {
      const fieldPath = `${path}.${val}`;
      return Object.defineProperty(prev, val, {
        enumerable: true,

        get() {
          return mapFieldGetter({ module, getterType, mutationType }, store, fieldPath)
        },
        set(value) {
          store.commit(mutationType, { path: fieldPath, value });
          store.commit('track_key_change', module + '.' + fieldPath);
        }
      });
    }, {});
  }

  return store.getters[getterType](path);
}

export function mapFields(module, fields) {
  const getterType = `get_${module}_field`;
  const mutationType = `update_${module}_field`;

  let entries = []
  if (Array.isArray(fields)) {
    entries = fields.map(path => {
      return {
        key: path.split('.').join('_'),
        path: path,
      }
    })
  } else {
    for (const key in fields) {
      entries.push({
        key: key,
        path: fields[key],
      })
    }
  }

  return entries.reduce((prev, e) => {
    prev[e.key] = {
      get() {
        return mapFieldGetter({ module, getterType, mutationType }, this.$store, e.path);
      },
      set(value) {
        this.$store.commit(mutationType, { path: e.path, value });
        this.$store.commit('track_key_change', module + '.' + e.path);
      }
    };
    return prev;
  }, {});
}

export function createHelpers(module) {
  return {
    [`get_${module}_field`](state) {
      return (path) => {
        return path.split('.').reduce((prev, key) => prev[key], state);
      }
    },
    [`update_${module}_field`](state, { path, value }) {
      path.split('.').reduce((prev, key, index, array) => {
        if (array.length === index + 1) {
          prev[key] = value;
        }

        return prev[key];
      }, state);
    },
  }
}