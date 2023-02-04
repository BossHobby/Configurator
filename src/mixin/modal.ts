import type { App } from "vue";
import { shallowRef } from "vue";
import { reactive } from "vue";
import { ref } from "vue";

declare module "vue" {
  interface ComponentCustomProperties {
    $modal: ModalService;
  }
}

class ModalService {
  private state = reactive({
    isShown: false,
    component: null,
    props: {},
  });

  public get isShown() {
    return this.state.isShown;
  }

  public get component() {
    return this.state.component;
  }

  public get props() {
    return this.state.props;
  }

  public show(component: any, props: any) {
    this.state.props = props || {};
    this.state.component = shallowRef(component);
    this.state.isShown = true;
  }

  public close() {
    this.state.isShown = false;
    this.state.component = null;
    this.state.props = {};
  }
}

export const ModalPlugin = {
  install(app: App): void {
    app.config.globalProperties.$modal = new ModalService();
  },
};
