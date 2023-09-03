import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

import {
  faCircleQuestion,
  faTriangleExclamation,
  faUpload,
  faCloudMoon,
  faCloudSun,
  faDownload,
  faFileExport,
} from "@fortawesome/free-solid-svg-icons";

import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";

library.add(
  faCircleQuestion,
  faTriangleExclamation,
  faUpload,
  faCloudMoon,
  faCloudSun,
  faDownload,
  faPenToSquare,
  faFileExport
);

export default FontAwesomeIcon;
