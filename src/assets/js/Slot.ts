interface SlotConfigurations {
  /** User configuration for maximum item inside a reel */
  maxReelItems?: number;

  /** User configuration for whether winner should be removed from name list */
  removeWinner?: boolean;

  /** User configuration for element selector which reel items should append to */
  reelContainerSelector: string;

  /** User configuration for callback function that runs before spinning reel */
  onSpinStart?: () => void;

  /** User configuration for callback function that runs after spinning reel */
  onSpinEnd?: () => void;

  /** User configuration for callback function that runs after user updates the name list */
  onNameListChanged?: () => void;
}

/** Class for doing random name pick and animation */
export default class Slot {
  private nameList: string[];
  private havePreviousWinner: boolean;
  private reelContainer: HTMLElement | null;
  private maxReelItems: NonNullable<SlotConfigurations['maxReelItems']>;
  private shouldRemoveWinner: NonNullable<SlotConfigurations['removeWinner']>;
  private reelAnimation?: Animation;
  private onSpinStart?: NonNullable<SlotConfigurations['onSpinStart']>;
  private onSpinEnd?: NonNullable<SlotConfigurations['onSpinEnd']>;
  private onNameListChanged?: NonNullable<SlotConfigurations['onNameListChanged']>;

  constructor({
    maxReelItems = 30,
    removeWinner = true,
    reelContainerSelector,
    onSpinStart,
    onSpinEnd,
    onNameListChanged
  }: SlotConfigurations) {
    this.nameList = [];
    this.havePreviousWinner = false;
    this.reelContainer = document.querySelector(reelContainerSelector);
    this.maxReelItems = maxReelItems;
    this.shouldRemoveWinner = removeWinner;
    this.onSpinStart = onSpinStart;
    this.onSpinEnd = onSpinEnd;
    this.onNameListChanged = onNameListChanged;

    this.reelAnimation = this.reelContainer?.animate(
      [
        {
          transform: 'none',
          filter: 'blur(0)'
        },
        {
          transform: `translateY(-${(this.maxReelItems - 1) * (7.5 * 16)}px)`,
          filter: 'blur(1.5px)',
          offset: 0.08
        },
        {
          transform: `translateY(-${(this.maxReelItems - 1) * (7.5 * 16)}px)`,
          filter: 'blur(1px)',
          offset: 0.75
        },
        {
          transform: `translateY(-${(this.maxReelItems - 1) * (7.5 * 16)}px)`,
          filter: 'blur(0)'
        }
      ],
      {
        duration: 20000,
        easing: 'cubic-bezier(0.1, 0.7, 0.2, 1)',
        iterations: 1
      }
    );

    this.reelAnimation?.cancel();
  }

  set names(names: string[]) {
    this.nameList = names;

    const reelItemsToRemove = this.reelContainer?.children
      ? Array.from(this.reelContainer.children)
      : [];

    reelItemsToRemove.forEach((element) => element.remove());

    this.havePreviousWinner = false;

    if (this.onNameListChanged) {
      this.onNameListChanged();
    }
  }

  get names(): string[] {
    return this.nameList;
  }

  set shouldRemoveWinnerFromNameList(removeWinner: boolean) {
    this.shouldRemoveWinner = removeWinner;
  }

  get shouldRemoveWinnerFromNameList(): boolean {
    return this.shouldRemoveWinner;
  }

  private static shuffleNames<T = unknown>(array: T[]): T[] {
    const keys = Object.keys(array) as unknown[] as number[];
    const result: T[] = [];

    for (let k = 0, n = keys.length; k < array.length && n > 0; k += 1) {
      // eslint-disable-next-line no-bitwise
      const i = Math.random() * n | 0;
      const key = keys[i];

      result.push(array[key]);

      n -= 1;

      const tmp = keys[n];
      keys[n] = key;
      keys[i] = tmp;
    }

    return result;
  }

  public async spin(durationInSeconds = 20): Promise<boolean> {
    if (!this.nameList.length) {
      console.error('Name List is empty. Cannot start spinning.');
      return false;
    }

    if (this.onSpinStart) {
      this.onSpinStart();
    }

    const { reelContainer, reelAnimation, shouldRemoveWinner } = this;

    if (!reelContainer || !reelAnimation) {
      return false;
    }

    // Use the duration selected in Settings.
    reelAnimation.effect?.updateTiming({
      duration: durationInSeconds * 1000
    });

    let randomNames = Slot.shuffleNames<string>(this.nameList);

    while (randomNames.length && randomNames.length < this.maxReelItems) {
      randomNames = [...randomNames, ...randomNames];
    }

    randomNames = randomNames.slice(
      0,
      this.maxReelItems - Number(this.havePreviousWinner)
    );

    const fragment = document.createDocumentFragment();

    randomNames.forEach((name) => {
      const newReelItem = document.createElement('div');
      newReelItem.innerHTML = name;
      fragment.appendChild(newReelItem);
    });

    reelContainer.appendChild(fragment);

    console.info('Displayed items: ', randomNames);
    console.info('Winner: ', randomNames[randomNames.length - 1]);

    if (shouldRemoveWinner) {
      this.nameList.splice(
        this.nameList.findIndex(
          (name) => name === randomNames[randomNames.length - 1]
        ),
        1
      );
    }

    console.info('Remaining: ', this.nameList);

    const animationPromise = new Promise<void>((resolve) => {
      reelAnimation.onfinish = () => resolve();
    });

    reelAnimation.play();

    await animationPromise;

    reelAnimation.finish();

    Array.from(reelContainer.children)
      .slice(0, reelContainer.children.length - 1)
      .forEach((element) => element.remove());

    this.havePreviousWinner = true;

    if (this.onSpinEnd) {
      this.onSpinEnd();
    }

    return true;
  }
}
