import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

import {
  faCircleQuestion,
  faTriangleExclamation,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";

library.add(faCircleQuestion, faTriangleExclamation, faUpload);

export default FontAwesomeIcon;
