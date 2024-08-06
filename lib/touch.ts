const SWIPE_THRESHOLD = 50; // Minimum difference in pixels at which a swipe gesture is detected

const SWIPE_LEFT = 1;
const SWIPE_RIGHT = 2;
const SWIPE_UP = 3;
const SWIPE_DOWN = 4;

export default class SwipeEvent {
  #startEvent: TouchEvent;
  #endEvent: TouchEvent | null = null;

  constructor(startEvent: TouchEvent) {
    this.#startEvent = startEvent;
  }

  isSwipeLeft() {
    return this.getSwipeDirection() == SWIPE_LEFT;
  }

  isSwipeRight() {
    return this.getSwipeDirection() == SWIPE_RIGHT;
  }

  isSwipeUp() {
    return this.getSwipeDirection() == SWIPE_UP;
  }

  isSwipeDown() {
    return this.getSwipeDirection() == SWIPE_DOWN;
  }

  getSwipeDirection() {
    if (!this.#startEvent.changedTouches || !this.#endEvent!.changedTouches) {
      return null;
    }

    const start = this.#startEvent.changedTouches[0];
    const end = this.#endEvent!.changedTouches[0];

    if (!start || !end) {
      return null;
    }

    const horizontalDifference = start.screenX - end.screenX;
    const verticalDifference = start.screenY - end.screenY;

    // Horizontal difference dominates
    if (Math.abs(horizontalDifference) > Math.abs(verticalDifference)) {
      if (horizontalDifference >= SWIPE_THRESHOLD) {
        return SWIPE_LEFT;
      } else if (horizontalDifference <= -SWIPE_THRESHOLD) {
        return SWIPE_RIGHT;
      }

      // Vertical or no difference dominates
    } else {
      if (verticalDifference >= SWIPE_THRESHOLD) {
        return SWIPE_UP;
      } else if (verticalDifference <= -SWIPE_THRESHOLD) {
        return SWIPE_DOWN;
      }
    }

    return null;
  }

  setEndEvent(endEvent: TouchEvent) {
    this.#endEvent = endEvent;
  }
}
