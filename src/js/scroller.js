import { board, scrollLeftBtn, scrollRightBtn } from "./dom.js";

const SCROLL_STEP = 300;
const EPS = 4;

function updateButtons() {
  const canScroll = board.scrollWidth > board.clientWidth + EPS;
  const atStart = board.scrollLeft <= EPS;
  const atEnd = board.scrollLeft >= board.scrollWidth - board.clientWidth - EPS;

  scrollLeftBtn.classList.toggle("visible", canScroll && !atStart);
  scrollRightBtn.classList.toggle("visible", canScroll && !atEnd);
}

function scrollByAmount(amount) {
  const target = Math.max(0, Math.min(board.scrollLeft + amount, board.scrollWidth - board.clientWidth));
  if (window.gsap) {
    gsap.to(board, { scrollLeft: target, duration: 0.4, ease: "power2.out", onUpdate: updateButtons });
  } else {
    board.scrollLeft = target;
    updateButtons();
  }
}

export function initScroller() {
  scrollLeftBtn.addEventListener("click", () => scrollByAmount(-SCROLL_STEP));
  scrollRightBtn.addEventListener("click", () => scrollByAmount(SCROLL_STEP));
  board.addEventListener("scroll", updateButtons);
  window.addEventListener("resize", updateButtons);
  new ResizeObserver(updateButtons).observe(board);
  updateButtons();
}
