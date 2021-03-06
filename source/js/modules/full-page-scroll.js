import throttle from "lodash/throttle";

export default class FullPageScroll {
  constructor() {
    this.THROTTLE_TIMEOUT = 2000;

    this.screenElements = document.querySelectorAll(
      `.screen:not(.screen--result)`
    );
    this.menuElements = document.querySelectorAll(
      `.page-header__menu .js-menu-link`
    );

    this.activeScreen = 0;
    this.screenName = this.screenElements[this.activeScreen].id;
    this.onScrollHandler = this.onScroll.bind(this);
    this.onUrlHashChengedHandler = this.onUrlHashChanged.bind(this);
  }

  init() {
    const handleWheel = throttle(this.onScrollHandler, this.THROTTLE_TIMEOUT, {
      trailing: true,
    });
    document.addEventListener(`wheel`, handleWheel);
    document.addEventListener(`mousewheel`, handleWheel);
    document.addEventListener(`DOMMouseScroll`, handleWheel);
    window.addEventListener(`popstate`, this.onUrlHashChengedHandler);

    this.onUrlHashChanged();
  }

  onScroll(evt) {
    const delta = (evt.deltaY || -evt.wheelDelta || evt.detail) >> 10 || 1;
    const currentPosition = this.activeScreen;

    this.reCalculateActiveScreenPosition(delta);

    if (currentPosition !== this.activeScreen) {
      this.changePageDisplay();
    }
  }

  onUrlHashChanged() {
    const newIndex = Array.from(this.screenElements).findIndex(
      (screen) => location.hash.slice(1) === screen.id
    );
    this.activeScreen = newIndex < 0 ? 0 : newIndex;
    this.screenName = this.screenElements[this.activeScreen].id;
    this.changePageDisplay();
  }

  changePageDisplay() {
    this.logScreen();
    this.changeVisibilityDisplay();
    this.changeActiveMenuItem();
    this.emitChangeDisplayEvent();
  }

  changeVisibilityDisplay() {
    const newScreen = this.screenElements[this.activeScreen];

    const screenDelay = newScreen.dataset.delay;
    const prevScreen = newScreen.dataset.delayPrevScreen;
    const currentPrevScreen = document.body.dataset.prevScreenName;

    const changeScreen = () => {
      this.screenElements.forEach((screen) => {
        screen.classList.add(`screen--hidden`);
        screen.classList.remove(`active`);
      });

      newScreen.classList.remove(`screen--hidden`);
      newScreen.classList.add(`active`);
    };

    if (screenDelay && prevScreen && prevScreen === currentPrevScreen) {
      setTimeout(changeScreen, screenDelay);

      return;
    }

    changeScreen();
  }

  changeActiveMenuItem() {
    const activeItem = Array.from(this.menuElements).find(
      (item) => item.dataset.href === this.screenElements[this.activeScreen].id
    );
    if (activeItem) {
      this.menuElements.forEach((item) => item.classList.remove(`active`));
      activeItem.classList.add(`active`);
    }
  }

  emitChangeDisplayEvent() {
    const event = new CustomEvent(`screenChanged`, {
      detail: {
        screenId: this.activeScreen,
        screenName: this.screenName,
        screenElement: this.screenElements[this.activeScreen],
      },
    });

    document.body.dispatchEvent(event);
  }

  reCalculateActiveScreenPosition(delta) {
    if (delta > 0) {
      this.activeScreen = Math.min(
        this.screenElements.length - 1,
        ++this.activeScreen
      );
    } else {
      this.activeScreen = Math.max(0, --this.activeScreen);
    }

    this.screenName = this.screenElements[this.activeScreen].id;
  }

  logScreen() {
    if (document.body.dataset.screenName) {
      document.body.dataset.prevScreenName = document.body.dataset.screenName;
    }

    document.body.dataset.screenName = this.screenName;
  }
}
