import type { App } from "vue";
import { shallowRef } from "vue";
import { reactive } from "vue";

declare module "vue" {
  interface ComponentCustomProperties {
    $modal: ModalService;
  }
}

class ModalService {
  private state = reactive({
    isShown: false,
    resolve: undefined as any,
    component: undefined,
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
    return new Promise((resolve) => {
      this.state.resolve = resolve;
    });
  }

  public close(data: any) {
    if (this.state.resolve) {
      this.state.resolve(data);
    }
    this.state.isShown = false;
    this.state.component = undefined;
    this.state.resolve = undefined;
    this.state.props = {};
  }
}

export const ModalPlugin = {
  install(app: App): void {
    app.config.globalProperties.$modal = new ModalService();
  },
};
