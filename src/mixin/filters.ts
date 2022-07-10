import moment from "moment";

export function timeAgo(time) {
  return moment(time).fromNow();
}

export function debounce(fn, delay: number) {
  let timeout;

  return (...args) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
