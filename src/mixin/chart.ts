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
import "chartjs-adapter-moment";

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
