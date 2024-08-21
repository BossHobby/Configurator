import {
  Chart as ChartJS,
  Title,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Legend,
  Tooltip,
  CategoryScale,
} from "chart.js";
import "chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm";

ChartJS.register(
  Title,
  Legend,
  Tooltip,
  PointElement,
  LineElement,
  TimeScale,
  LinearScale,
  CategoryScale,
);
