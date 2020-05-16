function mapFieldGetter({ getterType, mutationType }, store, path) {
  const val = store.getters[getterType](path);
  if (Array.isArray(val)) {
    return val.reduce((prev, val, index) => {
      const fieldPath = `${path}.${index}`;
      return Object.defineProperty(prev, index, {
        get() {
          return mapFieldGetter({ getterType }, store, fieldPath)
        },
        set(value) {
          store.commit(mutationType, { path: fieldPath, value });
        }
      });
    }, []);
  } else if (typeof val === 'object') {
    return Object.keys(val).reduce((prev, val) => {
      const fieldPath = `${path}.${val}`;
      return Object.defineProperty(prev, val, {
        get() {
          return mapFieldGetter({ getterType }, store, fieldPath)
        },
        set(value) {
          store.commit(mutationType, { path: fieldPath, value });
        }
      });
    }, {});
  }

  return store.getters[getterType](path);
}

export function mapFields(module, fields) {
  const getterType = `get_${module}_field`;
  const mutationType = `update_${module}_field`;

  return fields.reduce((prev, path) => {
    const key = path.split(".").join("_");
    prev[key] = {
      get() {
        return mapFieldGetter({ getterType, mutationType }, this.$store, path);
      },
      set(value) {
        this.$store.commit(mutationType, { path, value });
      }
    };
    return prev;
  }, {});
}

export function createHelpers(module) {
  return {
    [`get_${module}_field`](state) {
      return (path) => {
        return path.split(".").reduce((prev, key) => prev[key], state);
      }
    },
    [`update_${module}_field`](state, { path, value }) {
      path.split(".").reduce((prev, key, index, array) => {
        if (array.length === index + 1) {
          prev[key] = value;
        }

        return prev[key];
      }, state);
    },
  }
}