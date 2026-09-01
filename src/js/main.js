import { applySettings } from "./settings.js";
import { render } from "./board.js";
import { startClock } from "./clock.js";
import { initScroller } from "./scroller.js";

applySettings();
render();
startClock();
initScroller();
